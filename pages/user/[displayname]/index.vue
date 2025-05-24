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
          <!-- Sekcja z tytułem i przyciskiem - skeleton lub dane -->
          <div class="d-flex align-center mb-2">
            <template v-if="!isLoading">
              <h1 class="text-h4 mb-0">{{ stream.title || "" }}</h1>
            </template>
            <template v-else>
              <div
                class="skeleton-text skeleton-bg"
                style="width: 70%; height: 38px"
              ></div>
            </template>

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
                    v-if="
                      authStore.userName === displayName &&
                      streamStore.isStreamOwner()
                    "
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

          <!-- Opis streamu - skeleton lub dane -->
          <template v-if="!isLoading">
            <p class="text-body-1 mb-4">{{ stream.stream_description }}</p>
          </template>
          <template v-else>
            <div
              class="skeleton-text skeleton-bg mb-2"
              style="width: 95%; height: 18px"
            ></div>
            <div
              class="skeleton-text skeleton-bg mb-2"
              style="width: 88%; height: 18px"
            ></div>
            <div
              class="skeleton-text skeleton-bg mb-4"
              style="width: 65%; height: 18px"
            ></div>
          </template>

          <v-divider class="mb-3"></v-divider>

          <!-- Informacje o streamerze - skeleton lub dane -->
          <div class="d-flex align-center">
            <template v-if="!isLoading">
              <v-avatar
                class="mr-3"
                size="42"
              >
                <v-img
                  :src="avatarUrl || '/Buddyshare.svg'"
                  alt="Streamer avatar"
                />
              </v-avatar>
              <div>
                <span class="text-h6">{{ displayName }}</span>
                <div class="text-caption">{{ stream.description }}</div>
              </div>
            </template>
            <template v-else>
              <v-avatar
                class="mr-3 skeleton-bg"
                size="42"
              ></v-avatar>
              <div>
                <div
                  class="skeleton-text skeleton-bg mb-1"
                  style="width: 120px; height: 24px"
                ></div>
                <div
                  class="skeleton-text skeleton-bg"
                  style="width: 180px; height: 16px"
                ></div>
              </div>
            </template>

            <v-spacer></v-spacer>

            <!-- Przycisk profilu - pokazujemy nawet w trybie ładowania -->
            <v-btn
              color="white"
              variant="outlined"
              prepend-icon="mdi-account"
              @click="navigateTo(`/user/${displayName}/profile`)"
              class="profile-button-styled font-weight-bold"
              rounded="pill"
              :disabled="isLoading"
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
        <LazyLiveChat
          :stream-id="streamID"
          title="Live Chat"
          @message-action="handleMessageAction"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { LazyLiveChat } from "#components";
import { ChatAction } from "~/types/ChatAction";
import { ref, onMounted } from "vue"; // Dodano import ref i onMounted

const streamsStore = useStreamsStore();
const route = useRoute();
const api = useApi(); // api już jest zdefiniowane

const displayName = route.params.displayname as string;
const streamStore = useStreamsStore();
const ws = usePublicWebSocket();
const authStore = useAuthStore();
const authWS = useAuthWebSocket();

// Stan ładowania danych
const isLoading = ref(true);
const avatarUrl = ref<string | null>(null); // Dodano ref dla URL awatara

onMounted(async () => {
  // Fetch stream data when the component is mounted
  // await streamsStore.fetchStreams(); // Zakomentowane, jeśli nie jest już potrzebne
  if (displayName) {
    try {
      const url = await api.users.getUserAvatar(displayName);
      avatarUrl.value = url;
    } catch (error) {
      console.error("Nie udało się załadować awatara:", error);
      avatarUrl.value = "/Buddyshare.svg"; // Fallback na domyślny awatar w przypadku błędu
    }
  }
});

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

// Aktualizacja stanu ładowania po pobraniu streamu
watch(
  () => stream.value,
  (newValue) => {
    if (newValue && newValue.title) {
      // Dodajemy małe opóźnienie dla płynniejszego przejścia
      setTimeout(() => {
        isLoading.value = false;
      }, 500);
    }
  },
  { immediate: true }
);

definePageMeta({
  middleware: [
    "user-exists",
    "is-banned",
    // "test-middleware",
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

onBeforeUnmount(() => {
  console.log("Checking before - >", streamerAndStreamingStatus.value);
  streamerAndStreamingStatus.value = false;
  if (streamID.value) {
    ws.leaveStream(String(streamID.value));
  }
  console.log("Checking after - >", streamerAndStreamingStatus.value);
});

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

// Funkcja obsługi akcji wiadomości z czatu
const handleMessageAction = ({ action, message, index, moderator }) => {
  if (!authStore.currentUser) {
    console.error("Brak zalogowanego użytkownika.");
    return;
  }

  console.log(`Message action: ${action}`, message, index, moderator);
  switch (action) {
    case ChatAction.DELETE:
      // Emitowanie zdarzenia do backendu przez WebSocket
      if (message && message.chatMessageId) {
        authWS.patchChatMessage(message, action);
      }
      // Przykład lokalnego usuwania z listy (jeśli masz dostęp do listy wiadomości):
      // if (typeof index === 'number' && index > -1 && messages.value) {
      //   messages.value.splice(index, 1);
      // }
      break;
    case ChatAction.TIMEOUT:
      // Przykład: ws.emit("timeoutUser", { userId: message.userId })
      break;
    case ChatAction.BAN:
      if (message && message.chatMessageId) {
        const options = {
          bannedBy: authStore.currentUser?.userId,
        };
        authWS.banUserInChat(message, action, options);
      }
      // Przykład: ws.emit("banUser", { userId: message.userId })
      break;
    default:
      console.log("Unknown action");
      break;
  }
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

.profile-button-styled {
  border-width: 2px !important;
  height: 40px !important;
  min-width: 100px;
  /* Można dostosować lub usunąć dla automatycznej szerokości */
  padding-left: 18px !important;
  /* Dostosowany padding dla ikony i tekstu */
  padding-right: 18px !important;
  font-size: 14px !important;
  text-transform: none !important;
  /* Usuwa domyślne wielkie litery Vuetify */
  letter-spacing: normal !important;
  /* Przywraca normalne odstępy między literami */
  transition: all 0.3s ease;
  /* Dodajemy transition dla płynnego efektu */

  .v-btn__prepend .v-icon {
    margin-inline-end: 6px;
    /* Zmniejsza margines ikony */
  }

  &:hover {
    background-color: #7d5bbe !important;
    border-color: #7d5bbe !important;
    color: white !important;
    transform: translateY(-1px);
    /* Efekt uniesienia */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    /* Opcjonalny cień */
  }

  &:active {
    transform: translateY(1px);
    /* Efekt wciśnięcia */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    /* Opcjonalny cień */
  }
}

/* Style dla skeleton loadera */
.skeleton-bg {
  position: relative;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.1) !important;

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.2) 60%,
      rgba(255, 255, 255, 0)
    );
    animation: shimmer 1.5s infinite;
    content: "";
  }
}

.skeleton-text {
  border-radius: 4px;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
