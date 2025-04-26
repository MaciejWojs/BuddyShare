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
          <!-- Poprawione przekazywanie jakości do VideoPlayer -->
          <LazyVideoPlayer
            :display-name="displayName"
            :is-live="isLive"
            viewer-count="12.8K"
            :stream-url="streamUrl"
            :qualities="streamerData?.stream?.urls?.[0]?.qualities || []"
            :initial-quality="selectedQuality"
            avatar="/Buddyshare.svg"
            current-time="22:02"
          />
        </v-responsive>

        <!-- Vertical spacer -->
        <div class="my-6"></div>
        <!-- Stream info section -->
        <div class="stream-info pa-4 bg-grey-darken-3 rounded">
          <h1 class="text-h4 mb-2">{{ streamTitle }}</h1>
          <p class="text-body-1 mb-4">{{ streamDescription }}</p>

          <v-divider class="mb-3"></v-divider>

          <div class="d-flex align-center">
            <v-avatar
              class="mr-3"
              size="42"
            >
              <v-img
                src="/Buddyshare.svg"
                alt="Streamer avatar"
              />
            </v-avatar>
            <div>
              <span class="text-h6">{{ displayName }}</span>
              <div class="text-caption">{{ streamerDescription }}</div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Chat Column -->
      <v-col
        cols="12"
        lg="3"
        class="h-100 bg-grey-darken-4"
      >
        <LiveChat
          :messages="chatMessages"
          :online-count="onlineCount"
          title="Live Chat"
          @send-message="handleSendMessage"
          @message-action="handleMessageAction"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

definePageMeta({
  middleware: ["user-exists", "is-banned", "test-middleware", "is-moderator"],
});

const route = useRoute();
const displayName = route.params.displayname;
const isLive = ref(false);
const onlineCount = ref("128");

// Dodajemy nowe reaktywne zmienne dla tytułu i opisu
const streamTitle = ref(`${displayName} has no stream title`);
const streamDescription = ref(`${displayName} has no stream description`);
const streamerDescription = ref("");

const headers = useRequestHeaders(["cookie"]);
const config = useRuntimeConfig();
const BACK_HOST = config.public.BACK_HOST;
const endpoint = `http://${BACK_HOST}/streamers/${displayName}`;

const streamerData = ref(null);
const availableQualities = ref<string[]>([]);
const selectedQuality = ref("source");
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
  if (
    streamerData.value &&
    streamerData.value.stream &&
    streamerData.value.stream.urls
  ) {
    console.log("Streamer data fetched successfully:", streamerData.value);

    // Ustawiamy status transmisji na żywo
    if (streamerData.value.stream.isLive !== undefined) {
      isLive.value = streamerData.value.stream.isLive;
    }

    // Ustawiamy tytuł i opis streama
    if (streamerData.value.stream.title) {
      streamTitle.value = streamerData.value.stream.title;
    }

    if (streamerData.value.stream.description) {
      streamDescription.value = streamerData.value.stream.description;
    }

    // Ustawiamy opis streamera
    if (
      streamerData.value.userInfo &&
      streamerData.value.userInfo.description
    ) {
      streamerDescription.value = streamerData.value.userInfo.description;
    }

    // Pobieramy dostępne jakości i URL transmisji DASH
    const streamUrls = streamerData.value.stream.urls;
    if (streamUrls.length > 0 && streamUrls[0].qualities) {
      availableQualities.value = streamUrls[0].qualities.map((q) => q.name);

      console.log("Available qualities:", availableQualities.value);

      // Ustaw domyślną jakość na 'source' jeśli dostępna
      if (availableQualities.value.includes("source")) {
        selectedQuality.value = "source";
      } else if (availableQualities.value.length > 0) {
        selectedQuality.value = availableQualities.value[0];
      }

      // Ustaw początkowy URL
      const initialQuality = streamUrls[0].qualities.find(
        (q) => q.name === selectedQuality.value
      );
      if (initialQuality) {
        streamUrl.value = initialQuality.dash;
      }
    }
  }
} catch (error) {
  console.error("Failed to fetch streamer data:", error);
}

