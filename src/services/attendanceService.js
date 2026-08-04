/**
 * ============================================================================
 * attendanceService.js
 * ----------------------------------------------------------------------------
 *
 * ⚠️ ملاحظة مهمة جداً:
 * توثيق الـ API لم يحدد شكل عنصر السجل (attendance record) القادم من
 * GET /attendance بالتفصيل (فقط "Paginated attendance records" بدون schema).
 * لذلك تم افتراض شكل منطقي للـ Resource اعتماداً على الحقول الظاهرة بباقي
 * الـ endpoints (مثل new_check_in/new_check_out بتابع adjust، وأسماء فئات
 * stats). هذا الافتراض معزول بالكامل داخل normalizeAttendanceRecord() فقط.
 * إذا اختلف شكل الاستجابة الحقيقي، التعديل يكون هنا فقط ولن يؤثر على أي
 * مكوّن Vue آخر (كل الواجهات تعتمد على الشكل الموحّد الذي يُرجعه هذا التابع).
 * ============================================================================
 */
import api from './api'
// ⚠️ عدّلي المسار أعلاه ليطابق ملف axios instance الفعلي عندك
// (نفس الـ instance المستخدم بباقي ملفات services بالمشروع، مع الـ base URL
// وheaders التوثيق Sanctum الجاهزة).

const BASE_URL = '/management/attendance'

/**
 * جلب قائمة سجلات الحضور (Paginated) مع إمكانية الفلترة بالتاريخ/القسم/الموظف.
 * HR Manager و General Manager يشاهدان كل الشركة، بينما Department Manager
 * يُقيَّد تلقائياً بأقسامه من طرف الباك اند (لا حاجة لأي منطق فرونت اند إضافي).
 *
 * @param {Object} params
 * @param {string} [params.date]         - تاريخ محدد (YYYY-MM-DD)
 * @param {string} [params.date_from]    - بداية مدى تاريخي
 * @param {string} [params.date_to]      - نهاية مدى تاريخي
 * @param {string} [params.department_id]
 * @param {string} [params.employee_id]
 * @param {number} [params.per_page=15]
 * @param {number} [params.page]
 * @returns {Promise<{records: Array<Object>, meta: Object}>}
 */
export async function getAttendanceRecords(params = {}) {
  const { data } = await api.get(BASE_URL, { params })

  // الباك اند لم يوثّق الشكل الدقيق للاستجابة، لذلك نتعامل بمرونة مع أكثر
  // من احتمال شائع بمشاريع Laravel (resource collection مع/بدون success wrapper)
  const rawList = data?.data?.data ?? data?.data ?? data ?? []
  const rawMeta =
    data?.data?.meta ??
    data?.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: params.per_page || 15,
      total: Array.isArray(rawList) ? rawList.length : 0,
    }

  return {
    records: Array.isArray(rawList) ? rawList.map(normalizeAttendanceRecord) : [],
    meta: rawMeta,
  }
}

/**
 * جلب الإحصائيات الجاهزة من الباك اند (present / late / early_leave / absent /
 * off_day / total_records). شكل هذه الاستجابة موثّق بدقة بملف الـ API، فلا
 * حاجة لأي افتراض هنا (خلافاً لتابع getAttendanceRecords أعلاه).
 * تفتَرِض الإحصائيات "اليوم الحالي" إذا لم تُمرَّر أي فلترة تاريخ.
 */
export async function getAttendanceStats(params = {}) {
  const { data } = await api.get(`${BASE_URL}/stats`, { params })
  const stats = data?.data || {}
  return {
    present: stats.present ?? 0,
    late: stats.late ?? 0,
    earlyLeave: stats.early_leave ?? 0,
    absent: stats.absent ?? 0,
    offDay: stats.off_day ?? 0,
    totalRecords: stats.total_records ?? 0,
  }
}

/**
 * جلب رمز QR الدوّار (يتغيّر كل 60 ثانية) لعرضه على شاشة/كشك تسجيل الحضور.
 * غير مُستخدَم حالياً بواجهة "Attendance Tracker" الإدارية (dashboard) لأن
 * التصميم المرفق لا يتضمن عرض كشك، لكنه أُضيف هنا لاكتمال التغطية مع الباك
 * اند، ويمكن استدعاؤه لاحقاً من أي واجهة kiosk مستقبلية دون أي تعديل إضافي.
 */
