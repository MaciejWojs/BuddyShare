<!-- components/stream/VideoPlayer.vue -->
<template>
  <v-card class="d-flex flex-column h-100" color="grey-darken-4">
    <!-- Stream Header -->
    <v-card-title class="stream-header d-flex align-center justify-space-between py-2 px-4">
      <div class="d-flex align-center">
        <v-avatar size="40" class="mr-2">
          <v-img :src="avatar || '/Buddyshare.svg'" />
        </v-avatar>
        <h2 class="text-h6 font-weight-bold">{{ displayName }}</h2>
      </div>

      <div class="d-flex align-center ga-2">
        <v-chip
          :color="isLive ? 'red' : 'grey'"
          variant="tonal"
          size="small"
          prepend-icon="mdi-circle"
        >
          {{ isLive ? "LIVE" : "OFFLINE" }}
        </v-chip>
        <v-chip variant="outlined" size="small">
          <v-icon start size="small">mdi-account</v-icon>
          {{ viewerCount }}
        </v-chip>
      </div>
    </v-card-title>

    <!-- Video Player -->
    <div class="video-wrapper flex-grow-1">
      <video ref="videoElement" controls autoplay muted class="video-player" v-if="isLive || props.streamUrl"></video>
      
      <!-- Offline State -->
      <div v-else class="offline-state d-flex flex-column align-center justify-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-television-off</v-icon>
        <h3 class="text-h5 text-grey-lighten-1 mb-2">Transmisja offline</h3>
        <p class="text-body-2 text-grey-lighten-1 text-center">
          Ten stream jest obecnie niedostępny. <br>
          Spróbuj ponownie później lub sprawdź inne transmisje.
        </p>
      </div>
    </div>

    <!-- Stream Controls -->
    <v-card-actions class="stream-controls pa-2 px-4 bg-grey-darken-3">
      <span class="text-caption text-medium-emphasis">
        {{ isLive ? currentTime : "Offline" }}
      </span>
      <v-spacer />

      <!-- Poprawiony dropdown do wyboru jakości z działającym kliknięciem -->
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
        <v-list density="compact" bg-color="grey-darken-3">
          <v-list-item
            v-for="quality in qualities"
            :key="quality.name"
            :value="quality.name"
            :title="quality.name"
            @click="handleQualityChange(quality.name)"
            :active="selectedQuality === quality.name"
          />
        </v-list>
      </v-menu>

      <div class="d-flex ga-1">
        <v-btn variant="text" color="white" icon="mdi-share-variant" size="small" />
        <v-btn variant="text" color="white" icon="mdi-heart-outline" size="small" />
        <v-btn variant="text" color="white" icon="mdi-dots-vertical" size="small" />
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as dashjs from 'dashjs';

// Definiuję nazwę komponentu dla lepszego debugowania
const name = 'VideoPlayer';

interface Quality {
  name: string;
  dash: string;
}

interface Props {
  displayName: string;
  isLive?: boolean;
  viewerCount?: string | number;
  streamUrl?: string;
  qualities?: Quality[];              // nowy prop
  initialQuality?: string;           // nowy prop
  avatar?: string;
  currentTime?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLive: false,
  viewerCount: '0',
  streamUrl: '',
  qualities: () => [],
  initialQuality: '',
  avatar: '/Buddyshare.svg',
  currentTime: '00:00'
});

const videoElement = ref<HTMLVideoElement | null>(null);
let dashPlayer: any = null;

// Stan wybranej jakości
const selectedQuality = ref(props.initialQuality || (props.qualities.length ? props.qualities[0].name : ''));

const getDashUrl = (qualityName: string) => {
  const q = props.qualities.find(q => q.name === qualityName);
  return q ? q.dash : props.streamUrl;
};

const errorHandler = (e: any) => {
  if (e.error && e.error.code === dashjs.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE) {
    console.error('Błąd ładowania manifestu:', e);
    // Tutaj można dodać logikę ponownych prób
  }
};

