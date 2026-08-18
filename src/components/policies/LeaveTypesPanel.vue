<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToggleSwitch from './ToggleSwitch.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { translateLeaveTypeName, translateLeaveTypeTerms } from '@/i18n/helpers'
import { useAuthStore } from '@/stores/auth.store'
import {
  useLeaveTypesStore,
  LEAVE_TYPE_CATEGORIES,
  FREE_DAYS_LEAVE_CATEGORY
} from '@/stores/leaveTypes.store'

const props = defineProps({
  readonly: { type: Boolean, default: false }
})

const { t } = useI18n()
const authStore = useAuthStore()
const leaveTypesStore = useLeaveTypesStore()

const rows = ref([])
const freeDaysRow = ref(null)
const actionError = ref('')
const saveSuccess = ref(false)

function unitLabel(row) {
  return row?.allocation_unit === 'hours' ? t('policies.hours') : t('policies.days')
}

function proofLabel(required) {
  return required ? t('common.required') : t('common.notRequired')
}

// يبني صف جدول واحد: يأخذ البيانات الحقيقية من الـ API لو الفئة موجودة مسبقًا، وإلا يستخدم القيم الافتراضية
function buildRow(category) {
  const existing = leaveTypesStore.leaveTypes.find((lt) => lt.name === category.name)
  return {
    id: existing?.id ?? null,
    name: category.name,
    terms: category.terms,
    allocation_unit: category.allocationUnit ?? existing?.allocation_unit ?? 'days',
    allocation_value: existing?.allocation_value ?? category.defaultValue,
    requires_proof: existing?.requires_proof ?? category.requiresProof ?? false,
    is_active: existing?.is_active ?? category.defaultActive
  }
}

