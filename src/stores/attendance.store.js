/**
 * ============================================================================
 * stores/attendance.js
 * ============================================================================
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as attendanceService from '@/services/attendanceService'

export const useAttendanceStore = defineStore('attendance', () => {

  const records = ref([]) // عناصر الروستر لصفحة/فلتر اليوم الحالي (يشمل not_arrived/on_leave أيضاً)
  const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  const stats = ref({
    present: 0,
    late: 0,
    earlyLeave: 0,
    absent: 0,
    notArrived: 0,
    onLeave: 0,
    offDay: 0,
    totalEmployees: 0,
    totalRecords: 0,
  })

  const filters = ref({
    date: new Date().toISOString().slice(0, 10), // اليوم الحالي افتراضياً (Daily Attendance Log)
    date_from: null, // مُستخدَم فقط بطلب /stats (الروستر لا يدعم مدى تاريخي)
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
   * توزيع كل فئات الحالة (present/late/early_leave/absent/not_arrived/
   * on_leave) كنسبة من إجمالي الموظفين النشطين -- محسوب من /stats مباشرة
   * (وليس من records المعروضة بالصفحة الحالية)، لذلك يعكس اليوم/الفلتر كاملاً
   * بغض النظر عن الترقيم (pagination).
   * ⚠️ لاحظي: هذه الفئات مجتمعة يجب أن تساوي تقريباً totalEmployees (كل فئة
   * تمثّل موظف واحد بحالة واحدة فقط، خلافاً لـ totalRecords اللي معناه مختلف
   * -- "عدد من عنده صف attendance_records محفوظ فعلياً").
   */
  const statusDistribution = computed(() => {
    const s = stats.value
    const total = s.totalEmployees || 0
    const percentOf = (n) => (total ? Math.round((n / total) * 100) : 0)
    return {
      total,
      present: s.present, presentPercent: percentOf(s.present),
      late: s.late, latePercent: percentOf(s.late),
      earlyLeave: s.earlyLeave, earlyLeavePercent: percentOf(s.earlyLeave),
      absent: s.absent, absentPercent: percentOf(s.absent),
      notArrived: s.notArrived, notArrivedPercent: percentOf(s.notArrived),
      onLeave: s.onLeave, onLeavePercent: percentOf(s.onLeave),
      offDay: s.offDay, offDayPercent: percentOf(s.offDay),
    }
  })

  // --------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------

  /** بناء query params لطلب الروستر (لا يدعم date_from/date_to) */
  function buildRosterQuery() {
    const f = filters.value
    return {
      date: f.date || undefined,
      department_id: f.department_id && f.department_id !== 'all' ? f.department_id : undefined,
      employee_id: f.employee_id || undefined,
      per_page: f.per_page,
      page: f.page,
    }
  }

  /** بناء query params لطلب /stats (لا يدعم employee_id، لكنه يدعم مدى تاريخي) */
  function buildStatsQuery() {
    const f = filters.value
    return {
      date: f.date || undefined,
      date_from: f.date_from || undefined,
      date_to: f.date_to || undefined,
      department_id: f.department_id && f.department_id !== 'all' ? f.department_id : undefined,
    }
  }

  /**
   * جلب الروستر اليومي (كل الموظفين + display_status) حسب الفلاتر الحالية.
   * هذا هو مصدر بيانات "Daily Attendance Log" الآن (بدّلناه من GET
   * /management/attendance القديم لأنه كان يُخفي الغائبين/من لم يصل بعد).
   */
  async function fetchRecords() {
    loadingRecords.value = true
    errorMessage.value = ''
    try {
      const query = buildRosterQuery()
      const { records: list, meta: pageMeta } = await attendanceService.getAttendanceRoster(query)
      records.value = list
      meta.value = pageMeta
    } catch (err) {
      errorMessage.value = 'Failed to load attendance records. Please try again.'
      console.error('[attendance store] fetchRecords failed:', err)
    } finally {
      loadingRecords.value = false
    }
  }

  /** جلب الإحصائيات الجاهزة (present/late/absent/early_leave/not_arrived/on_leave/off_day) */
  async function fetchStats() {
    loadingStats.value = true
    try {
      const query = buildStatsQuery()
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
    if (!attendanceRecordId) {
      // موظف بدون سجل فعلي (not_arrived / on_leave) -- لا يوجد id لإرساله بالمسار
      errorMessage.value = 'This employee has no attendance record yet for this date.'
      return false
    }
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

  /**
   * تسجيل حضور يدوي لموظف ليس لديه attendance_record بعد لهذا التاريخ
   * (POST /management/attendance/register).
   * @returns {Promise<boolean>}
   */
  async function registerRecord({ employeeId, workDate, checkInTime, checkOutTime, reason }) {
    if (!employeeId || !workDate) {
      errorMessage.value = 'Employee and work date are required to register attendance.'
      return false
    }
    isAdjusting.value = true
    try {
      await attendanceService.registerAttendance({
        employeeId,
        workDate,
        checkInTime,
        checkOutTime,
        reason,
      })
      await refreshAll()
      return true
    } catch (err) {
      errorMessage.value =
        err.message || 'Failed to register attendance. Please check the details and try again.'
      console.error('[attendance store] registerRecord failed:', err)
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
    statusDistribution,
    // actions
    fetchRecords,
    fetchStats,
    refreshAll,
    adjustRecord,
    registerRecord,
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