export async function getAttendanceQrCode() {
  const { data } = await api.get(`${BASE_URL}/qr-code`)
  const payload = data?.data || {}
  return {
    token: payload.token,
    qrImage: payload.qr_image, // data:image/png;base64,...
    expiresInSeconds: payload.expires_in_seconds,
  }
}

/**
 * تعديل يدوي (Exceptional Override) لسجل حضور موجود (صلاحية HR / General
 * Manager فقط بحسب توثيق الباك اند).
 *
 * @param {string} attendanceRecordId
 * @param {Object} payload
 * @param {string|null} payload.newCheckIn  - ISO datetime أو null (بدون تغيير)
 * @param {string|null} payload.newCheckOut - ISO datetime أو null (بدون تغيير)
 * @param {string} payload.reason           - سبب التعديل (إلزامي)
 */
export async function adjustAttendanceRecord(attendanceRecordId, payload) {
  const { data } = await api.put(`${BASE_URL}/${attendanceRecordId}/adjust`, {
    new_check_in: payload.newCheckIn ?? null,
    new_check_out: payload.newCheckOut ?? null,
    reason: payload.reason,
  })
  return data?.data ? normalizeAttendanceRecord(data.data) : null
}

/**
 * تطبيع (normalize) عنصر سجل حضور واحد قادم من الباك اند إلى شكل ثابت تعتمد
 * عليه كل مكوّنات الواجهة. هذا هو المكان الوحيد الذي يجب تعديله إذا اختلفت
 * أسماء الحقول الحقيقية القادمة من الـ API الفعلي.
 */
function normalizeAttendanceRecord(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    date: raw.work_date ?? null, 
    employeeId: raw.employee_id ?? null,
    employeeName: raw.employee_name ?? '—', 
    employeeTitle: '', 
    employeeAvatar: null,
    departmentId: null,
    departmentName: raw.department_name ?? '—', 
    checkIn: raw.check_in_time ?? null, 
    checkOut: raw.check_out_time ?? null, 
    status: raw.status ?? 'absent',
    attendanceType: raw.attendance_type,
    lateMinutes: raw.late_minutes ?? 0,
    earlyLeaveMinutes: raw.early_leave_minutes ?? 0,
    totalWorkMinutes: raw.total_work_minutes ?? 0,
  }
}

/**
 * دمج تاريخ سجل الحضور (YYYY-MM-DD) مع وقت مُنتقى من الساعة التناظرية
 * (Analog Clock Picker) لإنتاج ISO datetime صالح لإرساله بتابع
 * adjustAttendanceRecord() (new_check_in / new_check_out).
 * @param {string} dateOnly  - "YYYY-MM-DD"
 * @param {{hours:number, minutes:number, period:'AM'|'PM'}} time
 * @returns {string|null} ISO datetime أو null إذا لم تتوفر بيانات كافية
 */
export function buildIsoDateTime(dateOnly, time) {
  if (!dateOnly || !time) return null
  const { hours, minutes, period } = time
  let h24 = hours % 12
  if (period === 'PM') h24 += 12
  const hh = String(h24).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  return `${dateOnly}T${hh}:${mm}:00`
}

/**
 * تفكيك ISO datetime (أو نص جاهز مثل "09:12 AM") قادم من الباك اند إلى بنية
 * {hours, minutes, period} تفهمها الساعة التناظرية Vue Component. تُستخدم
 * لتعبئة القيم الحالية عند فتح مودال التعديل، وأيضاً لعرض الوقت بالجدول.
 */
export function parseTimeForClock(isoOrLabel) {
  if (!isoOrLabel) return { hours: 9, minutes: 0, period: 'AM' }

  // الحالة الأولى: ISO datetime كاملة (مثال: 2026-08-02T09:12:00)
  const isoMatch = isoOrLabel.match(/T(\d{2}):(\d{2})/)
  if (isoMatch) {
    let h = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10)
    const period = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    return { hours: h, minutes: m, period }
  }

  // الحالة الثانية: نص جاهز مثل "09:12 AM"
  const labelMatch = isoOrLabel.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (labelMatch) {
    return {
      hours: parseInt(labelMatch[1], 10),
      minutes: parseInt(labelMatch[2], 10),
      period: labelMatch[3].toUpperCase(),
    }
  }

  return { hours: 9, minutes: 0, period: 'AM' }
}

export default {
  getAttendanceRecords,
  getAttendanceStats,
  getAttendanceQrCode,
  adjustAttendanceRecord,
  buildIsoDateTime,
  parseTimeForClock,
}
