<script setup>
import { nextTick, ref } from 'vue'

const messages = ref([
  {
    from: 'assistant',
    text: 'Welcome to Khubrat Admin Support! Drop us any message or request, and an architectural engineer will respond instantly.'
  }
])

const draft = ref('')
const historyEl = ref(null)

const replies = [
  "Hello! Our technical architect has received your ticket. We're currently reviewing the request.",
  'Excellent inquiry — a senior engineer will follow up with more detail shortly.',
  'Thanks for the update, we\u2019ve logged this and will get back to you soon.',
  'A senior dev engineer has been notified of your support ticket and will reach out to you shortly.'
]

async function scrollToBottom() {
  await nextTick()
  if (historyEl.value) historyEl.value.scrollTop = historyEl.value.scrollHeight
}

function send() {
  const text = draft.value.trim()
  if (!text) return

  messages.value.push({ from: 'admin', text })
  draft.value = ''
  scrollToBottom()

  // Purely local mock reply — no backend call, this widget is presentational only.
  setTimeout(() => {
    const reply = replies[Math.floor(Math.random() * replies.length)]
    messages.value.push({ from: 'assistant', text: reply })
    scrollToBottom()
  }, 900)
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col h-[500px]">
    <h4 class="text-md font-bold text-khubrat-blue dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
      <i class="fa-solid fa-headset mr-1.5 text-khubrat-goldLight"></i> Platform Technical Support
    </h4>
    <p class="text-xs text-slate-400">
      Directly contact Khubrat server developers and system architects for immediate technical support or custom
      inquiries.
    </p>

    <div class="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex flex-col overflow-hidden text-xs">
      <div ref="historyEl" class="flex-1 overflow-y-auto space-y-3 pr-1">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="p-2.5 max-w-[85%] border"
          :class="
            message.from === 'admin'
              ? 'ml-auto text-right rounded-l-xl rounded-br-xl bg-khubrat-blue text-white border-khubrat-goldLight/20'
              : 'rounded-r-xl rounded-bl-xl bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
          "
        >
          <p
            class="font-bold mb-0.5"
            :class="message.from === 'admin' ? 'text-khubrat-goldLight' : 'text-khubrat-blue dark:text-khubrat-goldLight'"
          >
            {{ message.from === 'admin' ? 'Admin (You)' : 'Architect Engineer' }}
          </p>
          <p :class="message.from === 'admin' ? 'text-slate-100' : 'text-slate-600 dark:text-slate-300'">
            {{ message.text }}
          </p>
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <input
          v-model="draft"
          type="text"
          placeholder="Explain your inquiry here…"
          class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-khubrat-goldLight focus:outline-none"
          @keyup.enter="send"
        />
        <button class="bg-khubrat-blue hover:bg-opacity-90 text-white px-3.5 rounded-xl transition-all" @click="send">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</template>
