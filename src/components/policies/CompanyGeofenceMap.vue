<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  latitude: { type: [Number, String], default: null },
  longitude: { type: [Number, String], default: null },
  radius: { type: [Number, String], default: null },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['update:latitude', 'update:longitude'])

// Used only to center the map before the company has picked a location.
const FALLBACK_CENTER = [33.5138, 36.2765]
const DEFAULT_RADIUS = 150

const mapEl = ref(null)
let map = null
let marker = null
let circle = null

function currentRadius() {
  const value = Number(props.radius)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_RADIUS
}

// Number(null) and Number('') both yield 0, which would silently place an
// unconfigured company at (0, 0) in the middle of the ocean.
function toCoordinate(value, limit) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null
}

function coordinates() {
  const lat = toCoordinate(props.latitude, 90)
  const lng = toCoordinate(props.longitude, 180)
  return lat === null || lng === null ? null : [lat, lng]
}

function hasCoordinates() {
  return coordinates() !== null
}

function renderAt(lat, lng) {
  const L = window.L
  if (!map || !L) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], { draggable: !props.readonly }).addTo(map)
    if (!props.readonly) {
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        placeAt(position.lat, position.lng)
      })
    }
  }

  if (circle) {
    circle.setLatLng([lat, lng])
  } else {
    circle = L.circle([lat, lng], {
      color: '#002173',
      fillColor: '#FCD88A',
      fillOpacity: 0.35,
      radius: currentRadius()
    }).addTo(map)
  }
}

function placeAt(lat, lng) {
  renderAt(lat, lng)
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

  const saved = coordinates()
  map = L.map(mapEl.value).setView(saved ?? FALLBACK_CENTER, saved ? 15 : 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  if (saved) renderAt(saved[0], saved[1])

  if (!props.readonly) {
    map.on('click', (e) => {
      placeAt(e.latlng.lat, e.latlng.lng)
    })
  }

  // The container is inside a tab panel that may be hidden at first paint.
  setTimeout(() => map.invalidateSize(), 300)
})

// Keep the visual radius circle in sync with the number input elsewhere on the panel.
watch(
  () => props.radius,
  () => {
    if (circle) circle.setRadius(currentRadius())
  }
)

// The saved policy arrives after the map is mounted, so recenter once it does.
watch(
  () => [props.latitude, props.longitude],
  () => {
    const next = coordinates()
    if (!map || !next) return
    renderAt(next[0], next[1])
    map.setView(next, map.getZoom())
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
  <div class="relative">
    <div ref="mapEl" class="w-full h-80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner z-10"></div>
    <p v-if="!hasCoordinates() && !readonly" class="mt-2 text-[10px] font-bold text-slate-400">
      {{ $t('policies.noLocationSaved') }}
    </p>
    <p v-else-if="!hasCoordinates() && readonly" class="mt-2 text-[10px] font-bold text-slate-400">
      {{ $t('policies.noLocationConfigured') }}
    </p>
  </div>
</template>
