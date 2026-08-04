import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { attendancePolicyService } from '@/services/attendancePolicy.service'

const DEFAULT_POLICY = {
  work_start_time: '09:00:00',
  work_end_time: '17:00:00',
  allowed_late_minutes: 15,
  allowed_early_leave_minutes: 15,
  allows_overtime: true,
  allowed_perimeter: 150,
  latitude: 33.5138,
  longitude: 36.2765
}

export const useAttendancePolicyStore = defineStore('attendancePolicy', () => {
  const policy = reactive({ ...DEFAULT_POLICY })
  const savingPolicy = ref(false)
  const savingLocation = ref(false)
  const error = ref(null)


  async function saveAttendancePolicy(companyId, payload) {
    savingPolicy.value = true
    error.value = null
    try {
      if (
        payload.allowed_late_minutes === '' || 
        payload.allowed_late_minutes === null || 
        payload.allowed_late_minutes === undefined
      ) {
        throw new Error('Please enter the allowed delay limit (you can type 0 but cannot leave it blank).')
      }
  
      // 2. التحقق الصارم من حقل "حد الانصراف المبكر" (يمنع الفراغ ويسمح بالـ 0)
      if (
        payload.allowed_early_leave_minutes === '' || 
        payload.allowed_early_leave_minutes === null || 
        payload.allowed_early_leave_minutes === undefined
      ) {
        throw new Error('Please enter the allowed early departure limit (you can write 0 but it cannot be left blank).')
      }
  
      // 3. بناء الـ Payload بعد ضمان سلامة البيانات وتحويلها رقمياً
      const policyPayload = {
        work_start_time: payload.work_start_time,
        work_end_time: payload.work_end_time,
        allowed_late_minutes: Number(payload.allowed_late_minutes),
        allowed_early_leave_minutes: Number(payload.allowed_early_leave_minutes),
        allows_overtime: Boolean(payload.allows_overtime)
      }
  
      const result = await attendancePolicyService.updatePolicy(companyId, policyPayload)
      Object.assign(policy, policyPayload)
      return result
    } catch (err) {
      // سيتم إمساك أخطاء التحقق المحلية أو أخطاء السيرفر هنا وتخزين رسالتها
      error.value = err.response?.data?.message || err.message || 'فشل حفظ سياسة الحضور.'
      throw err
    } finally {
      savingPolicy.value = false
    }
  }
  /**
   * دالة حفظ البصمة الجغرافية فقط (لزر الموقع)
   */
  async function saveLocationPolicy(companyId, payload) {
    savingLocation.value = true
    error.value = null
    try {
      const locationPayload = {
        allowed_perimeter: Number(payload.allowed_perimeter),
        latitude: Number(payload.latitude),
        longitude: Number(payload.longitude)
      }

      const result = await attendancePolicyService.updateLocation(companyId, locationPayload)
      Object.assign(policy, locationPayload)
      return result
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'فشل حفظ موقع البصمة.'
      throw err
    } finally {
      savingLocation.value = false
    }
  }

  return { 
    policy, 
    savingPolicy, 
    savingLocation, 
    error, 
    saveAttendancePolicy, 
    saveLocationPolicy 
  }
})