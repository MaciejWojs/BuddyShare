<!-- pages/user/[theirPage].vue -->
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
                  <v-img src="/Buddyshare.svg" />
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
                <v-chip
                  variant="outlined"
                  size="small"
                >
                  <v-icon
                    start
                    size="small"
                    >mdi-account</v-icon
                  >
                  12.8K
                </v-chip>
              </div>
            </v-card-title>

            <!-- Video Player -->
            <div class="video-wrapper flex-grow-1">
              <video
                controls
                autoplay
                muted
                class="video-player"
              >
                <source
                  src="https://example.com/stream.m3u8"
                  type="application/x-mpegURL"
                />
              </video>
            </div>

            <!-- Stream Controls -->
            <v-card-actions class="stream-controls pa-2 px-4 bg-grey-darken-3">
              <span class="text-caption text-medium-emphasis">22:02</span>
              <v-spacer />
              <div class="d-flex ga-1">
                <v-btn
                  variant="text"
                  color="white"
                  icon="mdi-share-variant"
                  size="small"
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
        </v-responsive>
      </v-col>

      <!-- Chat Column -->
      <v-col
        cols="12"
        lg="3"
        class="h-100 bg-grey-darken-4"
      >
        <v-card
          class="d-flex flex-column h-100"
          color="grey-darken-4"
          flat
        >
          <v-card-title class="chat-header py-2 px-4">
            <div class="d-flex align-center justify-space-between w-100">
              <span class="text-subtitle-1">Live Chat</span>
              <v-chip
                variant="tonal"
                color="primary"
                size="small"
              >
                128 Online
              </v-chip>
            </div>
          </v-card-title>

          <v-card-text class="chat-messages flex-grow-1 pa-2">
            <v-list
              lines="two"
              density="compact"
              class="bg-transparent"
            >
              <template
                v-for="(msg, index) in chatMessages"
                :key="index"
              >
                <v-list-item v-if="msg.user !== 'System'">
                  <template #prepend>
                    <v-avatar
                      size="32"
                      class="mr-2"
                    >
                      <v-img src="/Buddyshare.svg" />
                    </v-avatar>
                  </template>

                  <v-list-item-subtitle class="d-flex justify-space-between">
                    <span class="font-weight-medium">{{ msg.user }}</span>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatTime(msg.time) }}
                    </span>
                  </v-list-item-subtitle>
                  <v-list-item-title class="text-caption">
                    {{ msg.text }}
                  </v-list-item-title>
                </v-list-item>

                <v-list-item
                  v-else
                  class="justify-center text-center"
                >
                  <span class="text-caption text-medium-emphasis">
                    {{ msg.text }}
                  </span>
                </v-list-item>
              </template>
            </v-list>
          </v-card-text>

          <v-card-actions class="chat-input pa-2 px-4">
            <v-text-field
              v-model="newMessage"
              placeholder="Send a message..."
              variant="outlined"
              density="compact"
              hide-details
              rounded
              bg-color="grey-darken-3"
              class="mt-2"
              @keyup.enter="sendMessage"
            >
              <template #append-inner>
                <v-btn
                  icon="mdi-send"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="sendMessage"
                />
              </template>
            </v-text-field>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ["user-exists", "is-banned"],
});

const route = useRoute();
const displayName = route.params.displayname;
const isLive = ref(true);

// Chat functionality
const chatMessages = ref([
  {
    user: "System",
    text: "Welcome to the stream! Please follow our community guidelines.",
    time: new Date(Date.now() - 3600000),
  },
  {
    user: "StreamerFan42",
    text: "Hey everyone! Excited for today's stream.",
    time: new Date(Date.now() - 2400000),
  },
  {
    user: "GamingGuru",
    text: "The quality looks great today!",
    time: new Date(Date.now() - 1800000),
  },
  {
    user: "System",
    text: "StreamerFan42 subscribed for 3 months!",
    time: new Date(Date.now() - 1200000),
  },
  {
    user: "TechWizard",
    text: "What settings are you using? Everything looks so smooth",
    time: new Date(Date.now() - 900000),
  },
  {
    user: "ChillVibes",
    text: "👋 Just joined, what did I miss?",
    time: new Date(Date.now() - 600000),
  },
  {
    user: "PixelPro",
    text: "This is exactly what I needed today",
    time: new Date(Date.now() - 300000),
  },
  {
    user: "GameMaster99",
    text: "LOL that reaction was priceless!",
    time: new Date(Date.now() - 120000),
  },
]); // Keep same data
const newMessage = ref("");

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const sendMessage = () => {
  if (newMessage.value.trim()) {
    chatMessages.value.push({
      user: "User",
      text: newMessage.value.trim(),
      time: new Date(),
    });
    newMessage.value = "";
  }
};
</script>

<style lang="scss" scoped>
.stream-layout {
  height: 100vh;
  background: #0a0a0a;
}

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

.chat-messages {
  overflow-y: auto;
  scrollbar-width: thin;
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
