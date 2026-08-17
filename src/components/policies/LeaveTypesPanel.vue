<script setup>
import { onMounted, ref } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useLeaveTypesStore } from '@/stores/leaveTypes.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const authStore = useAuthStore()
const leaveTypesStore = useLeaveTypesStore()

// القائمة الثابتة لفئات الإجازات المعروضة دائمًا (مطابقة للتصميم المرفق)،
// مع نص "الشروط ومتطلبات الإثبات" ثابت هنا في الواجهة فقط — هذا الحقل غير
// موجود في مخطط الـ API، فهو مجرد شرح توضيحي محلي لكل فئة معروفة.
const FIXED_CATEGORIES = [
  { name: 'Maternity Leave', terms: 'Requires medical certificate submission', defaultDays: 90, defaultActive: true, requiresProof: true },
  { name: 'Marriage Leave', terms: 'Requires certificate proof within 14 days', defaultDays: 7, defaultActive: true, requiresProof: true },
  { name: 'Travel Leave', terms: 'Approved holiday relocation check-in', defaultDays: 15, defaultActive: false, requiresProof: true },
  { name: 'Study/Exams Leave', terms: 'Requires accredited university exam agenda', defaultDays: 10, defaultActive: true, requiresProof: true },
  { name: 'Sick Leave', terms: 'Requires verified medical board diagnosis', defaultDays: 14, defaultActive: true, requiresProof: true },
  { name: 'Hajj Leave', terms: 'Granted once per career cycle, requires passport stamp', defaultDays: 30, defaultActive: false, requiresProof: true },
  { name: 'Compassionate Leave', terms: 'Requires direct relative verification certificate', defaultDays: 3, defaultActive: true, requiresProof: true }
]

// الصف الخاص "أيام حرة مدفوعة" يُعرض بشكل منفصل تحت الجدول الرئيسي، بنفس بنية البيانات
const FREE_DAYS_CATEGORY = {
  name: 'Paid Free Days Leave Allocation',
  terms: 'Independent annual balance. Deduct basic wage ONLY if free days requests exceed this specific balance in the calendar year.',
  defaultDays: 14,
  defaultActive: true,
  requiresProof: false
}

const rows = ref([])
const freeDaysRow = ref(null)
const actionError = ref('')
const saveSuccess = ref(false)

// يبني صف جدول واحد: يأخذ البيانات الحقيقية من الـ API لو الفئة موجودة مسبقًا، وإلا يستخدم القيم الافتراضية
function buildRow(category) {
  const existing = leaveTypesStore.leaveTypes.find((lt) => lt.name === category.name)
  return {
    id: existing?.id ?? null,
    name: category.name,
    terms: category.terms,
    allocation_unit: existing?.allocation_unit ?? 'days',
    allocation_value: existing?.allocation_value ?? category.defaultDays,
    requires_proof: existing?.requires_proof ?? category.requiresProof,
    is_active: existing?.is_active ?? category.defaultActive
  }
}

// يعيد بناء كل صفوف الجدول (والصف الخاص) من الحالة الحالية للـ Store
function rebuildRows() {
  rows.value = FIXED_CATEGORIES.map(buildRow)
  freeDaysRow.value = buildRow(FREE_DAYS_CATEGORY)
}

onMounted(async () => {
  try {
    await leaveTypesStore.fetchLeaveTypes(authStore.companyId)
  } catch (err) {
    actionError.value = err.message
  } finally {
    rebuildRows()
  }
})

// يبدّل حالة التفعيل: نداء فوري للـ API لو الصف منشأ مسبقًا، وإلا تعديل محلي فقط لحين الحفظ
async function handleToggle(row) {
  actionError.value = ''
  if (!row.id) {
    row.is_active = !row.is_active
    return
  }
  try {
    await leaveTypesStore.toggleLeaveType(authStore.companyId, row)
    row.is_active = !row.is_active
  } catch (err) {
    actionError.value = err.message
  }
}

