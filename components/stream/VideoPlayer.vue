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
          <v-img :src="avatar || '/Buddyshare.svg'" />
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
        v-if="isLiveRef || streamUrlRef"
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

interface Props {
  displayName: string;
  isLive?: boolean;
  viewerCount?: string | number;
  streamUrl?: string;
  qualities?: Quality[]; // prop dla jakości
  initialQuality?: string; // prop dla początkowej jakości
  avatar?: string;
  currentTime?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLive: false,
  viewerCount: "0",
  streamUrl: "",
  qualities: () => [],
  initialQuality: "",
  avatar: "/Buddyshare.svg",
  currentTime: "00:00",
});

// Referencje dla composable
const videoElement = ref<HTMLVideoElement | null>(null);
const streamUrlRef = ref(props.streamUrl);
const isLiveRef = ref(props.isLive);
const qualitiesRef = ref<Quality[]>(props.qualities);
const initialQualityRef = ref(props.initialQuality);

// Używamy composable zamiast bezpośredniej implementacji
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

// Aktualizacja referencji przy zmianie propsów
watch(() => props.streamUrl, (newUrl) => {
  streamUrlRef.value = newUrl;
});

watch(() => props.isLive, (newValue) => {
  isLiveRef.value = newValue;
});

watch(() => props.qualities, (newQualities) => {
  qualitiesRef.value = newQualities;
});

watch(() => props.initialQuality, (newQuality) => {
  initialQualityRef.value = newQuality;
});

onMounted(() => {
  initPlayer();
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
