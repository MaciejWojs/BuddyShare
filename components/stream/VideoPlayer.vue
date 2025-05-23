<!-- components/stream/VideoPlayer.vue -->
<template>
  <!-- Główny komponent karty z animacjami ładowania -->
  <v-card class="d-flex flex-column h-100" color="grey-darken-4">
    <!-- Stream Header -->
    <v-card-title class="stream-header d-flex align-center justify-space-between py-2 px-4">
      <div class="d-flex align-center">
        <template v-if="isLoaded">
          <v-avatar size="40" class="mr-2">
            <v-img :src="avatar" />
          </v-avatar>
          <h2 class="text-h6 font-weight-bold">{{ displayName }}</h2>
        </template>
        <template v-else>
          <v-avatar size="40" class="mr-2 skeleton-bg" />
          <div class="skeleton-text skeleton-bg" style="width: 120px; height: 24px;"></div>
        </template>
      </div>

      <div class="d-flex align-center ga-2">
        <template v-if="isLoaded">
          <v-chip :color="isLiveRef ? 'red' : 'grey'" variant="tonal" size="small" prepend-icon="mdi-circle">
            {{ isLiveRef ? "LIVE" : "OFFLINE" }}
          </v-chip>
          <v-chip
            v-if="isLiveRef" 
            :color="isPublicStream ? 'green' : 'orange'" 
            variant="tonal" 
            size="small" 
            :prepend-icon="isPublicStream ? 'mdi-earth' : 'mdi-lock'"
          >
            {{ isPublicStream ? "PUBLIC" : "PRIVATE" }}
          </v-chip>
          <v-chip variant="outlined" size="small">
            <v-icon start size="small">mdi-account</v-icon>
            {{ viewerCount }}
          </v-chip>
        </template>
        <template v-else>
          <v-chip color="grey" variant="tonal" size="small" class="skeleton-bg">
            OFFLINE
          </v-chip>
          <v-chip v-if="isLiveRef" color="grey" variant="tonal" size="small" class="skeleton-bg">
            PUBLIC
          </v-chip>
          <v-chip variant="outlined" size="small" class="skeleton-bg">
            <v-icon start size="small">mdi-account</v-icon>
            0
          </v-chip>
        </template>
      </div>
    </v-card-title>

    <!-- Video Player -->
    <div class="video-wrapper flex-grow-1">
      <template v-if="isLoaded">
        <video ref="videoElement" controls autoplay muted class="video-player" v-if="isLiveRef && streamUrlRef"></video>
        
        <!-- Offline State -->
        <div v-else class="offline-state d-flex flex-column align-center justify-center">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-television-off</v-icon>
          <h3 class="text-h5 text-grey-lighten-1 mb-2">Stream offline</h3>
          <p class="text-body-2 text-grey-lighten-1 text-center">
            This stream is currently unavailable. <br />
            Try again later or check other streams.
          </p>
        </div>
      </template>
      <template v-else>
        <!-- Ulepszona wersja skeleton loadera dla obszaru wideo -->
        <div class="video-area-skeleton d-flex flex-column align-center justify-center" style="width: 100%; height: 100%;">
          <div class="position-relative" style="width: 100px; height: 100px;">
            <v-progress-circular 
              indeterminate 
              color="grey-lighten-1" 
              size="64" 
              width="4" 
              class="mb-2 infinite-spinner" 
              aria-label="Loading stream"
              :active="true"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Stream Controls -->
    <v-card-actions class="stream-controls pa-2 px-4 bg-grey-darken-3">
      <template v-if="isLoaded">
        <span class="text-caption text-medium-emphasis">
          {{ isLiveRef ? currentTime : "Offline" }}
        </span>
        <v-spacer />
        <SubscribeButton />
        <!-- Dropdown do wyboru jakości -->
        <v-menu v-if="qualities.length > 0" location="top" offset="4">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" color="white" size="small" class="text-none"
              prepend-icon="mdi-quality-high">
              {{ selectedQuality }}
            </v-btn>
          </template>
          <v-list density="compact" bg-color="grey-darken-3">
            <v-list-item v-for="quality in qualities" :key="quality.name" :value="quality.name" :title="quality.name"
              @click="changeQuality(quality.name)" :active="selectedQuality === quality.name" />
          </v-list>
        </v-menu>

        <div class="d-flex ga-1">
          <v-btn variant="text" color="white" icon="mdi-share-variant" size="small" @click="copyToClipboard" />
          <v-btn variant="text" color="white" icon="mdi-heart-outline" size="small" />
          <v-btn variant="text" color="white" icon="mdi-dots-vertical" size="small" />
        </div>
      </template>
      <template v-else>
        <span class="text-caption text-medium-emphasis skeleton-text skeleton-bg" style="width: 60px; height: 16px;"></span>
        <v-spacer />
        <v-btn disabled variant="text" size="small" class="skeleton-bg mr-2">
          Subscribe
        </v-btn>
        <v-btn disabled variant="text" color="white" size="small" class="text-none skeleton-bg mr-2"
          prepend-icon="mdi-quality-high">
          source
        </v-btn>
        <div class="d-flex ga-1">
          <v-btn disabled variant="text" color="white" icon="mdi-share-variant" size="small" class="skeleton-bg" />
          <v-btn disabled variant="text" color="white" icon="mdi-heart-outline" size="small" class="skeleton-bg" />
          <v-btn disabled variant="text" color="white" icon="mdi-dots-vertical" size="small" class="skeleton-bg" />
        </div>
      </template>
    </v-card-actions>
    
    <!-- Snackbar dla powiadomień - zawsze widoczny, niezależnie od stanu ładowania -->
    <v-snackbar v-model="showCopyNotification" timeout="1000" color="success" location="bottom">
      Copied to clipboard
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useDashPlayer, type Quality } from "@/composables/useDashPlayer";
import { useStreamsStore } from "~/stores/streams";
import { useWindowScroll } from "@vueuse/core";
import SubscribeButton from "../SubscribeButton.vue";

