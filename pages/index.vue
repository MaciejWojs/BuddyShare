<script setup lang="ts">
import { ClientOnly } from '#components';

const streamStore = useStreamsStore();
const authStore = useAuthStore();
const router = useRouter();
const api = useApi(); // Dodaj to
const searchQuery = ref("");

// Dodaj reactive mapę awatarów
const avatarCache = ref<Map<string, string>>(new Map());

// Funkcja do pobierania i cache'owania awatara
const getCachedAvatar = async (username: string, currentAvatar?: string) => {
  if (currentAvatar && currentAvatar !== '/Buddyshare.svg') {
    return currentAvatar;
  }
  
  if (avatarCache.value.has(username)) {
    return avatarCache.value.get(username)!;
  }
  
  try {
    const avatarUrl = await api.users.getUserAvatar(username);
    avatarCache.value.set(username, avatarUrl);
    return avatarUrl;
  } catch (error) {
    console.warn(`Nie udało się pobrać awatara dla ${username}:`, error);
    avatarCache.value.set(username, '/Buddyshare.svg');
    return '/Buddyshare.svg';
  }
};

const streams = computed(() =>
  streamStore.streams.filter(stream => {
    if (!authStore.authenticated) return stream.isPublic;

    return stream.username === authStore.userName || stream.isPublic;
  })
);

// Dodaj reactive mapę awatarów dla streamów
const streamAvatars = ref<Map<string, string>>(new Map());

// Funkcja do pobierania awatarów dla wszystkich streamów
const loadStreamAvatars = async () => {
  for (const stream of streams.value) {
    if (stream.username && !streamAvatars.value.has(stream.username)) {
      try {
        const avatarUrl = await getCachedAvatar(stream.username, stream.user?.avatarUrl);
        streamAvatars.value.set(stream.username, avatarUrl);
      } catch (error) {
        console.warn(`Nie udało się pobrać awatara dla ${stream.username}:`, error);
        streamAvatars.value.set(stream.username, '/Buddyshare.svg');
      }
  }
  }
};

// Funkcja do pobierania awatara dla konkretnego streamu
const getStreamAvatar = (username: string, fallback?: string) => {
  return streamAvatars.value.get(username) || fallback || '/Buddyshare.svg';
};

const hoverTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const dashPlayerInstance = ref<{ destroy: () => void } | null>(null);

// Funkcja przetwarzająca wyszukiwanie (dummy)
const handleSearch = () => {
  console.log("Wyszukiwanie:", searchQuery.value);
  // Funkcja fikcyjna - nie wykonuje faktycznego wyszukiwania
};

// Przekierowanie do strony streamu
const goToStream = (streamer: string) => {
  router.push(`/user/${streamer}`);
};

// Formatowanie liczby widzów
const formatViewCount = (count: number) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count.toString();
};

const streamerAndStreamingStatus = useState<Boolean>(
  "streamerAndStreamingStatus",
  () => false
);

// Zmienne do obsługi preview streamu po najechaniu
const videoElements = ref<Map<string, HTMLVideoElement>>(new Map());
const previewStreamUrl = ref('');
const isPreviewLive = ref(false);
const currentHoveredStream = ref<string | null>(null);
const previewQualities = ref<{ name: string, url: string }[]>([]);
const playerInitialized = ref(false);
// Ref, który przechowuje mapę: streamId → czy pokazujemy wideo?
const showPreviewMap = ref<Record<string, boolean>>({});

// Funkcja do obliczania dostępnych jakości dla streamu
const getStreamQualities = (stream) => {
  if (stream?.stream_urls && Array.isArray(stream.stream_urls)) {
    return stream.stream_urls.map(q => ({
      name: q.name || 'default',
      url: q.dash || '' // Używamy pola dash dla adresu URL
    }));
  }
  return [];
};

// Funkcja do uzyskania elementu wideo dla konkretnego streamu
const getVideoElement = (streamId: string): HTMLVideoElement | null => {
  return videoElements.value.get(streamId) || null;
};

// Używamy kompozycji useDashPlayer do obsługi odtwarzania
const dashPlayerRef = ref(null);

const shouldShowPreview = (streamId: string) => {
  return Boolean(showPreviewMap.value[streamId]);
};