// Obserwuj zmiany jakości
watch(selectedQuality, (newQuality) => {
  if (streamerData.value?.stream?.urls?.[0]?.qualities) {
    const qualities = streamerData.value.stream.urls[0].qualities;
    const selected = qualities.find((q) => q.name === newQuality);
    if (selected) {
      streamUrl.value = selected.dash;
    }
  }
});

console.log("Streamer data:", streamerData.value);

// Chat functionality
const chatMessages = ref([
  {
    user: "System",
    text: "Welcome to the stream! Please follow our community guidelines.",
    time: new Date(Date.now() - 3600000),
    type: "system",
  },
  {
    user: "StreamerFan42",
    text: "Hey everyone! Excited for today's stream.",
    time: new Date(Date.now() - 2400000),
    type: "user",
    role: "user",
    avatar: "/Buddyshare.svg",
  },
  {
    user: "GamingGuru",
    text: "The quality looks great today!",
    time: new Date(Date.now() - 1800000),
    type: "user",
    role: "user",
  },
  {
    user: "System",
    text: "StreamerFan42 subscribed for 3 months!",
    time: new Date(Date.now() - 1200000),
    type: "system",
  },
  {
    user: "TechWizard",
    text: "What settings are you using? Everything looks so smooth",
    time: new Date(Date.now() - 900000),
    type: "user",
    role: "user",
  },
  {
    user: "ModeratorUser",
    text: "Remember everyone to follow the chat rules!",
    time: new Date(Date.now() - 700000),
    type: "user",
    role: "moderator",
  },
  {
    user: "ChillVibes",
    text: "👋 Just joined, what did I miss?",
    time: new Date(Date.now() - 600000),
    type: "user",
    role: "user",
  },
  {
    user: "PixelPro",
    text: "This is exactly what I needed today",
    time: new Date(Date.now() - 300000),
    type: "user",
    role: "user",
  },
  {
    user: displayName,
    text: "Thanks for watching everyone!",
    time: new Date(Date.now() - 200000),
    type: "user",
    role: "broadcaster",
  },
  {
    user: "GameMaster99",
    text: "LOL that reaction was priceless!",
    time: new Date(Date.now() - 120000),
    type: "user",
    role: "user",
  },
]);

// Obsługa wysyłania wiadomości
const handleSendMessage = ({ text, time }) => {
  chatMessages.value.push({
    user: "CurrentUser", // To powinno być zastąpione rzeczywistą nazwą użytkownika
    text: text,
    time: time,
    type: "user",
    role: "user",
  });

  // Tu powinno być wysłanie wiadomości do serwera WebSocket
};

// Obsługa akcji moderacyjnych
const handleMessageAction = ({ action, message, index }) => {
  switch (action) {
    case "delete":
      // Dodajemy informację systemową
      chatMessages.value.push({
        user: "System",
        text: `Wiadomość od ${message.user} została usunięta.`,
        time: new Date(),
        type: "system",
      });
      // Usuwamy wiadomość z listy
      chatMessages.value.splice(index, 1);
      break;
    case "timeout":
      chatMessages.value.push({
        user: "System",
        text: `Użytkownik ${message.user} otrzymał timeout na 10 minut.`,
        time: new Date(),
        type: "system",
      });
      break;
    case "ban":
      chatMessages.value.push({
        user: "System",
        text: `Użytkownik ${message.user} został zbanowany.`,
        time: new Date(),
        type: "system",
      });
      break;
  }

  // Tu powinno być wywołanie odpowiedniego API
};
</script>

<style lang="scss">
.stream-layout {
  min-height: 100vh;
  height: auto;
  background: #0a0a0a;

  @media (min-width: 1280px) {
    height: calc(100vh - 64px); // Account for app bar height
  }
}
.stream-info {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

// Mobile optimizations
// @media (max-width: 1279px) {
//   .stream-layout {
//     height: auto;
//     min-height: 100vh;
//   }

//   .h-100 {
//     height: auto !important;
//   }
// }
</style>
