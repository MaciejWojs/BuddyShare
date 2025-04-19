<!-- pages/[displayname]/index.vue -->
<template>
    <v-container
      fluid
      class="stream-layout pa-0 fill-height"
    >
      <v-row
        no-gutters
        class="fill-height"
      >
        <!-- Main Content Column -->
        <v-col
          cols="12"
          lg="9"
          class="h-100"
        >
          <v-responsive
            :aspect-ratio="16 / 9"
            class="h-100"
          >
            <!-- Używamy komponentu VideoPlayer zamiast powtarzać kod -->
            <LazyVideoPlayer
              :display-name="displayName"
              :is-live="isLive"
              viewer-count="12.8K"
              :stream-url="streamUrl"
              avatar="/Buddyshare.svg"
              current-time="22:02"
            />
          </v-responsive>
        </v-col>
        </v-row>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref } from "vue";
  
  definePageMeta({
    middleware: ["user-exists", "is-banned", "test-middleware", "is-moderator"],
  });
  
  const route = useRoute();
  const displayName = route.params.displayname;
  const isLive = ref(true);
  
  const headers = useRequestHeaders(["cookie"]);
  const config = useRuntimeConfig();
  const BACK_HOST = config.public.BACK_HOST;
  const endpoint = `http://${BACK_HOST}/streamers/${displayName}`;
  
  const streamerData = ref(null);
  const streamUrl = ref("");
  
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
      credentials: "include",
    });
    streamerData.value = await response.json();
    
    // Sprawdzanie czy otrzymaliśmy prawidłowe dane
    if (streamerData.value && streamerData.value.stream && streamerData.value.stream.urls) {
      console.log("Streamer data fetched successfully:", streamerData.value);
      
      // Ustawiamy status transmisji na żywo
      if (streamerData.value.stream.isLive !== undefined) {
        isLive.value = streamerData.value.stream.isLive;
      }
      
      // Pobieramy URL transmisji DASH
      const streamUrls = streamerData.value.stream.urls;
      if (streamUrls.length > 0 && streamUrls[0].qualities) {
        // Domyślnie używamy jakości "source", jeśli dostępna
        const sourceQuality = streamUrls[0].qualities.find(q => q.name === "source");
        if (sourceQuality && sourceQuality.dash) {
          streamUrl.value = sourceQuality.dash
          console.log("Using stream URL:", streamUrl.value);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch streamer data:', error);
  }
  
  console.log("Streamer data:", streamerData.value); 
  </script>
  
  <style lang="scss">
  .stream-layout {
    height: 100vh;
    background: #0a0a0a;
  }
  
  // Mobile optimizations
  @media (max-width: 1279px) {
    .stream-layout {
      height: auto;
      min-height: 100vh;
    }
  
    .h-100 {
      height: auto !important;
    }
  }
  </style>
  