<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEvaluationsStore } from '@/stores/useEvaluationsStore'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const evaluationsStore = useEvaluationsStore()
const { t } = useI18n()

const responseTypeOptions = computed(() => [
  { value: 'rating', label: t('evaluations.stars') },
  { value: 'text', label: t('evaluations.textComment') }
])

function responseTypeLabel(type) {
  if (type === 'rating') return t('evaluations.stars')
  if (type === 'text') return t('evaluations.textComment')
  return type
}

const workingTemplate = ref(null)
const loadingTemplate = ref(false)

const props = defineProps({
  cycleId: { type: [String, Number], default: null }
})

const showCreateModal = ref(false)
const newTemplateName = ref('')
const archiveTemplateDetails = ref(null)
const showArchiveModal = ref(false)
const selectedArchiveTemplateId = ref(null)
const importName = ref('')
const archiveLoading = ref(false)
const archiveEmptyHint = ref('')

const templateOptions = computed(() =>
  evaluationsStore.templates.map((t) => ({ value: t.id, label: t.name }))
)

async function selectTemplate(templateId) {
  if (!templateId) return
  loadingTemplate.value = true
  try {
    workingTemplate.value = await evaluationsStore.fetchTemplateDetails(templateId)
  } finally {
    loadingTemplate.value = false
  }
}

async function loadWorkingTemplate(cycleId) {
  loadingTemplate.value = true
  try {
    if (!evaluationsStore.templates.length) {
      await evaluationsStore.fetchTemplates()
    }

    let targetId = null
    if (cycleId && evaluationsStore.currentCycle?.evaluation_template_id) {
      targetId = evaluationsStore.currentCycle.evaluation_template_id
    } else if (evaluationsStore.templates.length) {
      targetId = evaluationsStore.templates[0].id
    }

    if (targetId) {
      workingTemplate.value = await evaluationsStore.fetchTemplateDetails(targetId)
    } else {
      workingTemplate.value = null
    }
  } catch (err) {
    console.error('[FormBuilderTab] Failed to load working template:', err)
  } finally {
    loadingTemplate.value = false
  }
}

watch(
  () => props.cycleId,
  (newCycleId) => {
    loadWorkingTemplate(newCycleId)
  },
  { immediate: true }
)

async function handleCreateTemplate() {
  if (!newTemplateName.value) return
  const created = await evaluationsStore.createTemplate({ name: newTemplateName.value })
  await evaluationsStore.fetchTemplates()

  const createdId = created?.id || created
  if (createdId) {
    workingTemplate.value = await evaluationsStore.fetchTemplateDetails(createdId)
  }
  showCreateModal.value = false
  newTemplateName.value = ''
}

async function selectArchiveTemplate(templateId) {
  selectedArchiveTemplateId.value = templateId
  archiveTemplateDetails.value = await evaluationsStore.fetchTemplateDetails(templateId)
}

async function importQuestionsOnly() {
  if (!selectedArchiveTemplateId.value) return
  if (!workingTemplate.value) {
    await confirmArchiveImport()
    return
  }
  if (!archiveTemplateDetails.value?.questions) {
    archiveTemplateDetails.value = await evaluationsStore.fetchTemplateDetails(selectedArchiveTemplateId.value)
  }
  if (!archiveTemplateDetails.value?.questions?.length) return

  for (const q of archiveTemplateDetails.value.questions) {
    await evaluationsStore.addTemplateQuestion(workingTemplate.value.id, {
      question: q.question,
      response_type: q.response_type,
      sort_order: (workingTemplate.value.questions?.length || 0) + 1,
      weight: q.weight
    })
  }
  workingTemplate.value = await evaluationsStore.fetchTemplateDetails(workingTemplate.value.id)
  showArchiveModal.value = false
}

async function addQuestion() {
  if (!workingTemplate.value) {
    showCreateModal.value = true
    return
  }
  const nextOrder = (workingTemplate.value.questions?.length || 0) + 1
  const result = await evaluationsStore.addTemplateQuestion(workingTemplate.value.id, {
    question: t('evaluations.defaultQuestion'),
    response_type: 'rating',
    sort_order: nextOrder,
    weight: 1
  })
  const created = result?.data ?? result
  if (!workingTemplate.value.questions) workingTemplate.value.questions = []
  workingTemplate.value.questions.push(created)
}

