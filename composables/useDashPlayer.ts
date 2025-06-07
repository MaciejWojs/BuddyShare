// useDashPlayer.ts
import { ref, watch, nextTick, type Ref, shallowRef, computed, onUnmounted } from 'vue'
import { 
  useClipboard, 
  tryOnUnmounted, 
  useTimeout,
  watchDebounced,
  useElementVisibility,
  useDocumentVisibility,
  until,
  whenever,
  useAsyncState
} from '@vueuse/core'

export interface Quality {
  name: string
  url: string
}

export function useDashPlayer(
  videoElement: Ref<HTMLVideoElement | null>,
  streamUrl: Ref<string>,
  isLive: Ref<boolean>,
  initialQualities: Ref<Quality[]> = ref([]),
  initialQualityName: Ref<string> = ref('')
) {
  const dashjs = shallowRef<any>(null)
  const player = shallowRef<any>(null)
  const qualities = ref<Quality[]>([])
  const selectedQuality = ref<string>('')
  const isInitialized = ref(false)
  const retryCount = ref(0)
  const isDestroyed = ref(false)
  const isLoading = ref(false)

  // Element visibility tracking for performance optimization
  const isElementVisible = useElementVisibility(videoElement)
  const isDocumentVisible = useDocumentVisibility()
  
  // Clipboard functionality
  const { copy: copyClipboard, copied: showCopyNotification } = useClipboard()
  
  // Auto-retry with exponential backoff using VueUse
  const retryDelay = computed(() => Math.min(1000 * Math.pow(2, retryCount.value), 10000))
  
  let retryTimeoutId: NodeJS.Timeout | null = null
  
  const startRetry = () => {
    stopRetry()
    retryTimeoutId = setTimeout(() => {
      if (!isDestroyed.value) {
        initPlayer()
      }
    }, retryDelay.value)
  }
  
  const stopRetry = () => {
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId)
      retryTimeoutId = null
    }
  }

  // Async state management for dash.js loading
  const { execute: loadDashjs, isLoading: isDashjsLoading } = useAsyncState(
    async () => {
      if (!dashjs.value && import.meta.client) {
        dashjs.value = await import('dashjs')
      }
      return dashjs.value
    },
    null,
    { immediate: false }
  )

  const errorHandler = (e: any) => {
    console.error('Player error:', e)
    
    // Only retry on specific network errors
    if (
      e.error?.code === dashjs.value?.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE &&
      retryCount.value < 3 &&
      !isDestroyed.value
    ) {
      retryCount.value++
      stopRetry()
      startRetry()
    }
  }

  const getDashUrl = (qualityName: string): string => {
    return qualities.value.find((q) => q.name === qualityName)?.url || streamUrl.value
  }

  const copyToClipboard = async () => {
    try {
      await copyClipboard(window.location.href)
    } catch (err) {
      console.error('Clipboard copy failed:', err)
    }
  }

  const destroyPlayer = () => {
    if (player.value && dashjs.value) {
      try {
        player.value.off(dashjs.value.MediaPlayer.events.ERROR, errorHandler)
        player.value.destroy()
      } catch (err) {
        console.error('Error destroying player:', err)
      }
    }
    player.value = null
    isInitialized.value = false
    stopRetry()
  }

  const initPlayer = async () => {
    if (!import.meta.client || isDestroyed.value || isLoading.value) return
    
    isLoading.value = true
    
    try {
      // Ensure dash.js is loaded
      await loadDashjs()
      
      // Wait for video element if not available
      await until(videoElement).toBeTruthy()
      
      if (!videoElement.value || isDestroyed.value) {
        isLoading.value = false
        return
      }

      // Sync quality state
      if (initialQualities.value.length > 0 && qualities.value.length === 0) {
        qualities.value = [...initialQualities.value]
      }

      if (!selectedQuality.value) {
        selectedQuality.value = initialQualityName.value || qualities.value[0]?.name || ''
      }

      const url = getDashUrl(selectedQuality.value)
      
      // Clean up existing player
      destroyPlayer()

      // Create new player instance
      const p = dashjs.value.MediaPlayer().create()
      
      // Configure player settings with safe defaults
      const settings: any = {
        streaming: {
          abr: { 
            initialBitrate: { video: 800 },
            autoSwitchBitrate: { video: true }
          },
          retryAttempts: {
            MPD: 3,
            XLinkExpansion: 1
          }
        },
        debug: { 
          logLevel: dashjs.value.Debug.LOG_LEVEL_NONE 
        }
      }

      // Add live delay settings only for live streams
      if (isLive.value) {
        settings.streaming.delay = {
          liveDelayFragmentCount: 4,
          liveDelay: 12
        }
      }

      p.updateSettings(settings)

      // Set up error handling
      p.on(dashjs.value.MediaPlayer.events.ERROR, errorHandler)
      
      // Initialize player
      p.initialize(videoElement.value, url, true)
      
      player.value = p
      isInitialized.value = true
      retryCount.value = 0
      
    } catch (err) {
      console.error('Player init failed:', err)
      if (retryCount.value < 3 && !isDestroyed.value) {
        retryCount.value++
        startRetry()
      }
    } finally {
      isLoading.value = false
    }
  }

  const updateSource = async (
    newVideoElement: HTMLVideoElement,
    newStreamUrl: string,
    newQualities: Quality[] = []
  ) => {
    if (isDestroyed.value) return
    
    // Update references
    videoElement.value = newVideoElement
    
    if (newQualities.length > 0) {
      qualities.value = [...newQualities]
      selectedQuality.value ||= newQualities[0]?.name || ''
    }

    // If no player exists, initialize new one
    if (!player.value) {
      await initPlayer()
      return
    }

    try {
      const url = getDashUrl(selectedQuality.value) || newStreamUrl
      
      // Safely update source
      if (player.value && videoElement.value) {
        player.value.attachView(videoElement.value)
        player.value.attachSource(url)
      }
    } catch (e) {
      console.error('Failed to update source:', e)
      // Fallback: reinitialize player
      await initPlayer()
    }
  }

  const changeQuality = async (newQuality: string) => {
    if (!player.value || isDestroyed.value) return
    
    selectedQuality.value = newQuality
    const url = getDashUrl(newQuality)
    const currentTime = videoElement.value?.currentTime ?? 0
    
    try {
      player.value.attachSource(url)
      
      // Restore playback position after quality change
      setTimeout(() => {
        if (videoElement.value && !isLive.value) {
          videoElement.value.currentTime = currentTime
        }
      }, 500)
    } catch (err) {
      console.error('Quality change failed:', err)
      await initPlayer()
    }
  }

  const loadCurrentQuality = async (seekTime?: number) => {
    if (!isLive.value || isDestroyed.value) {
      console.log('Offline stream or destroyed, not loading')
      return
    }

    const url = getDashUrl(selectedQuality.value)

    try {
      if (player.value && videoElement.value) {
        player.value.reset()
        player.value.initialize(videoElement.value, url, false)
        player.value.setAutoPlay(true)

        if (seekTime) {
          player.value.seek(seekTime)
        }
      }
    } catch (e) {
      console.error('Load stream failed:', e)
      await initPlayer()
    }
  }

  // Watchers with debouncing for stability
  watchDebounced(
    [streamUrl, isLive], 
    () => {
      if (!isDestroyed.value) {
        retryCount.value = 0
        stopRetry()
        initPlayer()
      }
    }, 
    { debounce: 300, immediate: true }
  )

  watch(
    initialQualities, 
    (newQualities) => {
      if (newQualities.length > 0 && !isDestroyed.value) {
        qualities.value = [...newQualities]
        selectedQuality.value ||= initialQualityName.value || newQualities[0].name
      }
    }, 
    { immediate: true }
  )

  // Performance optimization: only load when element is visible
  whenever(
    () => isElementVisible.value && isDocumentVisible.value && !isDestroyed.value,
    () => {
      if (!isInitialized.value && !isLoading.value) {
        initPlayer()
      }
    }
  )

  // Handle live stream state changes
  watch(isLive, async (live) => {
    if (isDestroyed.value) return
    
    if (live) {
      setTimeout(() => {
        if (!isDestroyed.value) {
          loadCurrentQuality()
        }
      }, 500)
    } else if (player.value) {
      try {
        player.value.reset()
        if (videoElement.value) {
          player.value.attachView(null)
        }
      } catch (err) {
        console.error('Error handling live state change:', err)
      }
    }
  })

  // Cleanup on unmount
  tryOnUnmounted(() => {
    isDestroyed.value = true
    destroyPlayer()
  })

  return {
    qualities,
    selectedQuality,
    changeQuality,
    showCopyNotification,
    copyToClipboard,
    initPlayer,
    isInitialized,
    destroyPlayer,
    updateSource,
    isLoading,
    isDashjsLoading
  }
}