// يحفظ كل التغييرات دفعة واحدة: الصفوف الجديدة عبر POST الجماعي، والموجودة عبر PUT الجماعي
async function handleSaveAll() {
  actionError.value = ''
  saveSuccess.value = false

  const allRows = [...rows.value, freeDaysRow.value]
  const toCreate = allRows.filter((r) => !r.id)
  const toUpdate = allRows.filter((r) => r.id)

  const toPayload = (r) => ({
    ...(r.id ? { id: r.id } : {}),
    name: r.name,
    allocation_value: Number(r.allocation_value),
    allocation_unit: r.allocation_unit,
    requires_proof: r.requires_proof,
    is_active: r.is_active
  })

  try {
    if (toCreate.length) await leaveTypesStore.createLeaveTypesBulk(authStore.companyId, toCreate.map(toPayload))
    if (toUpdate.length) await leaveTypesStore.updateLeaveTypesBulk(authStore.companyId, toUpdate.map(toPayload))
    rebuildRows()
    saveSuccess.value = true
  } catch (err) {
    actionError.value = err.message
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
    <div class="p-3.5 bg-blue-50/50 dark:bg-slate-900/40 rounded-xl border border-blue-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
      <span class="font-extrabold text-khubrat-blue dark:text-khubrat-goldLight">
        <i class="fa-solid fa-circle-info mr-1"></i> Policy Note:
      </span>
      The maximum limits configured below represent allocations permitted per individual occurrence or event, and
      can be requested multiple times inside the calendar year. High-contrast labels provide complete transparency
      on legal proof constraints.
    </div>

    <BaseAlert v-if="saveSuccess" variant="success">Leave policies saved successfully.</BaseAlert>
    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <LoadingSpinner v-if="leaveTypesStore.loading && !rows.length" label="Loading leave types…" />

    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-700 font-extrabold text-[13px]">
              <th class="pb-3 pl-4">Leave Category</th>
              <th class="pb-3 px-3">Terms &amp; Proof Requirement</th>
              <th class="pb-3 text-center">Status Switch</th>
              <th class="pb-3 text-right pr-6">Maximum Days Limit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700 font-semibold text-slate-700 dark:text-slate-300">
            <tr v-for="row in rows" :key="row.name" class="hover:bg-amber-500/5 dark:hover:bg-khubrat-goldDark/10 transition-colors">
              <td class="py-4 pl-4 font-black text-khubrat-blue dark:text-khubrat-goldLight text-sm tracking-wide border-l-4 border-khubrat-blue dark:border-khubrat-goldLight">
                {{ row.name }}
              </td>
              <td class="py-4 px-3 text-slate-500 dark:text-slate-400 font-medium">{{ row.terms }}</td>
              <td class="py-4 text-center">
                <span
                  v-if="readonly"
                  class="text-xs font-bold"
                  :class="row.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
                >
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </span>
                <ToggleSwitch v-else :model-value="row.is_active" @update:model-value="handleToggle(row)" />
              </td>
              <td class="py-4 text-right pr-6">
                <span v-if="readonly" class="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {{ row.allocation_value ?? '—' }}
                </span>
                <input
                  v-else
                  v-model.number="row.allocation_value"
                  type="number"
                  min="0"
                  class="w-20 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- الصف الخاص: أيام حرة مدفوعة، برصيد سنوي مستقل عن باقي الفئات -->
      <div v-if="freeDaysRow" class="border-t border-slate-100 dark:border-slate-700 pt-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div class="flex items-start gap-3">
          <i class="fa-solid fa-gift text-khubrat-goldDark dark:text-khubrat-goldLight text-lg mt-0.5"></i>
          <div>
            <p class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight">{{ freeDaysRow.name }}</p>
            <p class="text-[11px] text-slate-400 max-w-xl">{{ freeDaysRow.terms }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span
            v-if="readonly"
            class="text-xs font-bold"
            :class="freeDaysRow.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            {{ freeDaysRow.is_active ? 'Active' : 'Inactive' }}
          </span>
          <ToggleSwitch v-else :model-value="freeDaysRow.is_active" @update:model-value="handleToggle(freeDaysRow)" />
          <span v-if="readonly" class="text-sm font-bold text-slate-800 dark:text-slate-100">
            {{ freeDaysRow.allocation_value ?? '—' }} days
          </span>
          <input
            v-else
            v-model.number="freeDaysRow.allocation_value"
            type="number"
            min="0"
            class="w-20 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
          />
        </div>
      </div>

      <BaseButton v-if="!readonly" variant="gold" :loading="leaveTypesStore.saving" @click="handleSaveAll">
        <i class="fa-solid fa-floppy-disk"></i>
        Save Leave Policies
      </BaseButton>
    </template>
  </div>
</template>