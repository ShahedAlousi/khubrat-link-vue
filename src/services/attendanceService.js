/**
 * ============================================================================
 * attendanceService.js
 * ----------------------------------------------------------------------------
 * ✅ مُحدَّث اعتماداً على توثيق الـ API الفعلي (roster / stats / adjust) بعد
 * ما تأكدنا من الشكل الحقيقي للاستجابات. أهم فرق: تابع getAttendanceRecords
 * القديم (GET /management/attendance) أُزيل نهائياً واستُبدل بـ
 * getAttendanceRoster() (GET /management/attendance/roster) لأن الـ roster
 * يُرجع كل الموظفين النشطين لليوم (بمن فيهم من لم يصل بعد / بإجازة) مع
 * display_status جاهز، بينما القديم يُرجع فقط صفوف attendance_records
 * الموجودة فعلياً -- وبالتالي كان الغائبون/من لم يصل يختفون من الجدول.
 * ============================================================================
 */
import api from './api'

const BASE_URL = '/management/attendance'

/**
 * جلب "الروستر" اليومي (Daily Attendance Log الحقيقي): كل الموظفين النشطين
 * بتاريخ واحد مع display_status محسوب من الباك اند (present / late / absent /
 * early_leave / off_day / not_arrived / on_leave).
 * ⚠️ هذا الـ endpoint يقبل فقط: date, department_id, employee_id, per_page,
 * page -- لا يدعم date_from/date_to (تاريخ واحد فقط، وليس مدى تاريخي).
 *
 * @param {Object} params
 * @param {string} [params.date]
 * @param {string} [params.department_id]
 * @param {string} [params.employee_id]
 * @param {number} [params.per_page=15]
 * @param {number} [params.page]
 * @returns {Promise<{date: string|null, records: Array<Object>, meta: Object}>}
 */
export async function getAttendanceRoster(params = {}) {
  const { data } = await api.get(`${BASE_URL}/roster`, { params })
  const payload = data?.data || {}
  const items = Array.isArray(payload.items) ? payload.items : []

  return {
    date: payload.date ?? null,
    records: items.map(normalizeRosterItem),
    meta:
      payload.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: params.per_page || 15,
        total: items.length,
      },
  }
}

/**
 * جلب الإحصائيات الجاهزة لتاريخ/مدى تاريخي (present/late/early_leave/absent/
 * not_arrived/on_leave/off_day/total_employees/total_records).
 * ⚠️ هذا الـ endpoint يقبل: date, date_from, date_to, department_id فقط --
 * لا يدعم employee_id (خلافاً لما كان مفترَضاً سابقاً).
 * تفتَرِض "اليوم الحالي" إذا لم تُمرَّر أي فلترة تاريخ.
 */
export async function getAttendanceStats(params = {}) {
  const { data } = await api.get(`${BASE_URL}/stats`, { params })
  const stats = data?.data || {}
  return {
    present: stats.present ?? 0,
    late: stats.late ?? 0,
    earlyLeave: stats.early_leave ?? 0,
    absent: stats.absent ?? 0,
    notArrived: stats.not_arrived ?? 0,
    onLeave: stats.on_leave ?? 0,
    offDay: stats.off_day ?? 0,
    totalEmployees: stats.total_employees ?? 0,
    // عدد الموظفين اللي عندهم صف attendance_records فعلي محفوظ لهذا التاريخ
    // (مو بالضرورة يساوي مجموع الفئات أعلاه -- راجعي التعليق بالـ store)
    totalRecords: stats.total_records ?? 0,
  }
}

