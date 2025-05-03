// useDashPlayer.ts
import { ref, watch, onBeforeUnmount, type Ref, nextTick } from 'vue';

export interface Quality {
  name: string;
  url: string; // Zmiana z 'dash' na 'url'
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

  onBeforeUnmount(() => {
    if (player.value) {
      player.value.off(dashjs.MediaPlayer.events.ERROR, errorHandler);
      player.value.destroy();
    }
    if (retryTimeout) clearTimeout(retryTimeout);
  });

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
    return q ? q.url : streamUrl.value; // Zmiana dostępu do właściwości
  };

  // Funkcja pozwalająca na aktualizację źródła odtwarzania bez niszczenia odtwarzacza
  const updateSource = async (newVideoElement: HTMLVideoElement, newStreamUrl: string, newQualities: Quality[] = []) => {
    console.log('Updating player source to:', newStreamUrl);

    // Aktualizuj referencję do elementu wideo
    videoElement.value = newVideoElement;

    // Aktualizuj jakości jeśli zostały podane
    if (newQualities.length > 0) {
      qualities.value = newQualities;
      if (newQualities.length > 0 && (!selectedQuality.value || !qualities.value.find(q => q.name === selectedQuality.value))) {
        selectedQuality.value = newQualities[0].name;
      }
    }

    // Jeśli nie mamy jeszcze odtwarzacza, zainicjalizuj go
    if (!player.value) {
      await initPlayer();
      return;
    }

    try {
      // Pobierz URL dla aktualnie wybranej jakości lub użyj nowego URL-a
      const url = qualities.value.length > 0 ?
        getDashUrl(selectedQuality.value) :
        newStreamUrl;

      // Zmień źródło bez niszczenia odtwarzacza
      player.value.attachView(newVideoElement);
      player.value.attachSource(url);

      console.log('Player source updated successfully');
    } catch (error) {
      console.error('Error updating player source:', error);
      // W przypadku błędu spróbuj zainicjalizować odtwarzacz od nowa
      player.value.destroy();
      player.value = null;
      await initPlayer();
    }
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
    if (!import.meta.client) return;
    const dashjs = await import('dashjs');


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
      player.value.addUTCTimingSource('urn:mpeg:dash:utc:http-xsdate:2014', 'http://time.akamai.com/?iso');
      player.value.initialize(
        videoElement.value!,
        url,
        true
      );

      // Konfiguracja dla dash.js
      const streamingSettings = {
        abr: {
          initialBitrate: {
            video: 800,
          },
        },
      };

      if (isLive.value) {
        streamingSettings.delay = { liveDelay: 12 };
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

  // Załadowanie aktualnie wybranej jakości
  const loadCurrentQuality = (seekTime?: number) => {
    // Sprawdź najpierw czy stream jest aktywny - jeśli nie, przerwij ładowanie
    if (!isLive.value) {
      console.log('Stream is offline, not loading quality');
      if (player.value) {
        player.value.reset();
      }
      return;
    }

    if (!player.value || !videoElement.value) return;

    try {
      // Znajdź wybraną jakość
      const quality = qualities.value.find(q => q.name === selectedQuality.value);
      const url = quality?.url || streamUrl.value;

      if (!url) {
        console.warn('No valid stream URL available');
        return;
      }

      console.log(`Loading quality: ${selectedQuality.value}, URL: ${url}`);

      // Zatrzymaj poprzedni strumień
      player.value.reset();

      // Inicjalizuj nowy strumień
      player.value.initialize(videoElement.value, url, false);
      player.value.setAutoPlay(true);
      player.value.attachView(videoElement.value);

      // Ustaw czas odtwarzania, jeśli podano
      if (seekTime) {
        player.value.seek(seekTime);
      }
    } catch (error) {
      console.error('Error loading stream:', error);
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

  // Obserwuj zmiany statusu LIVE
  watch(isLive, (isLiveNow) => {
    console.log('Live status changed:', isLiveNow);
    if (isLiveNow) {
      // Krótkie opóźnienie, aby dać czas na załadowanie innych danych
      setTimeout(() => {
        loadCurrentQuality();
      }, 500);
    } else if (player.value) {
      // Jeśli stream przestał być aktywny, zatrzymaj odtwarzacz
      console.log('Stream is now offline, resetting player');
      player.value.reset();
      player.value.attachView(null); // Odłącz widok, by zatrzymać próby ładowania
    }
  });

  const destroyPlayer = () => {
    if (player.value) {
      player.value.off(dashjs.MediaPlayer.events.ERROR, errorHandler);
      player.value.reset();
      player.value.destroy();
      player.value.updateSource("");
      player.value = null;
    }
    if (retryTimeout) clearTimeout(retryTimeout);
  };


  return {
    qualities,
    selectedQuality,
    changeQuality,
    showCopyNotification,
    copyToClipboard,
    initPlayer,
    isInitialized,
    destroyPlayer,
    updateSource
  };
}
