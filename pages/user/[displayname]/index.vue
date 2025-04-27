<!-- pages/[displayname]/index.vue -->
<template>
  <v-container fluid class="stream-layout pa-0 fill-height">
    <v-row no-gutters class="fill-height">
      <!-- Main Content Column -->
      <v-col cols="12" lg="9" class="h-100">
        <v-responsive :aspect-ratio="16 / 9" class="h-100">
          <!-- Poprawione przekazywanie jakości do VideoPlayer -->
          <LazyVideoPlayer :display-name="displayName" />
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
      <v-col cols="12" lg="3" class="h-100 bg-grey-darken-4">
        <LiveChat :stream-id="streamId" :messages="chatMessages" :online-count="onlineCount" title="Live Chat"
          @send-message="handleSendMessage" @message-action="handleMessageAction" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useStreamsStore } from "#imports";
import { ref, watch, onMounted, computed } from "vue";

const streamsStore = useStreamsStore()

const streamId = computed(() => 
  streamsStore.streams.find((stream) => stream.username === displayName)?.id
)

const streamTitle = ref("");
const streamDescription = ref("");
const streamerDescription = ref("");

watch(streamId, (newStreamId) => {
  if (newStreamId) {
    const stream = streamsStore.streams.find((stream) => stream.id === newStreamId);
    if (stream) {
      streamTitle.value = stream.title || "Untitled Stream";
      streamDescription.value = stream.description || "No description available.";
      streamerDescription.value = stream.user?.description || "No description available.";
    }
  }
});


definePageMeta({
  middleware: ["user-exists", "is-banned", "test-middleware", "is-moderator"],
});

const route = useRoute();
const displayName = route.params.displayname as string;
// const publicWS = usePublicWebSocket();
// const streamStore = useStreamsStore();

if (!streamId.value) {
  // Handle case where streamId is not found
  console.error("Stream ID not found for display name:", displayName);
}

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
// }</style>
