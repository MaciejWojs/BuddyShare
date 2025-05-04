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
          <LazyStreamVideoPlayer :display-name="displayName" />
        </v-responsive>

        <!-- Vertical spacer -->
        <div class="my-6"></div>
        <!-- Stream info section -->
        <div class="stream-info pa-4 bg-grey-darken-3 rounded">
          <h1 class="text-h4 mb-2">{{ stream.title || "" }}</h1>
          <p class="text-body-1 mb-4">{{ stream.stream_description }}</p>

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
              <div class="text-caption">{{ stream.description }}</div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
              color="white"
              variant="outlined"
              size="small"
              prepend-icon="mdi-account"
              @click="navigateTo(`/user/${displayName}/profile`)"
            >
              Profil
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- Chat Column -->
      <v-col
        v-if="streamId"
        cols="12"
        lg="3"
        class="h-100 bg-grey-darken-4"
      >
        <LiveChat
          :stream-id="streamId"
          :messages="chatMessages"
          title="Live Chat"
          @message-action="handleMessageAction"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useStreamsStore } from "#imports";
import { ref, watch, onMounted, computed } from "vue";

const streamsStore = useStreamsStore();

const route = useRoute();
const displayName = route.params.displayname as string;


const stream = computed(() => {
  return (
    streamsStore.getStreamByStreamerName(displayName) || {
      title: "",
      stream_description: "",
      description: "",
      id: null,
    }
  );
});

const streamId = computed(() => stream.value?.id);

// const streamOptionsId = computed(() => stream.value?.options_id);

// const pWS = usePublicWebSocket();

onMounted(async () => {
  await streamsStore.fetchStreams();
  // pWS.joinStream(streamOptionsId.value?.toString());
  // pWS.onStreamStatsBasic((data) => {
  //   console.log("Stream stats data:", data);
  // });
});

definePageMeta({
  middleware: [
    "user-exists",
    "is-banned",
    "test-middleware",
    "is-moderator",
    "is-streamer-and-streaming",
  ],
});

const streamerAndStreamingStatus = useState<Boolean>(
  "streamerAndStreamingStatus",
  () => false
);

if (!streamId.value) {
  // Handle case where streamId is not found
  console.error("Stream ID not found for display name:", displayName);
}

// Chat functionality
const chatMessages = ref([
  {
    username: "System",
    text: "Welcome to the stream! Please follow our community guidelines.",
    time: new Date(Date.now() - 3600000),
    type: "system",
  },
  {
    username: "StreamerFan42",
    text: "Hey everyone! Excited for today's stream.",
    time: new Date(Date.now() - 2400000),
    type: "user",
    role: "user",
    avatar: "/Buddyshare.svg",
  },
  {
    username: "GamingGuru",
    text: "The quality looks great today!",
    time: new Date(Date.now() - 1800000),
    type: "user",
    role: "user",
  },
  {
    username: "System",
    text: "StreamerFan42 subscribed for 3 months!",
    time: new Date(Date.now() - 1200000),
    type: "system",
  },
  {
    username: "TechWizard",
    text: "What settings are you using? Everything looks so smooth",
    time: new Date(Date.now() - 900000),
    type: "user",
    role: "user",
  },
  {
    username: "ModeratorUser",
    text: "Remember everyone to follow the chat rules!",
    time: new Date(Date.now() - 700000),
    type: "user",
    role: "moderator",
  },
  {
    username: "ChillVibes",
    text: "👋 Just joined, what did I miss?",
    time: new Date(Date.now() - 600000),
    type: "user",
    role: "user",
  },
  {
    username: "PixelPro",
    text: "This is exactly what I needed today",
    time: new Date(Date.now() - 300000),
    type: "user",
    role: "user",
  },
  {
    username: displayName,
    text: "Thanks for watching everyone!",
    time: new Date(Date.now() - 200000),
    type: "user",
    role: "broadcaster",
  },
  {
    username: "GameMaster99",
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
        username: "System",
        text: `Wiadomość od ${message.user} została usunięta.`,
        time: new Date(),
        type: "system",
      });
      // Usuwamy wiadomość z listy
      chatMessages.value.splice(index, 1);
      break;
    case "timeout":
      chatMessages.value.push({
        username: "System",
        text: `Użytkownik ${message.user} otrzymał timeout na 10 minut.`,
        time: new Date(),
        type: "system",
      });
      break;
    case "ban":
      chatMessages.value.push({
        username: "System",
        text: `Użytkownik ${message.user} został zbanowany.`,
        time: new Date(),
        type: "system",
      });
      break;
  }

  // Tu powinno być wywołanie odpowiedniego API
};
onBeforeUnmount(() => {
  console.log("Checking before - >", streamerAndStreamingStatus.value);
  streamerAndStreamingStatus.value = false;
  console.log("Checking after - >", streamerAndStreamingStatus.value);
});
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
