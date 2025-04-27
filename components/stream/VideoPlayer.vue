<!-- components/stream/VideoPlayer.vue -->
<template>
  <v-card
    class="d-flex flex-column h-100"
    color="grey-darken-4"
  >
    <!-- Stream Header -->
    <v-card-title
      class="stream-header d-flex align-center justify-space-between py-2 px-4"
    >
      <div class="d-flex align-center">
        <v-avatar
          size="40"
          class="mr-2"
        >
          <v-img :src="avatar" />
        </v-avatar>
        <h2 class="text-h6 font-weight-bold">{{ displayName }}</h2>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip
          :color="isLiveRef ? 'red' : 'grey'"
          variant="tonal"
          size="small"
          prepend-icon="mdi-circle"
        >
          {{ isLiveRef ? "LIVE" : "OFFLINE" }}
        </v-chip>
        <v-chip
          variant="outlined"
          size="small"
        >
          <v-icon
            start
            size="small"
            >mdi-account</v-icon
          >
          {{ viewerCount }}
        </v-chip>
      </div>
    </v-card-title>

    <!-- Video Player -->
    <div class="video-wrapper flex-grow-1">
      <video
        ref="videoElement"
        controls
        autoplay
        muted
        class="video-player"
        v-if="isLiveRef && streamUrlRef"
      ></video>

      <!-- Offline State -->
      <div
        v-else
        class="offline-state d-flex flex-column align-center justify-center"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-4"
          >mdi-television-off</v-icon
        >
        <h3 class="text-h5 text-grey-lighten-1 mb-2">Stream offline</h3>
        <p class="text-body-2 text-grey-lighten-1 text-center">
          This stream is currently unavailable. <br />
          Try again later or check other streams.
        </p>
      </div>
    </div>

    <!-- Stream Controls -->
    <v-card-actions class="stream-controls pa-2 px-4 bg-grey-darken-3">
      <span class="text-caption text-medium-emphasis">
        {{ isLiveRef ? currentTime : "Offline" }}
      </span>
      <v-spacer />

      <!-- Dropdown do wyboru jakości -->
      <v-menu
        v-if="qualities.length > 0"
        location="top"
        offset="4"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            color="white"
            size="small"
            class="text-none"
            prepend-icon="mdi-quality-high"
          >
            {{ selectedQuality }}
          </v-btn>
        </template>
        <v-list
          density="compact"
          bg-color="grey-darken-3"
        >
          <v-list-item
            v-for="quality in qualities"
            :key="quality.name"
            :value="quality.name"
            :title="quality.name"
            @click="changeQuality(quality.name)"
            :active="selectedQuality === quality.name"
          />
        </v-list>
      </v-menu>

      <!-- Snackbar dla powiadomień -->
      <v-snackbar
        v-model="showCopyNotification"
        timeout="1000"
        color="success"
        location="bottom"
      >
        Copied to clipboard
      </v-snackbar>

      <div class="d-flex ga-1">
        <v-btn
          variant="text"
          color="white"
          icon="mdi-share-variant"
          size="small"
          @click="copyToClipboard"
        />
        <v-btn
          variant="text"
          color="white"
          icon="mdi-heart-outline"
          size="small"
        />
        <v-btn
          variant="text"
          color="white"
          icon="mdi-dots-vertical"
          size="small"
        />
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useDashPlayer, type Quality } from '@/composables/useDashPlayer';
import { useStreamsStore } from '~/stores/streams';

interface Props {
  displayName: string;
}

const props = defineProps<Props>();

// Pobieramy store ze streamami
const streamsStore = useStreamsStore();

// Referencja na dane streamu
const streamData = computed(() => streamsStore.getStreamByStreamerName(props.displayName));

// Referencje do danych streamu
const isLiveRef = computed(() => !!streamData.value?.isLive);
const streamUrlRef = computed(() => {
  if (streamData.value?.stream_urls && Array.isArray(streamData.value.stream_urls) && streamData.value.stream_urls.length > 0) {
    // Zwracamy pole dash z pierwszego elementu tablicy stream_urls
    return streamData.value.stream_urls[0].dash || '';
  }
  return '';
});
const qualitiesRef = computed(() => {
  if (streamData.value?.stream_urls && Array.isArray(streamData.value.stream_urls)) {
    return streamData.value.stream_urls.map(q => ({ 
      name: q.name || 'default',
      url: q.dash || '' // Używamy pola dash dla adresu URL
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
  const sourceQuality = qualitiesRef.value.find(q => q.name === 'source');
  if (sourceQuality) {
    return sourceQuality.name;
  }
  return qualitiesRef.value[0]?.name || null;
});
const viewerCount = computed(() => streamData.value?.viewer_count || 0);
const currentTime = ref('');
const avatar = computed(() => streamData.value?.profile_picture || "/Buddyshare.svg");

// Ustawienia dla video playera
const videoElement = ref<HTMLVideoElement | null>(null);

// Wykorzystanie composable useDashPlayer
const {
  qualities,
  selectedQuality,
  changeQuality,
  showCopyNotification,
  copyToClipboard,
  initPlayer
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
      currentTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }
  return undefined;
};

// Obserwuj zmiany streamData aby zaktualizować czas
watch(streamData, () => {
  console.log('Stream data updated:', streamData.value);
  console.log('Stream URLs:', streamData.value?.stream_urls);
  console.log('Selected quality:', selectedQuality.value);
  console.log('Available qualities:', qualitiesRef.value);
  
  if (streamData.value && streamData.value.isLive) {
    const cleanupTimer = updateStreamTime();
    return cleanupTimer;
  }
  return undefined;
}, { immediate: true });

// Obserwuj zmiany streamstore (dla aktualizacji w czasie rzeczywistym)
watch(() => streamsStore.streams, () => {
  // Aktualizacja zostanie obsłużona automatycznie przez computed properties
  console.log('StreamStore updated, stream:', streamData.value);
}, { deep: true });

onMounted(() => {
  initPlayer();
  console.log(`Mounted VideoPlayer for streamer: ${props.displayName}`);
  console.log('Current stream data:', streamData.value);
  console.log('All streams:', streamsStore.streams);
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
</style>
