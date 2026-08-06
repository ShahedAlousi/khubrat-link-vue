<template>
    <div class="fixed inset-0 z-50 flex">
      <!-- backdrop -->
      <div class="fixed inset-0 bg-black/40" @click="close" />
  
      <!-- panel -->
      <aside class="ml-auto w-full md:w-2/5 bg-white dark:bg-gray-800 h-full shadow-xl overflow-auto">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Salary Details</h2>
            <button @click="close" class="text-gray-500 hover:text-gray-700">Close</button>
          </div>
  
          <div v-if="loading" class="mt-6">
            <LoadingSpinner />
          </div>
  
          <div v-else class="mt-6 space-y-4">
            <div class="space-y-1">
              <div class="text-sm text-gray-500">Employee</div>
              <div class="font-medium">{{ details.employee_name }}</div>
            </div>
  
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500">Period</div>
                <div class="font-medium">{{ details.period }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Status</div>
                <div class="font-medium">{{ details.status }}</div>
              </div>
            </div>
  
            <div>
              <div class="text-sm text-gray-500">Base Salary</div>
              <div class="font-medium">{{ formatCurrency(details.base_salary) }}</div>
            </div>
  
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-gray-500">Total Additions</div>
                <div class="font-medium">{{ formatCurrency(details.total_additions) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Total Deductions</div>
                <div class="font-medium">{{ formatCurrency(details.total_deductions) }}</div>
              </div>
            </div>
  
            <div>
              <div class="text-sm text-gray-500">Net Salary</div>
              <div class="text-2xl font-bold">{{ formatCurrency(details.net_salary) }}</div>
            </div>
  
            <div v-if="details.payment_summary" class="mt-4">
              <div class="text-sm text-gray-500">Payment Summary</div>
              <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs">{{ details.payment_summary }}</pre>
            </div>
  
            <div class="flex justify-end space-x-2 mt-6">
              <BaseButton @click="close">Close</BaseButton>
              <BaseButton variant="primary" :disabled="details.is_received" @click="pay">Mark Paid</BaseButton>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </template>
  
  <script>
  import { ref, watch, onMounted } from 'vue'
  import salariesService from '@/services/salaries.service'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  import BaseButton from '@/components/common/BaseButton.vue'
  
  export default {
    props: {
      salaryId: { type: String, required: true },
      onClose: { type: Function, required: false }
    },
    components: { LoadingSpinner, BaseButton },
    setup(props) {
      const loading = ref(true)
      const details = ref({})
  
      const fetch = async () => {
        loading.value = true
        const resp = await salariesService.get(props.salaryId)
        // response format: try res.data?.data or res.data
        details.value = resp?.data ?? resp
        loading.value = false
      }
  
      const close = () => {
        if (props.onClose) props.onClose()
      }
  
      const pay = async () => {
        await salariesService.pay(props.salaryId)
        await fetch()
      }
  
      watch(() => props.salaryId, () => {
        fetch()
      })
  
      onMounted(fetch)
  
      const formatCurrency = (v) => {
        if (v == null) return '-'
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
      }
  
      return { loading, details, close, pay, formatCurrency }
    }
  }
  </script>
  
  <style scoped>
  /* Minimal; rely on Tailwind */
  </style>