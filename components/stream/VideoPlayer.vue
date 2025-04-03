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
      <video controls autoplay muted class="video-player">
        <source :src="streamUrl" type="application/x-mpegURL" />
      </video>
    </div>

    <!-- Stream Controls -->
    <v-card-actions class="stream-controls pa-2 px-4 bg-grey-darken-3">
      <span class="text-caption text-medium-emphasis">{{ currentTime }}</span>
      <v-spacer />
      <div class="d-flex ga-1">
        <v-btn variant="text" color="white" icon="mdi-share-variant" size="small" />
        <v-btn variant="text" color="white" icon="mdi-heart-outline" size="small" />
        <v-btn variant="text" color="white" icon="mdi-dots-vertical" size="small" />
      </div>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
// Definiuję nazwę komponentu dla lepszego debugowania
const name = 'VideoPlayer';

interface Props {
  displayName: string;
  isLive?: boolean;
  viewerCount?: string | number;
  streamUrl?: string;
  avatar?: string;
  currentTime?: string;
}

withDefaults(defineProps<Props>(), {
  isLive: false,
  viewerCount: '0',
  streamUrl: '',
  avatar: '/Buddyshare.svg',
  currentTime: '00:00'
});
</script>

<!-- Rozwiązanie alternatywne - dodanie zwykłego script dla definicji nazwy -->
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'VideoPlayer'
});
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
}
</style>