async function saveQuestionField(question, field, value) {
  question[field] = value
  await evaluationsStore.updateTemplateQuestion(workingTemplate.value.id, question.id, { [field]: value })
}

const questionPendingDelete = ref(null)
async function confirmDeleteQuestion() {
  const question = questionPendingDelete.value
  if (!question) return
  await evaluationsStore.deleteTemplateQuestion(workingTemplate.value.id, question.id)
  workingTemplate.value.questions = workingTemplate.value.questions.filter((q) => q.id !== question.id)
  questionPendingDelete.value = null
}

async function openArchiveModal() {
  showArchiveModal.value = true
  selectedArchiveTemplateId.value = null
  importName.value = ''
  archiveTemplateDetails.value = null
  archiveEmptyHint.value = ''
  archiveLoading.value = true
  try {
    const list = await evaluationsStore.fetchArchivedTemplates()
    if (!list.length) {
      archiveEmptyHint.value = t('evaluations.noArchivedBody')
    }
  } catch (err) {
    archiveEmptyHint.value = err.message || t('evaluations.loadArchivedFailed')
  } finally {
    archiveLoading.value = false
  }
}

function closeArchiveModal() {
  showArchiveModal.value = false
}

async function confirmArchiveImport() {
  if (!selectedArchiveTemplateId.value) return
  await evaluationsStore.duplicateTemplate(selectedArchiveTemplateId.value, {
    name: importName.value || t('evaluations.importedTemplate'),
    archive_source: true
  })
  await evaluationsStore.fetchTemplates()
  if (evaluationsStore.templates.length) {
    workingTemplate.value = await evaluationsStore.fetchTemplateDetails(evaluationsStore.templates[0].id)
  }
  showArchiveModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <BaseAlert v-if="evaluationsStore.error" variant="error">{{ evaluationsStore.error }}</BaseAlert>

    <!-- Toolbar always visible on cold start -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="space-y-1">
          <h4 class="text-md font-bold text-khubrat-blue dark:text-khubrat-goldLight">{{ $t('evaluations.unifiedTemplate') }}</h4>
          <p class="text-xs text-slate-400">
            <template v-if="workingTemplate">
              {{ $t('evaluations.establishFor', { name: workingTemplate.name }) }}
            </template>
            <template v-else>
              {{ $t('evaluations.startHint') }}
            </template>
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <div v-if="templateOptions.length" class="w-56">
            <BaseSelect
              :model-value="workingTemplate?.id"
              :options="templateOptions"
              :placeholder="$t('evaluations.selectTemplate')"
              @update:model-value="selectTemplate"
            />
          </div>

          <BaseButton variant="ghost" @click="showCreateModal = true">
            <i class="fa-solid fa-folder-plus"></i> {{ $t('evaluations.addTemplate') }}
          </BaseButton>

          <BaseButton variant="ghost" @click="openArchiveModal">
            <i class="fa-solid fa-clock-rotate-left"></i> {{ $t('evaluations.importArchive') }}
          </BaseButton>

          <BaseButton variant="blue" :loading="evaluationsStore.ActionLoading" @click="addQuestion">
            <i class="fa-solid fa-plus"></i> {{ $t('evaluations.addCriterion') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loadingTemplate" full-height />

    <div
      v-else-if="!workingTemplate"
      class="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center shadow-sm text-slate-400"
    >
      <i class="fa-solid fa-clipboard-question text-5xl mb-3 block text-khubrat-goldDark/30"></i>
      <p class="font-bold text-sm">{{ $t('evaluations.noTemplate') }}</p>
      <p class="text-xs text-slate-400 mt-1">{{ $t('evaluations.noTemplateHint') }}</p>
    </div>

    <div
      v-else
      class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6"
    >
      <div v-if="!workingTemplate.questions?.length" class="text-center py-12 bg-slate-100/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <i class="fa-solid fa-clipboard-question text-4xl text-slate-300 dark:text-slate-700 mb-3 block"></i>
        <h4 class="font-bold text-slate-500">{{ $t('evaluations.noCriteria') }}</h4>
        <p class="text-xs text-slate-400">{{ $t('evaluations.noCriteriaHint') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="(question, index) in workingTemplate.questions"
          :key="question.id"
          class="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-xs"
        >
          <div class="flex items-start gap-3 w-full md:flex-1">
            <span class="w-7 h-7 rounded-lg bg-khubrat-blue/10 dark:bg-khubrat-goldLight/10 text-khubrat-blue dark:text-khubrat-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-1">
              {{ index + 1 }}
            </span>
            <textarea
              :value="question.question"
              rows="2"
              class="flex-1 w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-khubrat-goldLight py-1 text-xs font-bold text-slate-800 dark:text-white focus:outline-none transition-all resize-y"
              :placeholder="$t('evaluations.criterionPlaceholder')"
              @change="saveQuestionField(question, 'question', $event.target.value)"
            ></textarea>
          </div>

          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div class="w-44">
              <BaseSelect
                :model-value="question.response_type"
                :options="responseTypeOptions"
                @update:model-value="saveQuestionField(question, 'response_type', $event)"
              />
            </div>
            <div class="w-24">
              <BaseInput
                type="number"
                :model-value="question.weight"
                :placeholder="$t('evaluations.weight')"
                @update:model-value="saveQuestionField(question, 'weight', Number($event))"
              />
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center shrink-0"
              @click="questionPendingDelete = question"
            >
              <i class="fa-regular fa-trash-can text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-if="questionPendingDelete"
      :title="$t('evaluations.deleteCriteria')"
      :confirm-label="$t('common.delete')"
      confirm-variant="danger"
      :loading="evaluationsStore.ActionLoading"
      @cancel="questionPendingDelete = null"
      @confirm="confirmDeleteQuestion"
    >
      <p class="text-sm text-slate-500 dark:text-slate-300">{{ $t('evaluations.deleteCriteriaConfirm') }}</p>
    </ConfirmModal>

    <ConfirmModal
      v-if="showCreateModal"
      :title="$t('evaluations.createTemplateTitle')"
      :confirm-label="$t('evaluations.createTemplate')"
      :loading="evaluationsStore.ActionLoading"
      @cancel="showCreateModal = false"
      @confirm="handleCreateTemplate"
    >
      <BaseInput v-model="newTemplateName" :label="$t('evaluations.templateName')" :placeholder="$t('evaluations.templatePlaceholder')" required />
    </ConfirmModal>

    <ConfirmModal
      v-if="showArchiveModal"
      :title="$t('evaluations.importTitle')"
      :confirm-label="$t('evaluations.importSelected')"
      :loading="evaluationsStore.ActionLoading || archiveLoading"
      @cancel="closeArchiveModal"
      @confirm="importQuestionsOnly"
    >
      <p class="text-xs text-slate-400 mb-3">{{ $t('evaluations.importHint') }}</p>

      <LoadingSpinner v-if="archiveLoading" />

      <div
        v-else-if="!evaluationsStore.archivedTemplates.length"
        class="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl"
      >
        <i class="fa-solid fa-box-archive text-2xl mb-2 block opacity-40"></i>
        <p class="font-bold">{{ $t('evaluations.noArchived') }}</p>
        <p v-if="archiveEmptyHint" class="mt-1 px-4">{{ archiveEmptyHint }}</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
        <button
          v-for="template in evaluationsStore.archivedTemplates"
          :key="template.id"
          type="button"
          class="p-4 rounded-2xl border-2 text-start transition-all"
          :class="
            selectedArchiveTemplateId === template.id
              ? 'border-khubrat-goldLight bg-khubrat-goldLight/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-khubrat-goldDark bg-slate-50 dark:bg-slate-900'
          "
          @click="selectArchiveTemplate(template.id)"
        >
          <h4 class="font-black text-xs text-khubrat-blue dark:text-white uppercase">{{ template.name }}</h4>
        </button>
      </div>

      <div v-if="archiveTemplateDetails?.questions?.length" class="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <h5 class="text-xs font-bold text-slate-500 mb-2">{{ $t('evaluations.questionsImported') }}</h5>
        <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <li v-for="(q, idx) in archiveTemplateDetails.questions" :key="idx" class="flex gap-2">
            <span class="text-khubrat-goldDark font-bold">{{ idx + 1 }}.</span>
            <span class="truncate">{{ q.question }} <span class="text-slate-400 opacity-70">({{ responseTypeLabel(q.response_type) }})</span></span>
          </li>
        </ul>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <BaseButton variant="ghost" size="sm" :disabled="!selectedArchiveTemplateId" @click="confirmArchiveImport">
          {{ $t('evaluations.duplicateTemplate') }}
        </BaseButton>
      </div>
    </ConfirmModal>
  </div>
</template>
