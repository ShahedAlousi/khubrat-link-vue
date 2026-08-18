<script setup>
import { computed, ref } from 'vue'
import { useStaffStore } from '@/stores/staff.store'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'

const staffStore = useStaffStore()

const fileInputRef = ref(null)
const selectedFile = ref(null)

const acceptedExtensions = ['.xlsx', '.xls', '.csv']
const acceptAttr = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'

const importedCount = computed(() => {
  const payload = staffStore.importSuccess
  if (!payload) return null
  return payload.count ?? payload.data?.count ?? null
})

const rowErrorEntries = computed(() => {
  const errors = staffStore.importRowErrors
  if (!errors || typeof errors !== 'object') return []

  return Object.entries(errors).flatMap(([key, value]) => {
    const messages = Array.isArray(value) ? value : [String(value)]
    return messages.map((message) => ({ key, message }))
  })
})

function triggerFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0] ?? null
  selectedFile.value = file
  staffStore.clearImportFeedback()
}

function clearSelectedFile() {
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleDownloadTemplate() {
  try {
    await staffStore.downloadImportTemplate()
  } catch {
    // surfaced via store.importError
  }
}

async function handleUpload() {
  if (!selectedFile.value) return
  try {
    await staffStore.importEmployees(selectedFile.value)
    clearSelectedFile()
  } catch {
    // surfaced via store.importError / importRowErrors
  }
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h3 class="text-lg font-bold text-khubrat-blue dark:text-white">{{ $t('staff.bulkTitle') }}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {{ $t('staff.bulkSubtitle') }}
      </p>
    </div>

    <BaseAlert variant="info">
      <div class="space-y-2 text-sm leading-relaxed">
        <p>{{ $t('staff.bulkHint') }}</p>
        <p>{{ $t('staff.bulkOptional') }}</p>
        <p class="font-semibold">{{ $t('staff.bulkAllOrNothing') }}</p>
      </div>
    </BaseAlert>

    <BaseAlert v-if="staffStore.importSuccess" variant="success">
      {{ $t('staff.importSuccess') }}
      <span v-if="importedCount !== null">
        {{ $t('staff.importAdded', { n: importedCount }) }}
      </span>
      <button class="ms-2 underline text-xs" @click="staffStore.clearImportFeedback()">{{ $t('common.dismiss') }}</button>
    </BaseAlert>

    <BaseAlert v-if="staffStore.importError" variant="error">
      {{ staffStore.importError }}
      <button class="ms-2 underline text-xs" @click="staffStore.clearImportFeedback()">{{ $t('common.dismiss') }}</button>
    </BaseAlert>

    <div
      v-if="rowErrorEntries.length"
      class="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-2"
    >
      <p class="text-sm font-bold text-rose-700 dark:text-rose-300">{{ $t('staff.rowErrors') }}</p>
      <ul class="text-xs text-rose-700 dark:text-rose-300 space-y-1 max-h-48 overflow-y-auto">
        <li v-for="(entry, index) in rowErrorEntries" :key="`${entry.key}-${index}`">
          <span class="font-semibold">{{ entry.key }}:</span> {{ entry.message }}
        </li>
      </ul>
    </div>

    <div
      class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6"
    >
      <div class="space-y-3">
        <div>
          <p class="text-sm font-bold text-khubrat-blue dark:text-white">{{ $t('staff.step1') }}</p>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ $t('staff.step1Hint') }}
          </p>
        </div>
        <BaseButton variant="blue" :loading="staffStore.templateLoading" @click="handleDownloadTemplate">
          <i class="fa-solid fa-file-arrow-down"></i>
          {{ $t('staff.downloadTemplate') }}
        </BaseButton>
      </div>

      <div class="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <div>
          <p class="text-sm font-bold text-khubrat-blue dark:text-white">{{ $t('staff.step2') }}</p>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ $t('staff.acceptedFormats') }}
          </p>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          :accept="acceptAttr"
          @change="handleFileChange"
        />

        <div
          class="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 p-6 text-center space-y-3"
        >
          <div class="text-3xl text-slate-300 dark:text-slate-600">
            <i class="fa-solid fa-file-excel"></i>
          </div>

          <template v-if="selectedFile">
            <p class="text-sm font-semibold text-khubrat-blue dark:text-white">{{ selectedFile.name }}</p>
            <p class="text-xs text-slate-400">
              {{ (selectedFile.size / 1024).toFixed(1) }} KB
            </p>
            <div class="flex flex-wrap justify-center gap-2">
              <BaseButton variant="ghost" @click="triggerFilePicker">{{ $t('staff.chooseDifferent') }}</BaseButton>
              <BaseButton variant="ghost" @click="clearSelectedFile">{{ $t('staff.remove') }}</BaseButton>
            </div>
          </template>

          <template v-else>
            <p class="text-sm text-slate-500">{{ $t('staff.noFileYet') }}</p>
            <BaseButton variant="ghost" @click="triggerFilePicker">
              <i class="fa-solid fa-folder-open"></i>
              {{ $t('staff.chooseFile') }}
            </BaseButton>
          </template>
        </div>

        <BaseButton
          variant="gold"
          :disabled="!selectedFile"
          :loading="staffStore.importing"
          @click="handleUpload"
        >
          <i class="fa-solid fa-file-arrow-up"></i>
          {{ $t('staff.uploadImport') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
