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
            stream-url="https://example.com/stream.m3u8"
            avatar="/Buddyshare.svg"
            current-time="22:02"
          />
        </v-responsive>
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
import { ref } from "vue";

definePageMeta({
  middleware: ["user-exists", "is-banned", "test-middleware", "is-moderator"],
});

const route = useRoute();
const displayName = route.params.displayname;
const isLive = ref(true);
const onlineCount = ref("128");

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
