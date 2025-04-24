// useDashPlayer.ts
import { ref, watch, onBeforeUnmount, type Ref, nextTick } from 'vue';
import * as dashjs from 'dashjs';

export interface Quality {
  name: string;
  dash: string;
}

export function useDashPlayer(
  videoElement: Ref<HTMLVideoElement | null>,
  streamUrl: Ref<string>,
  isLive: Ref<boolean>,
  initialQualities: Ref<Quality[]> = ref([]),
  initialQualityName: Ref<string> = ref('')
) {
  const player = ref<dashjs.MediaPlayerClass | null>(null);
  const qualities = ref<Quality[]>([]);
  const selectedQuality = ref<string>('');
  const isInitialized = ref(false);
  const showCopyNotification = ref(false);

  // Zarządzanie stanem inicjalizacji
  let retryCount = 0;
  let retryTimeout: NodeJS.Timeout | null = null;

  const errorHandler = (e: any) => {
    console.error('Player error:', e);
    if (
      e.error &&
      e.error.code === dashjs.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE &&
      retryCount < 3
    ) {
      retryCount++;
      retryTimeout = setTimeout(initPlayer, 1000 * retryCount);
    }
  };

  const getDashUrl = (qualityName: string) => {
    const q = qualities.value.find((q) => q.name === qualityName);
    return q ? q.dash : streamUrl.value;
  };

  const copyToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        showCopyNotification.value = true;
      })
      .catch((err) => {
        console.error("Błąd podczas kopiowania do schowka:", err);
      });
  };

  const initPlayer = async () => {
    if (!videoElement.value) {
      await nextTick();
      if (!videoElement.value) return;
    }

    // Synchronizacja jakości z propsami
    if (initialQualities.value.length > 0 && qualities.value.length === 0) {
      qualities.value = initialQualities.value;
    }

    if (initialQualityName.value && !selectedQuality.value) {
      selectedQuality.value = initialQualityName.value;
    } else if (qualities.value.length > 0 && !selectedQuality.value) {
      selectedQuality.value = qualities.value[0].name;
    }

    const url = getDashUrl(selectedQuality.value) || streamUrl.value;
    
    // Czyszczenie poprzedniej instancji
    if (player.value) {
      player.value.off(dashjs.MediaPlayer.events.ERROR, errorHandler);
      player.value.destroy();
      player.value = null;
    }

    // Inicjalizacja nowego player-a
    try {
      player.value = dashjs.MediaPlayer().create();
      player.value.initialize(
        videoElement.value!,
        url,
        true
      );

      // Konfiguracja dla dash.js
      const streamingSettings = {
        lowLatencyEnabled: false,
        buffer: {
          initialBufferLevel: isLive.value ? 3 : 10,
          stableBufferTime: isLive.value ? 6 : 20,
        },
        abr: {
          initialBitrate: {
            video: 800,
          },
          bandwidthSafetyFactor: 0.75,
        },
        jumpGaps: true,
      };

      if (isLive.value) {
        streamingSettings.delay = { liveDelay: 8 };
      }

      player.value.updateSettings({
        streaming: streamingSettings,
        debug: {
          logLevel: dashjs.Debug.LOG_LEVEL_NONE,
        },
      });

      player.value.on(dashjs.MediaPlayer.events.ERROR, errorHandler);

      isInitialized.value = true;
      retryCount = 0;

    } catch (error) {
      console.error('Player initialization failed:', error);
    }
  };

  const changeQuality = (newQuality: string) => {
    if (!player.value) {
      console.warn("Player not initialized yet");
      return;
    }

    selectedQuality.value = newQuality;
    const url = getDashUrl(newQuality);
    
    if (url) {
      console.log("Changing quality URL to:", url);

      // Zapisujemy aktualny czas odtwarzania
      const currentTime = videoElement.value?.currentTime || 0;

      // Zmieniamy źródło
      player.value.attachSource(url);

      // Po zmianie źródła ustawiamy ponownie czas odtwarzania
      setTimeout(() => {
        if (videoElement.value) {
          videoElement.value.currentTime = currentTime;
        }
      }, 500);
    } else {
      console.error("No URL found for quality:", newQuality);
    }
  };

  // Reaktywne przeładowanie przy zmianie parametrów
  watch([streamUrl, isLive], () => {
    retryCount = 0;
    if (retryTimeout) clearTimeout(retryTimeout);
    initPlayer();
  }, { immediate: true });

  watch(initialQualities, (newQualities) => {
    if (newQualities.length > 0) {
      qualities.value = newQualities;
      
      if (!selectedQuality.value && newQualities.length > 0) {
        selectedQuality.value = initialQualityName.value || newQualities[0].name;
      }
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (player.value) {
      player.value.off(dashjs.MediaPlayer.events.ERROR, errorHandler);
      player.value.destroy();
    }
    if (retryTimeout) clearTimeout(retryTimeout);
  });

  return {
    qualities,
    selectedQuality,
    changeQuality,
    showCopyNotification,
    copyToClipboard,
    initPlayer,
    isInitialized
  };
}
