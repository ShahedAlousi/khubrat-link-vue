import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useOnboardingStore = defineStore('onboarding', () => {
  const workspace = ref({
    name: '',
    email: ''
  })
  
  const plan = ref(null) // لحفظ الباقة المختارة

  const hasWorkspaceStep = ref(false)
  const hasPlanStep = ref(false)

  function setWorkspaceStep(payload) {
    workspace.value = { ...workspace.value, ...payload }
    hasWorkspaceStep.value = true
  }

  function setPlanStep(selectedPlan) {
    plan.value = selectedPlan
    hasPlanStep.value = true
  }

  function reset() {
    workspace.value = { name: '', email: '' }
    plan.value = null
    hasWorkspaceStep.value = false
    hasPlanStep.value = false
  }

  return { workspace, plan, hasWorkspaceStep, hasPlanStep, setWorkspaceStep, setPlanStep, reset }
})