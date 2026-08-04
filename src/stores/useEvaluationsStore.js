// useEvaluationsStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { evaluationCyclesService, evaluationTemplatesService } from '@/services/evaluations.service'

/**
 * Store خاص بميزة "إدارة التقييمات" (Evaluation Hub) 
 * يتعامل مع دورات التقييم (Cycles)، تقدم الموظفين، وقوالب الأسئلة.
 */
export const useEvaluationsStore = defineStore('evaluations', () => {
  // حالة البيانات الأساسية
  const cycles = ref([])
  const currentCycle = ref(null)
  const progressData = ref([])
  const templates = ref([])
  const archivedTemplates = ref([])
  const currentTemplate = ref(null)

  const scorableEmployees = ref([])
  const scoringDetails = ref(null)
  const finalResults = ref([])

  // حالات التحميل (تم فصلها لتجنب تداخل الـ DOM)
  const cyclesLoading = ref(false)
  const progressLoading = ref(false)
  const templatesLoading = ref(false)
  const scoringLoading = ref(false)
  const finalResultsLoading = ref(false)
  const ActionLoading = ref(false) // للعمليات مثل الإنشاء، الإطلاق، أو الحذف

  // خطأ عام مشترك
  const error = ref(null)

  /**
   * جلب جميع دورات التقييم
   */
  async function fetchCycles() {
    cyclesLoading.value = true
    error.value = null
    try {
      const result = await evaluationCyclesService.list()
      cycles.value = Array.isArray(result) ? result : (result.data || [])
      console.log('[Evaluations] Fetch cycles succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Fetch cycles failed:', err)
      throw err
    } finally {
      cyclesLoading.value = false
    }
  }

  /**
   * إنشاء دورة تقييم جديدة
   */
  async function createCycle(payload) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationCyclesService.create(payload)
      console.log('[Evaluations] Create cycle succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Create cycle failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  /**
   * إطلاق دورة تقييم (Launch)
   */
  async function launchCycle(cycleId) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationCyclesService.launch(cycleId)
      console.log('[Evaluations] Launch cycle succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Launch cycle failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  /**
   * جلب تقدم الموظفين لدورة تقييم محددة
   */
  // async function fetchProgress(cycleId) {
  //   progressLoading.value = true
  //   error.value = null
  //   try {
  //     const result = await evaluationCyclesService.getProgress(cycleId)
  //     progressData.value = result.data || result
  //     console.log('[Evaluations] Fetch progress succeeded:', result)
  //     return result
  //   } catch (err) {
  //     error.value = err.message
  //     console.error('[Evaluations] Fetch progress failed:', err)
  //     throw err
  //   } finally {
  //     progressLoading.value = false
  //   }
  // }

  /**
   * جلب تقدم الموظفين لدورة تقييم محددة (مع حماية من الاستدعاء المكرر)
   */
  async function fetchProgress(cycleId) {
    if (!cycleId) return
    
    progressLoading.value = true
    error.value = null
    try {
      const result = await evaluationCyclesService.getProgress(cycleId)
      
      // تفكيك الاستجابة بأمان مهما كان هيكلها من الباك أند (لارافيل)
      const rawList = result?.data?.data || result?.data || result
      progressData.value = Array.isArray(rawList) ? rawList : []
      
      console.log('[Evaluations] Fetch progress succeeded:', progressData.value)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Fetch progress failed:', err)
      throw err
    } finally {
      progressLoading.value = false
    }
  }

  /**
   * إرسال تذكير لموظف محدد
   */
  async function sendReminderToEmployee(cycleId, employeeId) {
    error.value = null
    try {
      const result = await evaluationCyclesService.sendReminder(cycleId, employeeId)
      console.log('[Evaluations] Send reminder succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Send reminder failed:', err)
      throw err
    }
  }

  /**
   * إضافة سؤال جديد إلى قالب التقييم
   */
  async function addTemplateQuestion(templateId, payload) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationTemplatesService.addQuestion(templateId, payload)
      console.log('[Evaluations] Add question succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Add question failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  /**
   * تحديث سؤال موجود داخل قالب التقييم
   */
  async function updateTemplateQuestion(templateId, questionId, payload) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationTemplatesService.updateQuestion(templateId, questionId, payload)
      console.log('[Evaluations] Update question succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Update question failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  /**
   * حذف سؤال من قالب التقييم
   */
  async function deleteTemplateQuestion(templateId, questionId) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationTemplatesService.deleteQuestion(templateId, questionId)
      console.log('[Evaluations] Delete question succeeded:', result)
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Delete question failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  // ==========================================================================
  // توابع إدارة القوالب (Templates Actions)
  // ==========================================================================

  /**
   * جلب قوالب التقييم (النشطة أو المؤرشفة)
   */
  async function fetchTemplates(params = {}) {
    templatesLoading.value = true
    error.value = null
    try {
      const data = await evaluationTemplatesService.list(params)
      const list = Array.isArray(data) ? data : []
      if (params?.archived === true || params?.only_archived === true || params?.archived === 1) {
        archivedTemplates.value = list
      } else {
        templates.value = list
      }
      return list
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      templatesLoading.value = false
    }
  }

  /**
   * جلب القوالب المؤرشفة مع fallback إذا كان باراميتر archived غير مدعوم من الباك اند.
   * يحاول أولاً ?archived=true ثم ?only_archived=1، وأخيراً يفلتر من القائمة الكاملة.
   */
  async function fetchArchivedTemplates() {
    templatesLoading.value = true
    error.value = null
    try {
      let list = await evaluationTemplatesService.list({ archived: true })

      if (!list.length) {
        console.warn(
          '[Evaluations] archived=true returned empty — retrying with only_archived=1'
        )
        list = await evaluationTemplatesService.list({ only_archived: 1 })
      }

      if (!list.length) {
        console.warn(
          '[Evaluations] Archive query params returned empty — falling back to client-side filter on full template list. ' +
            'Backend may need to expose archived templates via ?archived=true (or an equivalent filter).'
        )
        const all = await evaluationTemplatesService.list()
        list = all.filter(
          (t) =>
            t?.is_archived === true ||
            t?.archived === true ||
            t?.status === 'archived' ||
            Boolean(t?.archived_at)
        )
        console.log('[Evaluations] Client-side archive filter matched:', list.length, 'of', all.length)
      }

      archivedTemplates.value = list
      return list
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Fetch archived templates failed:', err)
      archivedTemplates.value = []
      throw err
    } finally {
      templatesLoading.value = false
    }
  }

  /**
   * استنساخ/تكرار قالب تقييم
   */
  async function duplicateTemplate(templateId, payload) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationTemplatesService.duplicate(templateId, payload)
      await fetchTemplates()
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  /**
   * جلب تفاصيل قالب تقييم محدد (بما في ذلك الأسئلة)
   */
  async function fetchTemplateDetails(templateId) {
    templatesLoading.value = true 
    error.value = null
    try {
      const result = await evaluationTemplatesService.get(templateId)
      console.log('[Evaluations] Fetch template details succeeded:', result)
      return result?.data || result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Fetch template details failed:', err)
      throw err
    } finally {
      templatesLoading.value = false
    }
  }

  async function createTemplate(payload) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationTemplatesService.create(payload)
      console.log('[Evaluations] Create template succeeded:', result)
      return result?.data ?? result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Create template failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  async function closeCycle(cycleId) {
    ActionLoading.value = true
    error.value = null
    try {
      const result = await evaluationCyclesService.close(cycleId)
      console.log('[Evaluations] Close cycle succeeded:', result)
      await fetchCycles() // تحديث الدورات فوراً بكل مكان
      return result
    } catch (err) {
      error.value = err.message
      console.error('[Evaluations] Close cycle failed:', err)
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  // ==========================================================================
  // توابع الدرجات والتقييم (Scoring Actions)
  // ==========================================================================

  /**
   * جلب الموظفين الجاهزين للتقييم
   */
  async function fetchScorableEmployees(cycleId) {
    scoringLoading.value = true
    error.value = null
    try {
      // تم التصحيح هنا: استخدام evaluationCyclesService بدلاً من evaluationTemplatesService
      const result = await evaluationCyclesService.getScorableEmployees(cycleId)
      scorableEmployees.value = result.data || result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      scoringLoading.value = false
    }
  }

  /**
   * جلب تفاصيل التقييم لموظف محدد لوضع الدرجات
   */
  async function fetchScoringDetails(cycleId, params) {
    scoringLoading.value = true
    error.value = null
    try {
      // تم التصحيح هنا
      const result = await evaluationCyclesService.getScoringDetails(cycleId, params)
      scoringDetails.value = result.data || result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      scoringLoading.value = false
    }
  }

  /**
   * حفظ درجات الـ HR لتقييم
   */
  async function submitReviewScore(cycleId, reviewId, payload) {
    ActionLoading.value = true
    error.value = null
    try {
      // تم التصحيح هنا
      const result = await evaluationCyclesService.storeReviewScore(cycleId, reviewId, payload)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  // ==========================================================================
  // توابع النتائج النهائية والاعتماد (Final Results Actions)
  // ==========================================================================

  /**
   * جلب النتائج النهائية للدورة
   */
  async function fetchFinalResults(cycleId) {
    finalResultsLoading.value = true
    error.value = null
    try {
      // تم التصحيح هنا
      const result = await evaluationCyclesService.getFinalResults(cycleId)
      finalResults.value = result.data || result
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      finalResultsLoading.value = false
    }
  }

  /**
   * اعتماد النتيجة النهائية لموظف
   */
  async function finalizeScore(cycleId, employeeId) {
    ActionLoading.value = true
    error.value = null
    try {
      // تم التصحيح هنا
      const result = await evaluationCyclesService.finalizeEmployeeScore(cycleId, employeeId)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      ActionLoading.value = false
    }
  }

  

  return {
    // الحالات (State)
    cycles,
    currentCycle,
    progressData,
    templates,
    currentTemplate,
    scorableEmployees,
    scoringDetails,
    finalResults,
    archivedTemplates, // إضافة
  
    
    // حالات التحميل الجديدة
    cyclesLoading,
    progressLoading,
    templatesLoading,
    scoringLoading,
    finalResultsLoading,
    ActionLoading,
    
    error,

    // دورات التقييم والتقدم
    fetchCycles,
    createCycle,
    launchCycle,
    fetchProgress,
    sendReminderToEmployee,
    createTemplate,   
    closeCycle,

    // قوالب التقييم
    fetchTemplates,
    fetchArchivedTemplates,
    duplicateTemplate,
    addTemplateQuestion,
    updateTemplateQuestion,
    deleteTemplateQuestion,
    fetchTemplateDetails,

    // وضع الدرجات
    fetchScorableEmployees,
    fetchScoringDetails,
    submitReviewScore,

    // النتائج النهائية والاعتماد
    fetchFinalResults,
    finalizeScore
  }
})