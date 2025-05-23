<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Header Card -->
        <v-card elevation="2" class="pa-6 mb-6">
          <v-row align="center" class="mb-4">
            <v-col>
              <v-card-title class="text-h4 pa-0">
                Dashboard
                <v-chip 
                  v-if="isStreamLive" 
                  color="error" 
                  text-color="white" 
                  size="small" 
                  class="ml-3"
                >
                  <v-icon start size="small">mdi-circle</v-icon>
                  NA ŻYWO
                </v-chip>
              </v-card-title>
              <v-card-subtitle class="pa-0">
                Witaj w swoim dashboardzie, <strong>{{ displayName }}</strong>!
              </v-card-subtitle>
            </v-col>
            <v-col cols="auto">
              <v-btn-toggle 
                v-model="isAutoRefresh" 
                density="compact"
                variant="outlined"
              >
                <v-btn 
                  :color="isAutoRefresh ? 'primary' : 'default'"
                  size="small"
                  @click="toggleAutoRefresh()"
                >
                  <v-icon>mdi-refresh</v-icon>
                  Auto-odświeżanie
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card>

        <!-- Charts Section -->
        <v-card elevation="2" class="pa-6 mb-6">
          <template v-for="(section, index) in chartSections" :key="section.component">
            <section class="mb-8">
              <v-card-title v-if="section.title" class="text-h5 mb-4 pa-0">
                {{ section.title }}
              </v-card-title>
              <Suspense>
                <template #default>
                  <component :is="section.component" :streamerName="displayName" />
                </template>
                <template #fallback>
                  <v-skeleton-loader type="article" />
                </template>
              </Suspense>
            </section>
            <v-divider v-if="index < chartSections.length - 1" class="my-6" />
          </template>
        </v-card>

        <!-- Quick Actions -->
        <v-card elevation="2" class="pa-6">
          <v-card-title class="text-h5 mb-4 pa-0">Szybkie akcje</v-card-title>
          <v-row dense>
            <v-col 
              v-for="action in quickActions" 
              :key="action.title"
              cols="12" 
              sm="6" 
              md="4"
            >
              <v-card 
                hover 
                class="fill-height d-flex flex-column transition-swing"
                :ripple="false"
              >
                <v-card-title class="pb-2">
                  <v-icon :color="action.color" class="mr-2">{{ action.icon }}</v-icon>
                  {{ action.title }}
                </v-card-title>
                <v-card-text class="flex-grow-1 pb-2">
                  {{ action.description }}
                </v-card-text>
                <v-card-actions class="pt-0">
                  <v-btn 
                    block 
                    :color="action.color" 
                    variant="outlined"
                    :to="action.to"
                    :disabled="action.disabled"
                  >
                    Przejdź
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { 
  useDocumentVisibility, 
  useIntervalFn, 
  useLocalStorage,
  useTitle,
  useToggle 
} from '@vueuse/core'
import { useStreamsStore } from '~/stores/streams'

// Explicit imports for chart components
const LazyChartViewers = defineAsyncComponent(() => import('~/components/Chart/Viewers.vue'))
const LazyChartSubsribers = defineAsyncComponent(() => import('~/components/Chart/Subsribers.vue'))
const LazyChartFollowers = defineAsyncComponent(() => import('~/components/Chart/Followers.vue'))
const LazyChartMessages = defineAsyncComponent(() => import('~/components/Chart/Messages.vue'))
const LazyChartTopChatters = defineAsyncComponent(() => import('~/components/Chart/TopChatters.vue'))

// Router & Store
const route = useRoute()
const displayName = computed(() => route.params.displayname as string)
const streamsStore = useStreamsStore()
const { streams } = storeToRefs(streamsStore)

// Vuetify composables
const { mobile } = useDisplay()
const theme = useTheme()

// VueUse composables
const documentVisibility = useDocumentVisibility()
const [isAutoRefresh, toggleAutoRefresh] = useToggle(true)
const lastVisit = useLocalStorage('dashboard-last-visit', Date.now())

// WebSocket connection
const ws = usePublicWebSocket()

// Computed properties
const streamData = computed(() => 
  streamsStore.getStreamByStreamerName(displayName.value)
)

const isStreamLive = computed(() => streamData.value?.isLive ?? false)

const dashboardTitle = computed(() => 
  `Dashboard - ${displayName.value} | BuddyShare`
)

// Set page title
useTitle(dashboardTitle)

// Auto-refresh when document is visible and auto-refresh is enabled
const { pause: pauseRefresh, resume: resumeRefresh } = useIntervalFn(() => {
  if (documentVisibility.value === 'visible' && isAutoRefresh.value) {
    streamsStore.fetchStreams()
  }
}, 30000) // Refresh every 30 seconds

// WebSocket management with reactive tracking
const previousOptionsId = ref<string | undefined>()

watchEffect(() => {
  const newId = streamData.value?.options_id?.toString()
  
  if (newId === previousOptionsId.value) return
  
  // Leave previous stream
  if (previousOptionsId.value) {
    ws.leaveStream(previousOptionsId.value)
  }
  
  // Join new stream if live
  if (streamData.value?.isLive && newId) {
    ws.joinStream(newId, true)
  }
  
  previousOptionsId.value = newId
})

// Pause refresh when document is not visible
watch(documentVisibility, (isVisible) => {
  if (isVisible) {
    resumeRefresh()
    // Update data when returning to tab
    streamsStore.fetchStreams()
  } else {
    pauseRefresh()
  }
})

// Update last visit timestamp
onMounted(() => {
  lastVisit.value = Date.now()
})

// Cleanup on unmount
onUnmounted(() => {
  if (previousOptionsId.value) {
    ws.leaveStream(previousOptionsId.value)
  }
  pauseRefresh()
})

// Quick actions configuration
const quickActions = computed(() => [
  {
    title: 'Ustawienia streama',
    description: 'Zarządzaj ustawieniami swojego streama.',
    icon: 'mdi-video',
    color: 'primary',
    to: `/user/${displayName.value}/dashboard/stream`,
    disabled: false
  },
  {
    title: 'Ustawienia konta',
    description: 'Dostosuj ustawienia swojego konta.',
    icon: 'mdi-cog',
    color: 'secondary',
    to: `/user/${displayName.value}/settings`,
    disabled: false
  },
  {
    title: 'Przejdź do kanału',
    description: 'Zobacz swój publiczny profil kanału.',
    icon: 'mdi-account',
    color: 'info',
    to: `/user/${displayName.value}`,
    disabled: false
  }
])

// Chart sections configuration
const chartSections = [
  { component: LazyChartViewers, title: 'Statystyki streama' },
  { component: LazyChartSubsribers },
  { component: LazyChartFollowers },
  { component: LazyChartMessages },
  { component: LazyChartTopChatters }
]
</script>

<style scoped>
/* Styl jest teraz w dużej mierze przejęty przez Vuetify */
</style>
