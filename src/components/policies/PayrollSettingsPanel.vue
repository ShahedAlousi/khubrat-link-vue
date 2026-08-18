<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      
      <!-- العناوين الرئيسية -->
      <div class="flex justify-between items-start">
        <div class="space-y-1">
          <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ $t('policies.payrollTitle') }}</h4>
          <p class="text-xs text-slate-400">{{ $t('policies.payrollHint') }}</p>
        </div>
        
        <!-- شارة حالة الواجهة -->
        <span v-if="readonly" class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
          {{ $t('policies.viewOnly') }}
        </span>
        <span v-else-if="hasExistingData" :class="isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'" class="px-3 py-1 rounded-full text-xs font-bold transition-colors">
          {{ isEditMode ? $t('policies.editingMode') : $t('policies.readOnlyMode') }}
        </span>
      </div>

      <!-- تنبيهات النجاح والخطأ -->
      <BaseAlert v-if="submitSuccess" variant="success">{{ $t('policies.payrollSaved') }}</BaseAlert>
      <BaseAlert v-if="submitError" variant="error">{{ submitError }}</BaseAlert>

      <!-- صندوق التعليمات الهام -->
      <div class="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        <span class="font-extrabold text-khubrat-goldDark dark:text-khubrat-goldLight">
          <i class="fa-solid fa-triangle-exclamation me-1"></i> {{ $t('policies.crucial') }}
        </span>
        {{ $t('policies.crucialBody') }}
      </div>

      <PolicyReadonlyValue
        v-if="readonly"
        :label="$t('policies.baseCurrency')"
        :value="currencyLabel(form.currency)"
      />
      <div v-else class="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200 tracking-wide uppercase">
          {{ $t('policies.baseCurrency') }} 
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

      <div v-if="readonly" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <PolicyReadonlyValue :label="$t('policies.absenceDeduction')" :value="displayPercent(form.absence_deduction)" :hint="$t('policies.absenceHint')" />
        <PolicyReadonlyValue :label="$t('policies.unpaidLeave')" :value="displayPercent(form.unpaid_leave_deduction)" :hint="$t('policies.unpaidHint')" />
        <PolicyReadonlyValue :label="$t('policies.lateDeduction')" :value="displayPercent(form.late_deduction)" :hint="$t('policies.lateHint')" />
        <PolicyReadonlyValue :label="$t('policies.earlyDeduction')" :value="displayPercent(form.early_deduction)" :hint="$t('policies.earlyHint')" />
        <PolicyReadonlyValue :label="$t('policies.overtimeHour')" :value="displayPercent(form.overtime_hour_rate)" :hint="$t('policies.otHourHint')" />
        <PolicyReadonlyValue :label="$t('policies.overtimeDay')" :value="displayPercent(form.overtime_day_rate)" :hint="$t('policies.otDayHint')" />
      </div>

      <!-- شبكة حقول إدخال سياسات الرواتب الموحدة -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        
        <!-- Absence Day Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.absenceDeduction') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.absence_deduction" :disabled="!isEditMode" type="number" placeholder="5" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.absenceHint') }}</p>
        </div>

        <!-- Unpaid Leave Day -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.unpaidLeave') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.unpaid_leave_deduction" :disabled="!isEditMode" type="number" placeholder="4" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.unpaidHint') }}</p>
        </div>

        <!-- Late Arrival Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.lateDeduction') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.late_deduction" :disabled="!isEditMode" type="number" placeholder="1" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.lateHint') }}</p>
        </div>

        <!-- Early Departure Deduction -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.earlyDeduction') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.early_deduction" :disabled="!isEditMode" type="number" placeholder="1" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.earlyHint') }}</p>
        </div>

        <!-- Overtime Hour Rate -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.overtimeHour') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.overtime_hour_rate" :disabled="!isEditMode" type="number" placeholder="2" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.otHourHint') }}</p>
        </div>

        <!-- Overtime Day Rate -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.overtimeDay') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="form.overtime_day_rate" :disabled="!isEditMode" type="number" placeholder="5" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.otDayHint') }}</p>
        </div>
      </div>

      <!-- أزرار التحكم الديناميكية -->
      <div v-if="!readonly" class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
        
        <!-- زر التعديل: يظهر فقط إذا كان هناك بيانات ولسنا في وضع التعديل -->
        <BaseButton v-if="hasExistingData && !isEditMode" variant="outline" @click="enableEditMode">
          <i class="fa-solid fa-pen-to-square me-1"></i> {{ $t('policies.editPolicies') }}
        </BaseButton>

        <!-- زر الإلغاء: يظهر فقط في وضع التعديل (إذا كانت هناك بيانات محفوظة مسبقاً) -->
        <BaseButton v-if="hasExistingData && isEditMode" variant="secondary" :disabled="isSubmitting" @click="cancelEdit">
          {{ $t('common.cancel') }}
        </BaseButton>

        <!-- زر الحفظ: يظهر دائماً في وضع التعديل (سواء إضافة جديدة أو تعديل) -->
        <BaseButton v-if="isEditMode" variant="gold" :loading="isSubmitting" @click="handleSaveAllPolicies">
          <i class="fa-solid fa-floppy-disk me-1"></i> {{ $t('policies.savePolicy') }}
        </BaseButton>
        
      </div>
    </div>

    <!-- ======================= قسم سياسات طلب السلفة المالية ======================= -->
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">

      <!-- العناوين الرئيسية -->
      <div class="flex justify-between items-start">
        <div class="space-y-1">
          <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ $t('policies.advanceTitle') }}</h4>
          <p class="text-xs text-slate-400">{{ $t('policies.advanceHint') }}</p>
        </div>

        <!-- شارة حالة الواجهة -->
        <span v-if="readonly" class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
          {{ $t('policies.viewOnly') }}
        </span>
        <span v-else-if="advanceHasExistingData" :class="advanceIsEditMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'" class="px-3 py-1 rounded-full text-xs font-bold transition-colors">
          {{ advanceIsEditMode ? $t('policies.editingMode') : $t('policies.readOnlyMode') }}
        </span>
      </div>

      <!-- تنبيهات النجاح والخطأ -->
      <BaseAlert v-if="advanceSubmitSuccess" variant="success">{{ $t('policies.advanceSaved') }}</BaseAlert>
      <BaseAlert v-if="advanceSubmitError" variant="error">{{ advanceSubmitError }}</BaseAlert>

      <!-- صندوق التعليمات الهام -->
      <div class="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
        <span class="font-extrabold text-khubrat-goldDark dark:text-khubrat-goldLight">
          <i class="fa-solid fa-triangle-exclamation me-1"></i> {{ $t('policies.crucial') }}
        </span>
        {{ $t('policies.advanceNote') }}
      </div>

      <div v-if="readonly" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <PolicyReadonlyValue :label="$t('policies.maxAdvance')" :value="displayPercent(advanceForm.max_advance_percentage)" :hint="$t('policies.maxAdvanceHint')" />
        <PolicyReadonlyValue :label="$t('policies.maxRepayment')" :value="advanceForm.max_repayment_months ? $t('common.monthsCount', { n: advanceForm.max_repayment_months }) : $t('common.emDash')" :hint="$t('policies.maxRepaymentHint')" />
        <PolicyReadonlyValue :label="$t('policies.concurrentAdvances')" :value="advanceForm.allow_multiple_active_advances ? $t('status.allowed') : $t('status.not_allowed')" :hint="$t('policies.concurrentHint')" />
      </div>

      <!-- شبكة حقول إدخال سياسة السلف -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

        <!-- Maximum Advance Percentage -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.maxAdvance') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="advanceForm.max_advance_percentage" :disabled="!advanceIsEditMode" type="number" placeholder="50" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-xs font-bold text-slate-400 pointer-events-none">
              %
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.maxAdvanceHint') }}</p>
        </div>

        <!-- Maximum Repayment Months -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.maxRepayment') }}</label>
          <div class="relative flex items-center">
            <BaseInput v-model="advanceForm.max_repayment_months" :disabled="!advanceIsEditMode" type="number" placeholder="6" class="w-full" />
            <span class="absolute end-0 top-0 bottom-0 w-12 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border-s border-slate-200 dark:border-slate-700 rounded-e-xl text-[11px] font-bold text-slate-400 pointer-events-none">
              {{ $t('policies.monthsAbbrev') }}
            </span>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.maxRepaymentHint') }}</p>
        </div>

        <!-- Multiple Active Advances -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-[#061c3f] dark:text-slate-200">{{ $t('policies.concurrentAdvances') }}</label>
          <div class="flex items-center justify-between h-[42px] px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span class="text-xs font-bold" :class="advanceForm.allow_multiple_active_advances ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'">
              {{ advanceForm.allow_multiple_active_advances ? $t('status.allowed') : $t('status.not_allowed') }}
            </span>
            <ToggleSwitch v-model="advanceForm.allow_multiple_active_advances" :disabled="!advanceIsEditMode" />
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">{{ $t('policies.concurrentHint') }}</p>
        </div>
      </div>

      <!-- أزرار التحكم الديناميكية -->
      <div v-if="!readonly" class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">

        <BaseButton v-if="advanceHasExistingData && !advanceIsEditMode" variant="outline" @click="enableAdvanceEditMode">
          <i class="fa-solid fa-pen-to-square me-1"></i> {{ $t('policies.editPolicy') }}
        </BaseButton>

        <BaseButton v-if="advanceHasExistingData && advanceIsEditMode" variant="secondary" :disabled="payrollStore.savingAdvancePolicy" @click="cancelAdvanceEdit">
          {{ $t('common.cancel') }}
        </BaseButton>

        <BaseButton v-if="advanceIsEditMode" variant="gold" :loading="payrollStore.savingAdvancePolicy" @click="handleSaveAdvancePolicy">
          <i class="fa-solid fa-floppy-disk me-1"></i> {{ $t('policies.saveAdvance') }}
        </BaseButton>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PolicyReadonlyValue from './PolicyReadonlyValue.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import ToggleSwitch from '@/components/policies/ToggleSwitch.vue'
import { useAuthStore } from '@/stores/auth.store'
import { usePayrollStore } from '@/stores/payroll.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const { t } = useI18n()
const authStore = useAuthStore()
const payrollStore = usePayrollStore()

function currencyLabel(value) {
  if (value === 'USD') return t('policies.usd')
  if (value === 'SYP') return t('policies.syp')
  return value ?? t('common.emDash')
}

const currencyOptions = computed(() => [
  { value: 'USD', label: t('policies.usd') },
  { value: 'SYP', label: t('policies.syp') }
])

function displayPercent(value) {
  return value === '' || value === null || value === undefined ? t('common.emDash') : `${value}%`
}

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

// سياسة السلف المالية
const advanceForm = ref({
  max_advance_percentage: '',
  max_repayment_months: '',
  allow_multiple_active_advances: false
})

const advanceIsEditMode = ref(true) // مفتوح للتعديل افتراضياً في حال عدم وجود سياسة محفوظة
const advanceHasExistingData = ref(false)
const advanceOriginalData = ref(null)
const advanceSubmitSuccess = ref(false)
const advanceSubmitError = ref('')

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

  await loadAdvancePolicy()
})

