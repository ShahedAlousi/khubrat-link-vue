/**
 * ============================================================================
 * stores/attendance.js
 * ============================================================================
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as attendanceService from '@/services/attendanceService'

export const useAttendanceStore = defineStore('attendance', () => {

  const records = ref([]) // سجلات الصفحة الحالية بعد الفلترة
  const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const stats = ref({ present: 0, late: 0, earlyLeave: 0, absent: 0, offDay: 0, totalRecords: 0 })

  const filters = ref({
    date: new Date().toISOString().slice(0, 10), // اليوم الحالي افتراضياً (Daily Attendance Log)
    date_from: null,
    date_to: null,
    department_id: 'all',
    employee_id: null,
    per_page: 15,
    page: 1,
  })

  // مؤشرات تحميل منفصلة لكل عملية على حدة (وليس flag واحد مشترك) -- تفادياً
  // لنفس مشكلة الحلقة اللانهائية (infinite loop) التي واجهتها سابقاً بستور
  // الـ Evaluation Hub بسبب استخدام loading واحد لعدة تبويبات/عمليات معاً.
  const loadingRecords = ref(false)
  const loadingStats = ref(false)
  const isAdjusting = ref(false)
  const errorMessage = ref('')

    // ---- حالة شاشة Kiosk (GET /management/attendance/qr-code) ----
    const qrToken = ref('')
    const qrImage = ref('')     // data:image/png;base64,...
    const qrExpiresIn = ref(0)  // عدّاد تنازلي بالثواني، يُحدَّث محلياً
    const loadingQr = ref(false)
    let qrCountdownTimer = null // ليس ref لأنه لا يُعرض بالواجهة

  // --------------------------------------------------------------------
  // Getters محسوبة (Computed)
  // --------------------------------------------------------------------

  /**
   * توزيع طريقة توثيق الحضور (بصمة رقمية QR مقابل تعديل يدوي Manual) --
   * محسوب بالكامل من الفرونت اند اعتماداً على سجلات الصفحة الحالية المُحمَّلة،
   * لأن الباك اند لا يوفر إحصائية جاهزة لهذا التوزيع (فقط فئات
   * present/late/absent/early_leave/off_day عبر /stats).
   * ⚠️ بالتالي هذه النسبة تعكس فقط السجلات المعروضة حالياً (صفحة واحدة من
   * الـ pagination) وليست شاملة لكل سجلات الشركة/التاريخ المُفلتَر.
   */
  const complianceBreakdown = computed(() => {
    const digital = records.value.filter((r) => r.checkInMethod === 'qr').length
    const manual = records.value.filter((r) => r.checkInMethod === 'manual').length
    const totalVerified = digital + manual
    return {
      digital,
      manual,
      totalVerified,
      digitalPercent: totalVerified ? Math.round((digital / totalVerified) * 100) : 0,
      manualPercent: totalVerified ? Math.round((manual / totalVerified) * 100) : 0,
    }
  })

  // --------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------

  /** بناء query params فعلية من كائن الفلاتر (يُستثنى department_id='all') */
  function buildQueryFromFilters(excludePagination = false) {
    const f = filters.value
    const query = {
      date: f.date || undefined,
      date_from: f.date_from || undefined,
      date_to: f.date_to || undefined,
      department_id: f.department_id && f.department_id !== 'all' ? f.department_id : undefined,
      employee_id: f.employee_id || undefined,
    }
    if (!excludePagination) {
      query.per_page = f.per_page
      query.page = f.page
    }
    return query
  }

  /** جلب سجلات الحضور من الباك اند حسب الفلاتر الحالية بالـ store */
  async function fetchRecords() {
    loadingRecords.value = true
    errorMessage.value = ''
    try {
      const query = buildQueryFromFilters()
      const { records: list, meta: pageMeta } = await attendanceService.getAttendanceRecords(query)
      records.value = list
      meta.value = pageMeta
    } catch (err) {
      errorMessage.value = 'Failed to load attendance records. Please try again.'
      console.error('[attendance store] fetchRecords failed:', err)
    } finally {
      loadingRecords.value = false
    }
  }

  /** جلب الإحصائيات الجاهزة (present/late/absent/early_leave/off_day/total) */
  async function fetchStats() {
    loadingStats.value = true
    try {
      // نستثني الترقيم من طلب الإحصائيات لأنها تخص كل السجلات المطابقة للفلتر
      // وليس فقط الصفحة المعروضة بالجدول
      const query = buildQueryFromFilters(true)
      stats.value = await attendanceService.getAttendanceStats(query)
    } catch (err) {
      console.error('[attendance store] fetchStats failed:', err)
    } finally {
      loadingStats.value = false
    }
  }

  /** جلب السجلات والإحصائيات معاً -- يُستدعى عند فتح الصفحة أو تغيير الفلاتر */
  async function refreshAll() {
    await Promise.all([fetchRecords(), fetchStats()])
  }

  /**
   * حفظ تعديل استثنائي (Exceptional Override) لسجل حضور واحد.
   * لا يوجد أي حقل "status" هنا -- الباك اند يعيد احتساب الحالة تلقائياً،
   * لذلك نُعيد تحميل البيانات كاملة بعد نجاح الحفظ لضمان مطابقة الحالة
   * المعروضة بالجدول لما احتسبه الباك اند فعلياً.
   * @returns {Promise<boolean>} نجاح العملية من عدمه
   */
  async function adjustRecord(attendanceRecordId, { newCheckIn, newCheckOut, reason }) {
    isAdjusting.value = true
    try {
      await attendanceService.adjustAttendanceRecord(attendanceRecordId, {
        newCheckIn,
        newCheckOut,
        reason,
      })
      await refreshAll()
      return true
    } catch (err) {
      errorMessage.value = 'Failed to save the override. Please check the details and try again.'
      console.error('[attendance store] adjustRecord failed:', err)
      return false
    } finally {
      isAdjusting.value = false
    }
  }

  /** تحديث الفلاتر (تاريخ/قسم/موظف) وإعادة الجلب تلقائياً من الصفحة الأولى */
  function setFilter(patch) {
    filters.value = { ...filters.value, ...patch, page: 1 }
    refreshAll()
  }

  /** الانتقال لصفحة أخرى بالجدول (لا يؤثر على الإحصائيات، فقط على السجلات) */
  function goToPage(page) {
    if (page < 1 || page > meta.value.last_page) return
    filters.value.page = page
    fetchRecords()
  }

  /** جلب صورة QR جديدة + التوكن ووقت انتهائه من الباك اند */
  async function fetchQrCode() {
    loadingQr.value = true
    try {
      const { token, qrImage: image, expiresInSeconds } = await attendanceService.getAttendanceQrCode()
      qrToken.value = token
      qrImage.value = image
      qrExpiresIn.value = expiresInSeconds
    } catch (err) {
      console.error('[attendance store] fetchQrCode failed:', err)
    } finally {
      loadingQr.value = false
    }
  }

  /**
   * تشغيل التحديث التلقائي لشاشة الـ Kiosk: نجلب كوداً فوراً، ثم نُنقص
   * qrExpiresIn ثانية بثانية محلياً بدون طلب شبكة، وعند وصوله للصفر نطلب
   * كوداً جديداً تلقائياً (الباك اند يجدده فعلياً كل 60 ثانية).
   */
  function startQrAutoRefresh() {
    stopQrAutoRefresh() // تفادي تشغيل أكثر من interval بنفس الوقت
    fetchQrCode()
    qrCountdownTimer = setInterval(() => {
      if (qrExpiresIn.value > 0) {
        qrExpiresIn.value -= 1
      } else {
        fetchQrCode()
      }
    }, 1000)
  }

  /** إيقاف التحديث التلقائي -- استدعيه إلزامياً عند إغلاق شاشة الـ Kiosk */
  function stopQrAutoRefresh() {
    if (qrCountdownTimer) {
      clearInterval(qrCountdownTimer)
      qrCountdownTimer = null
    }
  }

  return {
    // state
    records,
    meta,
    stats,
    filters,
    loadingRecords,
    loadingStats,
    isAdjusting,
    errorMessage,
    // computed
    complianceBreakdown,
    // actions
    fetchRecords,
    fetchStats,
    refreshAll,
    adjustRecord,
    setFilter,
    goToPage,

    // kiosk QR state + actions
    qrToken,
    qrImage,
    qrExpiresIn,
    loadingQr,
    fetchQrCode,
    startQrAutoRefresh,
    stopQrAutoRefresh,
  }
})
