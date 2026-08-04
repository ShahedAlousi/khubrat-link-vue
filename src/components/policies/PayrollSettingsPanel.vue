<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      
      <!-- العناوين الرئيسية -->
      <div class="flex justify-between items-start">
        <div class="space-y-1">
          <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">Base Currency &amp; Salary Adjustment Scaling</h4>
          <p class="text-xs text-slate-400">Determine default payroll denomination and relative percentage modifications per incident.</p>
        </div>
        
        <!-- شارة حالة الواجهة -->
        <span v-if="hasExistingData" :class="isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'" class="px-3 py-1 rounded-full text-xs font-bold transition-colors">
          {{ isEditMode ? 'Editing Mode' : 'Read-Only Mode' }}
        </span>
      </div>

      <!-- تنبيهات النجاح والخطأ -->
      <BaseAlert v-if="submitSuccess" variant="success">Payroll policies saved successfully.</BaseAlert>
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <!-- صندوق التعليمات الهام -->
      <div class="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        <span class="font-extrabold text-khubrat-goldDark dark:text-khubrat-goldLight">
          <i class="fa-solid fa-triangle-exclamation mr-1"></i> Crucial Instruction:
        </span>
        All percentage factors specified below are calculated as a ratio of the
        <strong>Base Monthly Salary </strong>, not the daily wage calculation.
      </div>

      <!-- قسم اختيار العملة الأساسية للشركة -->
      <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200 tracking-wide uppercase">
          BASE CORPORATE CURRENCY 
        </label>
        <div class="w-full sm:w-80">
          <BaseSelect 
            v-model="form.currency" 
            :options="currencyOptions" 
            :disabled="!isEditMode"
            required 
          />
        </div>
      </div>

      <!-- شبكة حقول إدخال سياسات الرواتب الموحدة -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        <!-- Absence Day Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Absence Day Deduction</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.absence_deduction" :disabled="!isEditMode" type="number" placeholder="5" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Of basic monthly wage deducted per unexcused absence.</p>
        </div>

        <!-- Unpaid Leave Day -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Unpaid Leave Day</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.unpaid_leave_deduction" :disabled="!isEditMode" type="number" placeholder="4" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Of basic monthly wage deducted.</p>
        </div>

        <!-- Late Arrival Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Late Arrival Deduction</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.late_deduction" :disabled="!isEditMode" type="number" placeholder="1" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Applied when check-in breaks specified grace thresholds.</p>
        </div>

        <!-- Early Departure Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Early Departure Deduction</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.early_deduction" :disabled="!isEditMode" type="number" placeholder="1" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Applied when check-out violates shift bounds.</p>
        </div>

        <!-- Overtime Hour Rate -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Overtime Hour Rate</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.overtime_hour_rate" :disabled="!isEditMode" type="number" placeholder="2" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Monthly wage increment paid per verified overtime hour.</p>
        </div>

        <!-- Overtime Day Rate -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">Overtime Day Rate</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.overtime_day_rate" :disabled="!isEditMode" type="number" placeholder="5" class="w-full" />
            <span class="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 rounded-r-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">Of basic monthly wage increment paid for extra days worked.</p>
        </div>
      </div>

      <!-- أزرار التحكم الديناميكية -->
      <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
        
        <!-- زر التعديل: يظهر فقط إذا كان هناك بيانات ولسنا في وضع التعديل -->
        <BaseButton v-if="hasExistingData && !isEditMode" variant="outline" @click="enableEditMode">
          <i class="fa-solid fa-pen-to-square mr-1"></i> Edit Policies
        </BaseButton>

        <!-- زر الإلغاء: يظهر فقط في وضع التعديل (إذا كانت هناك بيانات محفوظة مسبقاً) -->
        <BaseButton v-if="hasExistingData && isEditMode" variant="secondary" :disabled="isSubmitting" @click="cancelEdit">
          Cancel
        </BaseButton>

        <!-- زر الحفظ: يظهر دائماً في وضع التعديل (سواء إضافة جديدة أو تعديل) -->
        <BaseButton v-if="isEditMode" variant="gold" :loading="isSubmitting" @click="handleSaveAllPolicies">
          <i class="fa-solid fa-floppy-disk mr-1"></i> Save Policy Settings
        </BaseButton>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePayrollStore } from '@/stores/payroll.store'

const authStore = useAuthStore()
const payrollStore = usePayrollStore()

const currencyOptions = [
  { value: 'USD', label: 'United States Dollar ($ USD)' },
  { value: 'SYP', label: 'Syrian Pound (S.P / ل.س)' }
]

const form = ref({
  currency: 'USD',
  absence_deduction: '',
  unpaid_leave_deduction: '',
  late_deduction: '',
  early_deduction: '',
  overtime_hour_rate: '',
  overtime_day_rate: ''
})

// متغيرات حالة الواجهة
const isEditMode = ref(true) // افتراضياً مفتوح للتعديل في حال كانت الشركة جديدة
const hasExistingData = ref(false)
const originalData = ref(null) // لحفظ النسخة الأصلية للبيانات قبل التعديل
const currentRuleIds = ref({}) // لتخزين IDs الخاصة بالقواعد لاستخدامها في مسار الـ PUT

const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