const initDashPlayer = () => {
  if (!videoElement.value) return;

  const url = getDashUrl(selectedQuality.value) || props.streamUrl;
  
  if (!dashPlayer) {
    dashPlayer = dashjs.MediaPlayer().create();
    dashPlayer.initialize(videoElement.value, url, true);
    dashPlayer.on(dashjs.MediaPlayer.events.ERROR, errorHandler);
  } else {
    dashPlayer.attachSource(url);
  }

  // Uproszczone, kluczowe ustawienia dla redukcji buforowania
  const streamingSettings = {
    // Wyłączamy tryb niskiego opóźnienia dla bardziej stabilnego odtwarzania
    lowLatencyEnabled: false,
    // Większe bufory dla stabilności
    buffer: {
      // Zwiększamy początkowy bufor
      initialBufferLevel: props.isLive ? 3 : 10,
      // Większy bufor dla wysokiej jakości
      stableBufferTime: props.isLive ? 6 : 20
    },
    // Ustawienia adaptacyjnej zmiany jakości
    abr: {
      // Startujemy od niższej jakości dla szybszego rozpoczęcia
      initialBitrate: {
        video: 800 // kbps
      },
      // Używamy tylko 85% wykrytej przepustowości dla zapasu
      bandwidthSafetyFactor: 0.75
    },
    // Automatyczne przeskakiwanie luk w strumieniu
    jumpGaps: true
  };

  // Dodatkowe ustawienia dla transmisji na żywo
  if (props.isLive) {
    // Większe opóźnienie dla transmisji na żywo zapewnia stabilniejsze odtwarzanie
    streamingSettings.delay = { liveDelay: 8 };
  }

  dashPlayer.updateSettings({
    streaming: streamingSettings,
    debug: {
      logLevel: dashjs.Debug.LOG_LEVEL_NONE
    }
  });

  // if (props.isLive) {
  //   dashPlayer.setLiveDelay(8); // Zgodne z ustawieniem wyżej
  // }
};

// Funkcja obsługująca kliknięcie na opcję jakości
const handleQualityChange = (newQuality: string) => {
  console.log('Changing quality to:', newQuality);
  selectedQuality.value = newQuality;
  changeQuality(newQuality);
};

const changeQuality = (newQuality: string) => {
  if (!dashPlayer) {
    console.warn('Player not initialized yet');
    return;
  }
  
  const url = getDashUrl(newQuality);
  if (url) {
    console.log('Changing quality URL to:', url);
    
    // Zapisujemy aktualny czas odtwarzania
    const currentTime = videoElement.value?.currentTime || 0;
    
    // Zmieniamy źródło
    dashPlayer.attachSource(url);
    
    // Po zmianie źródła ustawiamy ponownie czas odtwarzania
    // (z małym opóźnieniem, aby dać czas na załadowanie)
    setTimeout(() => {
      if (videoElement.value) {
        videoElement.value.currentTime = currentTime;
      }
    }, 500);
  } else {
    console.error('No URL found for quality:', newQuality);
  }
};

const destroyPlayer = () => {
  if (dashPlayer) {
    dashPlayer.off(dashjs.MediaPlayer.events.ERROR, errorHandler);
    dashPlayer.destroy();
    dashPlayer = null;
  }
};

// Hooks
onMounted(() => {
  initDashPlayer();
});

watch(
  () => props.streamUrl,
  (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) initDashPlayer();
  }
);

watch(
  () => props.isLive,
  () => {
    if (dashPlayer) {
      dashPlayer.updateSettings({
        streaming: {
          lowLatencyEnabled: props.isLive,
          scheduleWhilePaused: props.isLive
        }
      });
      if (props.isLive) dashPlayer.setLiveDelay(2);
    }
  }
);

onBeforeUnmount(() => {
  destroyPlayer();
});
</script>

<script lang="ts">
export default {
  name: 'VideoPlayer'
}
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
    
    h3, p {
      max-width: 90%;
    }
  }
}
</style>