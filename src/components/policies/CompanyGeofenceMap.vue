<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true }
})

const emit = defineEmits(['update:latitude', 'update:longitude'])

const mapEl = ref(null)
let map = null
let marker = null
let circle = null

function placeAt(lat, lng) {
  if (marker) marker.setLatLng([lat, lng])
  if (circle) circle.setLatLng([lat, lng])
  emit('update:latitude', Number(lat.toFixed(6)))
  emit('update:longitude', Number(lng.toFixed(6)))
}

onMounted(() => {
  // Leaflet is loaded globally via a <script> CDN tag in index.html (see
  // that file's comment) rather than as an npm package, which sidesteps the
  // well-known bundler issue with Leaflet's default marker icon paths.
  const L = window.L
  if (!L) {
    console.error('[CompanyGeofenceMap] window.L is undefined — check the Leaflet <script> tag in index.html')
    return
  }

  map = L.map(mapEl.value).setView([props.latitude, props.longitude], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  marker = L.marker([props.latitude, props.longitude], { draggable: true }).addTo(map)

  circle = L.circle([props.latitude, props.longitude], {
    color: '#002173',
    fillColor: '#FCD88A',
    fillOpacity: 0.35,
    radius: props.radius
  }).addTo(map)

  marker.on('dragend', () => {
    const position = marker.getLatLng()
    placeAt(position.lat, position.lng)
  })

  map.on('click', (e) => {
    placeAt(e.latlng.lat, e.latlng.lng)
  })

  // The container is inside a tab panel that may be hidden at first paint.
  setTimeout(() => map.invalidateSize(), 300)
})

// Keep the visual radius circle in sync with the number input elsewhere on the panel.
watch(
  () => props.radius,
  (newRadius) => {
    if (circle) circle.setRadius(newRadius)
  }
)

onBeforeUnmount(() => {
  if (map) map.remove()
})

defineExpose({
  /** Called by the parent panel when its tab becomes visible again. */
  invalidateSize: () => map?.invalidateSize()
})
</script>

<template>
  <div ref="mapEl" class="w-full h-80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner z-10"></div>
</template>