interface Props {
  displayName: string;
}

const props = defineProps<Props>();

// Pobieramy store ze streamami
const streamsStore = useStreamsStore();
const ws = usePublicWebSocket();

// Stan ładowania
const isLoaded = ref(false);

// Referencja na dane streamu
const streamData = computed(() =>
  streamsStore.getStreamByStreamerName(props.displayName)
);

// Referencje do danych streamu
const isLiveRef = computed(() => !!streamData.value?.isLive);
const isPublicStream = computed(() => {
  // Sprawdzamy czy stream jest publiczny - domyślnie true jeśli nie ma informacji
  return streamData.value?.isPublic !== undefined ? streamData.value.isPublic : true;
});
const streamUrlRef = computed(() => {
  if (
    streamData.value?.stream_urls &&
    Array.isArray(streamData.value.stream_urls) &&
    streamData.value.stream_urls.length > 0
  ) {
    // Zwracamy pole dash z pierwszego elementu tablicy stream_urls
    return streamData.value.stream_urls[0].dash || "";
  }
  return "";
});
const qualitiesRef = computed(() => {
  if (
    streamData.value?.stream_urls &&
    Array.isArray(streamData.value.stream_urls)
  ) {
    return streamData.value.stream_urls.map((q) => ({
      name: q.name || "default",
      url: q.dash || "", // Używamy pola dash dla adresu URL
    }));
  }
  return [];
});
const initialQualityRef = computed(() => {
  // Jeśli jest default_quality, użyj go
  if (streamData.value?.default_quality) {
    return streamData.value.default_quality;
  }
  // W przeciwnym razie użyj source albo pierwszej jakości
  const sourceQuality = qualitiesRef.value.find((q) => q.name === "source");
  if (sourceQuality) {
    return sourceQuality.name;
  }
  return qualitiesRef.value[0]?.name || null;
});
const viewerCount = computed(() => streamData.value?.viewer_count || 0);
const currentTime = ref("");
const avatar = computed(
  () => streamData.value?.profile_picture || "/Buddyshare.svg"
);

// Ustawienia dla video playera
const videoElement = ref<HTMLVideoElement | null>(null);

// Wykorzystanie composable useDashPlayer
const {
  qualities,
  selectedQuality,
  changeQuality,
  showCopyNotification,
  copyToClipboard,
  initPlayer,
} = useDashPlayer(
  videoElement,
  streamUrlRef,
  isLiveRef,
  qualitiesRef,
  initialQualityRef
);

// Aktualizacja czasu streama
const updateStreamTime = () => {
  if (streamData.value?.isLive && streamData.value?.created_at) {
    const startTime = new Date(streamData.value.created_at);
    const updateTime = () => {
      if (!isLiveRef.value) return;

      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      currentTime.value = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }
  return undefined;
};

// Obserwuj zmiany streamData aby zaktualizować czas
watch(
  streamData,
  () => {
    console.log("Stream data updated:", streamData.value);
    console.log("Stream URLs:", streamData.value?.stream_urls);
    console.log("Selected quality:", selectedQuality.value);
    console.log("Available qualities:", qualitiesRef.value);

    if (streamData.value && streamData.value.isLive) {
      const cleanupTimer = updateStreamTime();
      return cleanupTimer;
    }
    return undefined;
  },
  { immediate: true }
);

// // Obserwuj zmiany streamstore (dla aktualizacji w czasie rzeczywistym)
// watch(() => streamsStore.streams, () => {
//   // Aktualizacja zostanie obsłużona automatycznie przez computed properties
//   console.log('StreamStore updated, stream:', streamData.value);
// }, { deep: true });

onMounted(() => {
  initPlayer();
  console.log(`Mounted VideoPlayer for streamer: ${props.displayName}`);
  console.log('Current stream data:', streamData.value);
  console.log('All streams:', streamsStore.streams);
  // ws.joinStream(streamData.value?.options_id.toString());
});

watch(streamData, (newStreamData) => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 500);
  if (newStreamData && newStreamData.isLive) {
    ws.joinStream(newStreamData.options_id.toString());
  } else {
    ws.leaveStream(newStreamData?.options_id.toString());
  }
}, { immediate: true });

onBeforeUnmount(() => {
  // ws.leaveStream(streamData.value?.options_id.toString());
  console.log(`Unmounted VideoPlayer for streamer: ${props.displayName}`);
});
</script>

<script lang="ts">
export default {
  name: "VideoPlayer",
};
</script>

<style lang="scss" scoped>
.video-wrapper {
  position: relative;
  background: #000;
  flex: 1;

  .video-player {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .offline-state {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 1rem;
    text-align: center;

    h3,
    p {
      max-width: 90%;
    }
  }
}

.skeleton-bg {
  position: relative;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.1) !important;
  
  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.2) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: shimmer 1.5s infinite;
    content: '';
  }
}

.skeleton-text {
  border-radius: 4px;
}

.play-button-skeleton {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.infinite-spinner {
  animation: spin 1.5s linear infinite;
  will-change: transform;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