// Inicjalizacja odtwarzacza dla wybranego streamu
const initializePlayerForStream = (streamId: string) => {
  const videoElement = getVideoElement(streamId);

  if (!videoElement) {
    console.error('Video element not found for stream:', streamId);
    return;
  }

  console.log('Initializing player with element:', videoElement);

  // Zniszcz istniejącą instancję przed tworzeniem nowej
  if (dashPlayerInstance.value) {
    try {
      dashPlayerInstance.value.destroy();
      dashPlayerInstance.value = null;
    } catch (error) {
      console.error('Error destroying previous player:', error);
    }
  }

  try {
    // Zresetuj źródło wideo przed inicjalizacją
    if (videoElement) {
      videoElement.src = '';
      videoElement.load();
    }

    // Utworzenie nowej instancji useDashPlayer dla tego elementu wideo
    const { initPlayer, destroyPlayer } = useDashPlayer(
      ref(videoElement),
      previewStreamUrl,
      isPreviewLive,
      previewQualities
    );

    initPlayer();

    // Używamy bezpieczniejszego wrappera dla funkcji destroy
    dashPlayerInstance.value = {
      destroy: () => {
        try {
          destroyPlayer();
        } catch (error) {
          console.error('Error in wrapped destroyPlayer:', error);
        }
      }
    };

    playerInitialized.value = true;
  } catch (error) {
    console.error('Failed to initialize player:', error);
    playerInitialized.value = false;
  }
};

// Zapisz referencję do elementu wideo po jego zamontowaniu i od razu wczytaj strumień
const onVideoMounted = (el, streamId) => {
  if (el instanceof HTMLVideoElement) {
    console.log('Video element mounted for stream:', streamId, el);
    videoElements.value.set(streamId, el);

    // Wstępne wczytanie strumienia w tle
    const stream = streams.value.find(s => s.id === streamId);
    if (stream?.streamUrl) {
      el.src = stream.streamUrl;
      el.load();  // preload="auto" + load → zaczyna pobierać
    }
  }
};

// Funkcja wywoływana po najechaniu na kartę streamu
const onStreamHover = (stream) => {
  if (!stream.isLive) return;

  // Najpierw wyczyść poprzedni timeout
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
    hoverTimeout.value = null;
  }

  // ustawiamy timeout, po którym pokazujemy wideo
  hoverTimeout.value = setTimeout(() => {
    showPreviewMap.value = { ...showPreviewMap.value, [stream.id]: true };
    currentHoveredStream.value = stream.id;
    previewStreamUrl.value = stream.streamUrl || '';
    isPreviewLive.value = stream.isLive;
    previewQualities.value = getStreamQualities(stream);

    // Użyj requestAnimationFrame dla lepszej synchronizacji
    requestAnimationFrame(() => {
      const videoElement = getVideoElement(stream.id);
      if (videoElement) {
        initializePlayerForStream(stream.id);
      }
    });
  }, 1500); // Skrócony timeout dla szybszej reakcji
};

// Funkcja wywoływana po zjechaniu myszką z karty streamu
const onStreamLeave = () => {
  console.log('Stream leave, was hovering:', currentHoveredStream.value);

  // czyścimy timeout i ukrywamy podgląd
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
    hoverTimeout.value = null;
  }

  if (currentHoveredStream.value) {
    showPreviewMap.value = { ...showPreviewMap.value, [currentHoveredStream.value]: false };
  }

  // Dodatkowe sprawdzenie instancji player-a
  if (dashPlayerInstance.value) {
    try {
      dashPlayerInstance.value.destroy();
    } catch (error) {
      console.error('Error destroying player:', error);
    } finally {
      dashPlayerInstance.value = null;
    }
  }

  // Zresetuj wszystkie stany związane z podglądem
  currentHoveredStream.value = null;
  isPreviewLive.value = false;
  previewStreamUrl.value = '';
  previewQualities.value = [];
  playerInitialized.value = false;
};

// Brakuje czyszczenia timeoutów przy opuszczaniu komponentu
onBeforeUnmount(() => {
  console.log("Opuszczanie komponentu, czyszczenie zasobów");
  streamerAndStreamingStatus.value = false;

  // Czyszczenie timeoutów
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value);
    hoverTimeout.value = null;
  }

  // Niszczenie odtwarzacza, jeśli istnieje
  if (dashPlayerInstance.value) {
    dashPlayerInstance.value.destroyPlayer();
  }
});

// Dodaj watcher do ładowania awatarów gdy streamy się zmienią
watch(streams, () => {
  loadStreamAvatars();
}, { immediate: true });

