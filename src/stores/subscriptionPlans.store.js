import { ref } from 'vue'
import { defineStore } from 'pinia'
import { subscriptionPlansService } from '@/services/subscriptionPlans.service'

export const useSubscriptionPlansStore = defineStore('subscriptionPlans', () => {
  const plans = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchPlans() {
    loading.value = true
    error.value = null
    try {
      const data = await subscriptionPlansService.list()
      plans.value = Array.isArray(data) ? data : []
      return plans.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 2. جلب جميع الباقات (تستخدمها واجهة السوبر أدمن)
  async function fetchAllPlans() {
    loading.value = true
    error.value = null
    try {
      const data = await subscriptionPlansService.listAll()
      plans.value = Array.isArray(data) ? data : []
      return plans.value
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createPlan(payload) {
    error.value = null
    try {
      const result = await subscriptionPlansService.create(payload)
      // بدلاً من إعادة جلب كل الخطط، نضيف الخطة الجديدة محلياً
      const saved = result?.data ?? result
      if (saved && saved.id) {
        // ضعها في بداية القائمة لتظهر فوراً
        plans.value.unshift(saved)
      } else {
        // كاحتياط، أعد جلب القائمة إذا الاستجابة غير متوقعة
        await fetchPlans()
      }
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updatePlan(planId, payload) {
    error.value = null
    try {
      const result = await subscriptionPlansService.update(planId, payload)
      const updated = result?.data ?? result

      // حدّث العنصر محلياً بدل إعادة جلب كل القائمة
      const idx = plans.value.findIndex((p) => p.id === planId)
      if (idx !== -1) {
        plans.value[idx] = { ...plans.value[idx], ...updated }
      } else if (updated && updated.id) {
        // إذا لم يكن موجوداً محلياً، أضفه
        plans.value.unshift(updated)
      } else {
        // كاحتياط، أعد جلب القائمة
        await fetchPlans()
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function removePlan(planId) {
    error.value = null
    try {
      await subscriptionPlansService.remove(planId)
      plans.value = plans.value.filter((p) => p.id !== planId)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /** Convenience toggle used by the card's "Pause/Activate Sales" button. */
  async function togglePlanStatus(plan) {
    error.value = null
    const planId = plan.id
    const optimisticOld = { ...plan } // للاحتياط rollback
    const newState = !plan.is_active

    // تحديث محلي فوري (optimistic UI)
    const idx = plans.value.findIndex((p) => p.id === planId)
    if (idx !== -1) {
      plans.value[idx] = { ...plans.value[idx], is_active: newState }
    }

    try {
      const result = await subscriptionPlansService.update(planId, {
        name: plan.name,
        plan_type: plan.plan_type,
        billing_period: plan.billing_period,
        max_employees: plan.max_employees,
        price: plan.price,
        max_uses_per_company: plan.max_uses_per_company,
        description: plan.description,
        is_active: newState
      })

      const updated = result?.data ?? result
      // تأكد من مزامنة أي حقول أخرى قد عدّلها السيرفر
      if (updated && updated.id) {
        const idx2 = plans.value.findIndex((p) => p.id === updated.id)
        if (idx2 !== -1) plans.value[idx2] = { ...plans.value[idx2], ...updated }
      }

      return result
    } catch (err) {
      // rollback محلي عند الفشل
      if (idx !== -1) plans.value[idx] = optimisticOld
      error.value = err.message
      throw err
    }
  }

  return { plans, loading, error, fetchPlans, fetchAllPlans,  createPlan, updatePlan, removePlan, togglePlanStatus }
})