// يعيد بناء كل صفوف الجدول (والصف الخاص) من الحالة الحالية للـ Store
function rebuildRows() {
  rows.value = LEAVE_TYPE_CATEGORIES.map(buildRow)
  freeDaysRow.value = buildRow(FREE_DAYS_LEAVE_CATEGORY)
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

  try {
    if (toCreate.length) await leaveTypesStore.createLeaveTypesBulk(authStore.companyId, toCreate)
    if (toUpdate.length) await leaveTypesStore.updateLeaveTypesBulk(authStore.companyId, toUpdate)
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
        <i class="fa-solid fa-circle-info me-1"></i> {{ $t('policies.policyNote') }}
      </span>
      {{ $t('policies.leaveNote') }}
    </div>

    <BaseAlert v-if="saveSuccess" variant="success">{{ $t('policies.leaveSaved') }}</BaseAlert>
    <BaseAlert v-if="actionError" variant="error">{{ actionError }}</BaseAlert>

    <LoadingSpinner v-if="leaveTypesStore.loading && !rows.length" :label="$t('policies.loadingLeave')" />

    <template v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-start text-xs border-collapse">
          <thead>
            <tr class="text-slate-800 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-700 font-extrabold text-[13px]">
              <th class="pb-3 ps-4">{{ $t('policies.leaveCategory') }}</th>
              <th class="pb-3 px-3 text-center">{{ $t('policies.requireProof') }}</th>
              <th class="pb-3 text-center">{{ $t('policies.statusSwitch') }}</th>
              <th class="pb-3 text-end pe-6">{{ $t('policies.maximumLimit') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700 font-semibold text-slate-700 dark:text-slate-300">
            <tr v-for="row in rows" :key="row.name" class="hover:bg-amber-500/5 dark:hover:bg-khubrat-goldDark/10 transition-colors">
              <td class="py-4 ps-4 border-s-4 border-khubrat-blue dark:border-khubrat-goldLight">
                <p class="font-black text-khubrat-blue dark:text-khubrat-goldLight text-sm tracking-wide">
                  <i v-if="row.allocation_unit === 'hours'" class="fa-solid fa-clock me-1.5 text-khubrat-goldDark dark:text-khubrat-goldLight"></i>
                  {{ translateLeaveTypeName(row.name) }}
                </p>
                <p class="text-[11px] text-slate-400 font-medium mt-0.5 max-w-xs">{{ translateLeaveTypeTerms(row.name, row.terms) }}</p>
              </td>
              <td class="py-4 px-3 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span
                    v-if="readonly"
                    class="text-xs font-bold"
                    :class="row.requires_proof ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
                  >
                    {{ proofLabel(row.requires_proof) }}
                  </span>
                  <template v-else>
                    <ToggleSwitch v-model="row.requires_proof" />
                    <span
                      class="text-[10px] font-bold"
                      :class="row.requires_proof ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
                    >
                      {{ proofLabel(row.requires_proof) }}
                    </span>
                  </template>
                </div>
              </td>
              <td class="py-4 text-center">
                <span
                  v-if="readonly"
                  class="text-xs font-bold"
                  :class="row.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
                >
                  {{ row.is_active ? $t('status.active') : $t('status.inactive') }}
                </span>
                <ToggleSwitch v-else :model-value="row.is_active" @update:model-value="handleToggle(row)" />
              </td>
              <td class="py-4 text-end pe-6">
                <div class="inline-flex flex-col items-end gap-0.5">
                  <div class="inline-flex items-center justify-end gap-1.5">
                    <span v-if="readonly" class="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {{ row.allocation_value ?? $t('common.emDash') }}
                    </span>
                    <input
                      v-else
                      v-model.number="row.allocation_value"
                      type="number"
                      min="0"
                      step="1"
                      :title="row.allocation_unit === 'hours' ? $t('policies.hoursAvailable') : $t('policies.maxDays')"
                      :placeholder="row.allocation_unit === 'hours' ? $t('policies.hours') : $t('policies.days')"
                      class="w-20 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
                    />
                    <span class="text-[10px] font-bold text-slate-400 uppercase w-10 text-start">{{ unitLabel(row) }}</span>
                  </div>
                  <span v-if="row.allocation_unit === 'hours'" class="text-[10px] text-slate-400 font-medium">
                    {{ $t('policies.hoursAvailable') }}
                  </span>
                </div>
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
            <p class="text-sm font-black text-khubrat-blue dark:text-khubrat-goldLight">{{ translateLeaveTypeName(freeDaysRow.name) }}</p>
            <p class="text-[11px] text-slate-400 max-w-xl">{{ translateLeaveTypeTerms(freeDaysRow.name, freeDaysRow.terms) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4 flex-shrink-0 flex-wrap justify-end">
          <div class="flex flex-col items-center gap-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase">{{ $t('policies.requireProof') }}</span>
            <span
              v-if="readonly"
              class="text-xs font-bold"
              :class="freeDaysRow.requires_proof ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
            >
              {{ proofLabel(freeDaysRow.requires_proof) }}
            </span>
            <template v-else>
              <ToggleSwitch v-model="freeDaysRow.requires_proof" />
              <span
                class="text-[10px] font-bold"
                :class="freeDaysRow.requires_proof ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
              >
                {{ proofLabel(freeDaysRow.requires_proof) }}
              </span>
            </template>
          </div>
          <span
            v-if="readonly"
            class="text-xs font-bold"
            :class="freeDaysRow.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
          >
            {{ freeDaysRow.is_active ? $t('status.active') : $t('status.inactive') }}
          </span>
          <ToggleSwitch v-else :model-value="freeDaysRow.is_active" @update:model-value="handleToggle(freeDaysRow)" />
          <span v-if="readonly" class="text-sm font-bold text-slate-800 dark:text-slate-100">
            {{ freeDaysRow.allocation_value ?? $t('common.emDash') }} {{ unitLabel(freeDaysRow) }}
          </span>
          <div v-else class="inline-flex items-center gap-1.5">
            <input
              v-model.number="freeDaysRow.allocation_value"
              type="number"
              min="0"
              class="w-20 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-khubrat-goldLight dark:text-white"
            />
            <span class="text-[10px] font-bold text-slate-400 uppercase">{{ unitLabel(freeDaysRow) }}</span>
          </div>
        </div>
      </div>

      <BaseButton v-if="!readonly" variant="gold" :loading="leaveTypesStore.saving" @click="handleSaveAll">
        <i class="fa-solid fa-floppy-disk"></i>
        {{ $t('policies.saveLeave') }}
      </BaseButton>
    </template>
  </div>
</template>