async function loadAdvancePolicy() {
  try {
    const policy = await payrollStore.fetchAdvancePolicy(authStore.companyId)
    if (policy) {
      populateAdvanceForm(policy)
      advanceHasExistingData.value = true
      advanceIsEditMode.value = false // قفل الواجهة للعرض فقط (Read-Only)
    }
  } catch (err) {
    console.error('Error loading salary advance policy:', err)
  }
}

function populateAdvanceForm(policy) {
  advanceForm.value = {
    max_advance_percentage: policy.max_advance_percentage ?? '',
    max_repayment_months: policy.max_repayment_months ?? '',
    allow_multiple_active_advances: Boolean(policy.allow_multiple_active_advances)
  }
  // حفظ نسخة طبق الأصل لاستعادتها في حال الضغط على إلغاء (Cancel)
  advanceOriginalData.value = JSON.parse(JSON.stringify(advanceForm.value))
}

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
    submitError.value = err.response?.data?.message || err.message || t('policies.saveConfigError')
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

function enableAdvanceEditMode() {
  advanceSubmitSuccess.value = false
  advanceSubmitError.value = ''
  advanceIsEditMode.value = true
}

function cancelAdvanceEdit() {
  if (advanceOriginalData.value) {
    advanceForm.value = JSON.parse(JSON.stringify(advanceOriginalData.value))
  }
  advanceIsEditMode.value = false
  advanceSubmitError.value = ''
}

