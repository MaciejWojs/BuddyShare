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
          <div class="d-flex align-center mb-2">
            <h1 class="text-h4 mb-0">{{ stream.title || "" }}</h1>
            <v-spacer></v-spacer>
            <div class="d-flex flex-column">
              <!-- Dodajemy margin top do dialogu -->
              <v-dialog
                v-model="editDialog"
                max-width="600px"
                class="mt-6"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-if="streamStore.isStreamOwner()"
                    color="pink-darken-1"
                    variant="elevated"
                    prepend-icon="mdi-video"
                    v-bind="props"
                    class="text-uppercase font-weight-bold py-2"
                    block
                  >
                    GO LIVE
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title>Edytuj informacje o streamie</v-card-title>
                  <v-card-text>
                    <v-form @submit.prevent="updateStreamInfo">
                      <v-text-field
                        v-model="editedTitle"
                        label="Tytuł streamu"
                        variant="outlined"
                        class="mb-4"
                        required
                      ></v-text-field>
                      <v-textarea
                        v-model="editedDescription"
                        label="Opis streamu"
                        variant="outlined"
                        rows="4"
                        class="mb-4"
                        required
                      ></v-textarea>
                      <v-switch
                        v-model="isPublic"
                        label="Stream publiczny"
                        color="primary"
                      ></v-switch>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="error"
                      variant="text"
                      @click="editDialog = false"
                      >Anuluj</v-btn
                    >
                    <v-btn
                      color="primary"
                      @click="updateStreamInfo"
                      >Zapisz zmiany</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </div>
          </div>
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
            <!-- <SubscribeButton /> -->
            <!-- <UnsubscribeButton /> -->
            <v-btn
              color="white"
              variant="outlined"
              prepend-icon="mdi-account"
              @click="navigateTo(`/user/${displayName}/profile`)"
              class="profile-button-styled font-weight-bold"
              rounded="pill"
            >
              Profil
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- Chat Column -->
      <v-col
        v-if="streamID"
        cols="12"
        lg="3"
        class="h-100 bg-grey-darken-4"
      >
        <LiveChat
          :stream-id="streamID"
          :messages="chatMessages"
          title="Live Chat"
          @message-action="handleMessageAction"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const streamsStore = useStreamsStore();
const route = useRoute();
const api = useApi();

const displayName = route.params.displayname as string;
const streamStore = useStreamsStore();
const ws = usePublicWebSocket();

// onMounted(async() => {
//   // Fetch stream data when the component is mounted
//   await streamsStore.fetchStreams();
// });

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
const streamID = computed(
  () => streamStore.getStreamByStreamerName(displayName)?.options_id
);

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

if (!streamID.value) {
  // Handle case where streamID is not found
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
  if (streamID.value) {
    ws.leaveStream(String(streamID.value));
  }
  console.log("Checking after - >", streamerAndStreamingStatus.value);
});

// const {
//   data: streamPatchData,
//   status: streamPatchStatus,
//   error: streamPatchError,
// } = useFetch(`${endpoint}/streams/${displayName}/${streamId.value}`, {
//   method: "PATCH",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: {
//     title: stream.value.title || "Sample Stream Title",
//     description: stream.value.stream_description || "Sample Stream Description",
//     isPublic: true,
//     thumbnail: "null",
//   },
//   credentials: "include",
// });

const editDialog = ref(false);
const editedTitle = ref("");
const editedDescription = ref("");
const isPublic = ref(true);

// Inicjalizuj wartości po załadowaniu danych
watch(
  () => stream.value,
  (newValue) => {
    if (newValue) {
      editedTitle.value = newValue.title || "";
      editedDescription.value = newValue.stream_description || "";
    }
  },
  { immediate: true }
);



const updateStreamInfo = async () => {
  if (!editedTitle.value || !editedDescription.value) {
    console.error("Tytuł i opis są wymagane.");
    alert("Tytuł i opis są wymagane.");
    return;
  }

  const { error } = await api.streams.updateStream(
    displayName,
    streamID.value,
    {
      title: editedTitle.value,
      description: editedDescription.value,
      isPublic: isPublic.value,
      thumbnail: null,
    }
  );

  if (error.value) {
    console.error("Błąd aktualizacji:", error.value);
    return;
  }

  editDialog.value = false;
  const currentStream = streamsStore.getStreamByStreamerName(displayName);
  if (currentStream) {
    currentStream.title = editedTitle.value;
    currentStream.stream_description = editedDescription.value;
  }
  // streamsStore.fetchStreams();
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

.profile-button-styled {
  border-width: 2px !important;
  height: 40px !important;
  min-width: 100px; /* Można dostosować lub usunąć dla automatycznej szerokości */
  padding-left: 18px !important; /* Dostosowany padding dla ikony i tekstu */
  padding-right: 18px !important;
  font-size: 14px !important;
  text-transform: none !important; /* Usuwa domyślne wielkie litery Vuetify */
  letter-spacing: normal !important; /* Przywraca normalne odstępy między literami */
  transition: all 0.3s ease; /* Dodajemy transition dla płynnego efektu */

  .v-btn__prepend .v-icon {
    margin-inline-end: 6px; /* Zmniejsza margines ikony */
  }

  &:hover {
    background-color: #7d5bbe !important;
    border-color: #7d5bbe !important;
    color: white !important;
    transform: translateY(-1px); /* Efekt uniesienia */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Opcjonalny cień */
  }

  &:active {
    transform: translateY(1px); /* Efekt wciśnięcia */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); /* Opcjonalny cień */
  }
}
</style>