console.log(streamerAndStreamingStatus.value);
</script>
<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-6 font-weight-bold">Popularne streamy</h1>

    <ClientOnly>

      <!-- Pasek wyszukiwania -->
      <v-sheet class="mb-6 search-container">
        <v-text-field v-model="searchQuery" label="Szukaj streamów..." variant="outlined" density="comfortable"
          hide-details clearable @keyup.enter="handleSearch" prepend-inner-icon="mdi-magnify">
          <template v-slot:append>
            <v-btn color="primary" @click="handleSearch" variant="text">
              <v-icon>mdi-magnify</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-sheet>
    </ClientOnly>

    <!-- Brak streamów -->
    <v-sheet v-if="!streams || streams.length === 0"
      class="py-12 rounded d-flex flex-column align-center justify-center" color="grey-darken-4">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-television-off</v-icon>
      <h3 class="text-h5 text-grey-lighten-1 mb-2">Brak dostępnych streamów</h3>
      <p class="text-body-2 text-grey-lighten-1 text-center">
        Aktualnie nie ma żadnych dostępnych streamów.<br />
        Sprawdź ponownie później.
      </p>
    </v-sheet>

    <!-- Ukryty element video do podglądu przy hoverze -->
    <video ref="hoverVideo" class="hover-video" muted></video>

    <v-row>
      <v-col v-for="stream in streams" :key="stream.id" cols="12" sm="6" md="4" lg="3">
        <v-card @click="goToStream(stream.username)" @mouseenter="onStreamHover(stream)" @mouseleave="onStreamLeave"
          class="stream-card" :class="{ 'live-border': stream.isLive, 'is-preview': shouldShowPreview(stream.id) }"
          hover>
          <!-- Thumbnail z indykatorem live -->
          <div class="thumbnail-container">
            <v-img v-if="!shouldShowPreview(stream.id) || !stream.isLive"
              :src="stream.thumbnail || '/Buddyshare.svg'" height="160px" cover class="stream-thumbnail" />

            <!-- Kontener na wideo podczas hovera - używamy unikalnej referencji dla każdego streamu -->
            <div v-if="shouldShowPreview(stream.id) && stream.isLive" class="video-preview-container">
              <video :ref="el => onVideoMounted(el, stream.id)" class="hover-video-preview" muted autoplay
                playsinline></video>
            </div>

            <v-chip v-if="stream.isLive" color="red" size="small" label class="live-chip">
              LIVE
            </v-chip>
            <v-chip v-else color="grey" size="small" label class="live-chip">
              OFFLINE
            </v-chip>

            <!-- Liczba widzów -->
            <div class="viewer-count">
              <v-icon size="small" color="white">mdi-account</v-icon>
              <span>{{ formatViewCount(stream.viewer_count || 0) }}</span>
            </div>
          </div>

          <!-- Informacje o streamie -->
          <v-card-item>
            <div class="d-flex align-center">
              <!-- Avatar streamera -->
              <v-avatar class="me-3" size="36">
                <v-img :src="getStreamAvatar(stream.username, stream.user?.avatarUrl)" />
              </v-avatar>

              <!-- Tytuł i autor -->
              <div>
                <v-card-title class="pa-0 text-truncate text-body-1 font-weight-bold">
                  {{ stream.title || "Untitled Stream" }}
                </v-card-title>
                <v-card-subtitle class="pa-0 text-truncate">
                  {{ stream.username || "Unknown User" }}
                </v-card-subtitle>
              </div>
            </div>

            <v-card-text class="pa-0 mt-2 text-caption">
              <div class="d-flex justify-space-between text-disabled">
                <span>{{ stream.category || "No Category" }}</span>
                <!-- Dodaj datę dla nieaktywnych streamów -->
                <span v-if="!stream.isLive && stream.startTime">
                  {{ new Date(stream.startTime).toLocaleDateString() }}
                </span>
              </div>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.stream-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.stream-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.live-border {
  border: 2px solid rgb(var(--v-theme-error));
}

.thumbnail-container {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.stream-thumbnail {
  transition: filter 0.3s;
}

.stream-card:hover .stream-thumbnail {
  filter: brightness(1.1);
}

.live-chip {
  position: absolute;
  top: 10px;
  left: 10px;
  font-weight: bold;
  opacity: 0.9;
  z-index: 2;
}

.viewer-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: white;
  z-index: 2;
}

.hover-video {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
}

.video-preview-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: #000;
}

.hover-video-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.is-preview .thumbnail-container {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