async function handleSaveAdvancePolicy() {
  advanceSubmitError.value = ''
  advanceSubmitSuccess.value = false

  const percentage = Number(advanceForm.value.max_advance_percentage)
  const months = Number(advanceForm.value.max_repayment_months)

  if (advanceForm.value.max_advance_percentage === '' || Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
    advanceSubmitError.value = t('policies.advancePctError')
    return
  }

  if (advanceForm.value.max_repayment_months === '' || !Number.isInteger(months) || months < 1) {
    advanceSubmitError.value = t('policies.repaymentError')
    return
  }

  try {
    const saved = await payrollStore.saveAdvancePolicy(authStore.companyId, {
      max_advance_percentage: percentage,
      max_repayment_months: months,
      allow_multiple_active_advances: Boolean(advanceForm.value.allow_multiple_active_advances)
    })

    populateAdvanceForm(saved)
    advanceHasExistingData.value = true
    advanceIsEditMode.value = false
    advanceSubmitSuccess.value = true
  } catch (err) {
    // الـ 422 يعيد تفاصيل الحقول ضمن errors بعد توحيد شكل الخطأ في طبقة الـ api
    const fieldError = err.errors ? Object.values(err.errors).flat()[0] : null
    advanceSubmitError.value =
      fieldError || err.message || t('policies.advanceSaveError')
  }
}
</script>