/**
 * جلب رمز QR الدوّار (يتغيّر كل 60 ثانية) لعرضه على شاشة/كشك تسجيل الحضور.
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
 * تعديل يدوي (Exceptional Override) لسجل حضور موجود فعلياً (صلاحية HR /
 * General Manager فقط). يتطلب attendanceRecordId حقيقي -- موظف بدون سجل
 * (not_arrived / on_leave، أي attendance_record_id = null بالروستر) لا يمكن
 * تعديله عبر هذا التابع أصلاً لأن الباك اند يطلبه بمسار الرابط (path param)
 * ويرجع 404 لو غير موجود.
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
  // ⚠️ شكل استجابة هذا التابع غير موثّق بدقة بملف الـ API (فقط وصف نصي "Record
  // adjusted and minutes recalculated" بدون schema)، لذلك لا نحاول تطبيعه لشكل
  // موحّد هنا. غير حرج لأن الـ store يستدعي refreshAll() فوراً بعد النجاح
  // ويُعيد تحميل كل شيء من الروستر/الإحصائيات على أي حال.
  return data?.data ?? null
}

/**
 * تطبيع (normalize) عنصر واحد قادم من GET /management/attendance/roster إلى
 * شكل ثابت تعتمد عليه كل مكوّنات الواجهة. هذا هو المكان الوحيد الذي يجب
 * تعديله إذا اختلفت أسماء الحقول الحقيقية القادمة من الـ API الفعلي.
 */
function normalizeRosterItem(raw) {
  if (!raw) return null
  return {
    // ⚠️ قد تكون null لموظف لم يصل بعد أو بإجازة (لا يوجد سجل attendance_record
    // فعلي له بعد بهذا التاريخ) -- استخدمي هذا الحقل تحديداً لأي عملية adjust،
    // وليس employeeId
    attendanceRecordId: raw.attendance_record_id ?? null,
    employeeId: raw.employee_id ?? null,
    employeeName: raw.employee_name ?? '—',
    employeeTitle: '', // غير موجود بالـ roster -- لو احتجناه لاحقاً لازم دمج مع staff API
    employeeAvatar: null, // غير موجود بالـ roster
    departmentId: raw.department_id ?? null,
    departmentName: raw.department_name ?? '—',
    date: raw.work_date ?? null,
    checkIn: raw.check_in_time ?? null,
    checkOut: raw.check_out_time ?? null,
    // display_status هو الحقل المُعتمَد لعرض شارة الحالة بالجدول (يشمل
    // not_arrived و on_leave خلافاً لحقل status الخام اللي يعكس فقط ما هو
    // مخزّن فعلياً بجدول attendance_records، ويكون null لمن لا سجل له)
    displayStatus: raw.display_status ?? 'not_arrived',
    rawStatus: raw.status ?? null,
    attendanceType: raw.attendance_type ?? null,
    leaveTypeName: raw.leave_type_name ?? null, // مثال: "Annual Leave" لحالة on_leave فقط
    lateMinutes: raw.late_minutes ?? 0,
    earlyLeaveMinutes: raw.early_leave_minutes ?? 0,
    totalWorkMinutes: raw.total_work_minutes ?? null,
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
 * تفكيك تاريخ/وقت قادم من الباك اند إلى بنية {hours, minutes, period} تفهمها
 * الساعة التناظرية Vue Component. تُستخدم لتعبئة القيم الحالية عند فتح مودال
 * التعديل، وأيضاً لعرض الوقت بالجدول.
 * ✅ مُصحَّح: الباك اند الفعلي يُرجع check_in_time/check_out_time بصيغة
 * "YYYY-MM-DD HH:mm:ss" (مسافة، وليس حرف T)، فعدّلنا الـ regex ليقبل الاثنين.
 */
export function parseTimeForClock(isoOrLabel) {
  if (!isoOrLabel) return { hours: 9, minutes: 0, period: 'AM' }

  // الحالة الأولى: تاريخ+وقت كامل، سواء بصيغة ISO (T) أو صيغة Laravel/Carbon
  // الافتراضية (مسافة) -- مثال: "2026-08-14T09:12:00" أو "2026-08-14 09:12:00"
  const isoMatch = isoOrLabel.match(/[T ](\d{2}):(\d{2})/)
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
  getAttendanceRoster,
  getAttendanceStats,
  getAttendanceQrCode,
  adjustAttendanceRecord,
  buildIsoDateTime,
  parseTimeForClock,
}