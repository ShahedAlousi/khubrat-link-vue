import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import salariesService from '@/services/salaries.service'

export const useSalariesStore = defineStore('salaries', () => {
  const salariesList = ref([])
  const pagination = reactive({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    next_page_url: null,
    prev_page_url: null,
    total: 0
  })
  const drawerOpen = ref(false)
  const drawerId = ref(null)
  const stats = reactive({
    totalRecords: 0,
    totalNet: 0,
    totalPaid: 0,
    totalPending: 0
  })

  async function fetchSalaries(params = {}) {
    const p = { per_page: params.per_page ?? pagination.per_page, page: params.page ?? 1, ...params }
    const res = await salariesService.list(p)
    // The backend returns a paginated envelope under data (seen in example)
    const data = res?.data ?? res
    salariesList.value = data?.data ?? []
    // update pagination
    pagination.current_page = data?.current_page ?? 1
    pagination.last_page = data?.last_page ?? 1
    pagination.per_page = data?.per_page ?? pagination.per_page
    pagination.next_page_url = data?.next_page_url ?? null
    pagination.prev_page_url = data?.prev_page_url ?? null
    pagination.total = data?.total ?? (salariesList.value.length || 0)

    // compute stats client-side
    computeStats()
  }

  function computeStats() {
    const list = salariesList.value || []
    stats.totalRecords = list.length
    stats.totalNet = list.reduce((s, r) => s + (Number(r.net_salary) || 0), 0)
    stats.totalPaid = list.reduce((s, r) => s + ((r.is_received ? Number(r.net_salary) || 0 : 0)), 0)
    stats.totalPending = stats.totalNet - stats.totalPaid
  }

  async function generateDrafts(payload) {
    const res = await salariesService.generate(payload)
    return res
  }

  async function markSalaryPaid(id) {
    const res = await salariesService.pay(id)
    return res
  }

  function openDrawer(id) {
    drawerId.value = id
    drawerOpen.value = true
  }

  function closeDrawer() {
    drawerOpen.value = false
    drawerId.value = null
  }

  return {
    salariesList,
    pagination,
    drawerOpen,
    drawerId,
    stats,
    fetchSalaries,
    generateDrafts,
    markSalaryPaid,
    openDrawer,
    closeDrawer
  }
})