onMounted(async () => {
  try {
    const currentData = await payrollStore.fetchSalaryRules(authStore.companyId)
    
    // طباعة البيانات في الـ Console لمعاينة البنية الحقيقية القادمة من الباك إند
    console.log('Fetched Salary Rules from API:', currentData)

    // إذا كانت البيانات قادمة على شكل مصفوفة وتملك عناصر
    if (Array.isArray(currentData) && currentData.length > 0) {
      hasExistingData.value = true
      isEditMode.value = false // قفل الواجهة للعرض فقط (Read-Only)

      // التكرار على مصفوفة القواعد وتعبئة الحقول والـ IDs
      currentData.forEach((rule) => {
        // نتحقق من نوع القاعدة rule_type ونطابقها مع الحقل المناسب
        const type = rule.rule_type?.toLowerCase()
        const timeUnit = rule.time_unit?.toLowerCase()

        if (type === 'absence') {
          form.value.absence_deduction = rule.value ?? ''
          currentRuleIds.value.absence = rule.id
        } 
        else if (type === 'unpaid_leave' || type === 'unpaid') {
          form.value.unpaid_leave_deduction = rule.value ?? ''
          currentRuleIds.value.unpaid_leave = rule.id
        } 
        else if (type === 'late') {
          form.value.late_deduction = rule.value ?? ''
          currentRuleIds.value.late = rule.id
        } 
        else if (type === 'early' || type === 'early_departure') {
          form.value.early_deduction = rule.value ?? ''
          currentRuleIds.value.early = rule.id
        } 
        else if (type === 'overtime' && timeUnit === 'hour') {
          form.value.overtime_hour_rate = rule.value ?? ''
          currentRuleIds.value.overtime_hour = rule.id
        } 
        else if (type === 'overtime' && timeUnit === 'day') {
          form.value.overtime_day_rate = rule.value ?? ''
          currentRuleIds.value.overtime_day = rule.id
        }
      })

      // في حال كانت العملة تأتي مع إحدى القواعد أو ضمن استجابة السيرفر
      if (payrollStore.currency) {
        form.value.currency = payrollStore.currency
      }

      // حفظ نسخة طبق الأصل لاستعادتها في حال الضغط على إلغاء (Cancel)
      originalData.value = JSON.parse(JSON.stringify(form.value))
    }
  } catch (err) {
    console.error('Error loading initial payroll configuration:', err)
  }
})

function enableEditMode() {
  submitSuccess.value = false
  submitError.value = ''
  isEditMode.value = true
}

function cancelEdit() {
  // استعادة البيانات الأصلية
  if (originalData.value) {
    form.value = JSON.parse(JSON.stringify(originalData.value))
  }
  isEditMode.value = false
  submitError.value = ''
}



async function handleSaveAllPolicies() {
  submitError.value = ''
  submitSuccess.value = false
  isSubmitting.value = true

  // تجهيز الحمولة الكاملة للسياسات دائماً
  const payload = {
    base_currency: form.value.currency,
    absence_day_deduction_percent: form.value.absence_deduction === '' ? 0 : Number(form.value.absence_deduction),
    unpaid_leave_day_percent: form.value.unpaid_leave_deduction === '' ? 0 : Number(form.value.unpaid_leave_deduction),
    late_arrival_deduction_percent: form.value.late_deduction === '' ? 0 : Number(form.value.late_deduction),
    early_departure_deduction_percent: form.value.early_deduction === '' ? 0 : Number(form.value.early_deduction),
    overtime_hour_rate_percent: form.value.overtime_hour_rate === '' ? 0 : Number(form.value.overtime_hour_rate),
    overtime_day_rate_percent: form.value.overtime_day_rate === '' ? 0 : Number(form.value.overtime_day_rate)
  }

  try {
    // 1. إرسال جميع السياسات عبر POST (سيقوم الباك إند بإنشاء الجديد وتحديث القديم)
    await payrollStore.saveAllCompanyPolicies(authStore.companyId, payload)

    // 2. إعادة جلب البيانات فوراً لربط الـ IDs الجديدة للقواعد التي أُضيفت للتو
    const updatedData = await payrollStore.fetchSalaryRules(authStore.companyId)
    
    if (updatedData) {
      populateFormData(updatedData) // دالة مساعدة لتعبئة الحقول
    }

    // 3. تأكيد النجاح والتحول لوضع القراءة (Read-Only)
    hasExistingData.value = true
    isEditMode.value = false
    submitSuccess.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

  } catch (err) {
    submitError.value = err.response?.data?.message || err.message || 'An error occurred while saving configuration.'
  } finally {
    isSubmitting.value = false
  }
}

// دالة مساعدة لتعبئة البيانات لعدم تكرار الكود بين onMounted و handleSaveAllPolicies
function populateFormData(rulesArray) {
  if (Array.isArray(rulesArray) && rulesArray.length > 0) {
    rulesArray.forEach((rule) => {
      const type = rule.rule_type?.toLowerCase()
      const timeUnit = rule.time_unit?.toLowerCase()

      if (type === 'absence') form.value.absence_deduction = rule.value ?? ''
      else if (type === 'unpaid_leave' || type === 'unpaid') form.value.unpaid_leave_deduction = rule.value ?? ''
      else if (type === 'late') form.value.late_deduction = rule.value ?? ''
      else if (type === 'early' || type === 'early_departure') form.value.early_deduction = rule.value ?? ''
      else if (type === 'overtime' && timeUnit === 'hour') form.value.overtime_hour_rate = rule.value ?? ''
      else if (type === 'overtime' && timeUnit === 'day') form.value.overtime_day_rate = rule.value ?? ''
    })

    if (payrollStore.currency) {
      form.value.currency = payrollStore.currency
    }

    // حفظ نسخة أصلية جديدة للتمكن من الإلغاء لاحقاً
    originalData.value = JSON.parse(JSON.stringify(form.value))
  }
}
</script>