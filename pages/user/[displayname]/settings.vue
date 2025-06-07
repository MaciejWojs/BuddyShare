<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";

// Define middleware - requires logged in user
definePageMeta({
  middleware: ["is-logged-in", "is-banned"],
});

// User state and data
const userSettings = ref({
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    mentionAlerts: true,
    newFollowerAlerts: true,
    streamStartAlerts: true,
  },
  privacy: {
    profileVisibility: "public",
    showOnlineStatus: true,
    allowDirectMessages: "followers",
    allowComments: true,
  },
  stream: {
    autoRecord: true,
    lowLatencyMode: false,
    chatModeration: "moderate",
    allowClips: true,
  },
  appearance: {
    darkMode: true,
    highContrast: false,
    fontSize: "medium",
  },
  streamKey: "", // Przechowywanie klucza streamu
});

// Dodaj store dla autentykacji
const authStore = useAuthStore();
const username = computed(() => authStore.userName); // Użyj computed dla reaktywności

// API instance
const api = useApi();

// Streamer status state
const isStreamer = ref<boolean | null>(null); // null: unknown, true: is streamer, false: not streamer
const isLoadingStreamerStatus = ref(true);
const streamerStatusError = ref<string | null>(null);

// Become streamer state
const isBecomingStreamer = ref(false);
const becomeStreamerError = ref<string | null>(null);

// Stream token state
const isFetchingToken = ref(false);
const tokenError = ref<string | null>(null); // Zmieniono na string dla komunikatów błędów

// Stan dla resetowania klucza
const isResetting = ref(false);
const resetError = ref<string | null>(null); // Zmieniono na string dla komunikatów błędów

// Dodaj nowe refy
const confirmResetDialog = ref(false);
const showStreamKey = ref(false);

const config = useRuntimeConfig();

const headers = useRequestHeaders(["cookie"]);

const BACK_HOST = config.public.BACK_HOST;

const endpoint = `http://${BACK_HOST}`;

// Route and user info
const route = useRoute();

// Settings categories
const settingsCategories = ref([
  {
    id: "notifications",
    title: "Notifications",
    icon: "mdi-bell-outline",
    description: "Manage notification settings",
  },
  {
    id: "privacy",
    title: "Privacy and Safety",
    icon: "mdi-shield-outline",
    description: "Control your privacy and safety",
  },
  {
    id: "stream",
    title: "Stream Settings",
    icon: "mdi-video-outline",
    description: "Customize your streaming configuration",
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: "mdi-palette-outline",
    description: "Customize the app appearance",
  },
]);

// Active category
const activeCategory = ref("notifications");

// Fake API call to fetch settings
const {
  data: fetchedSettings,
  pending,
  error,
} = useAsyncData("userSettings", async () => {
  // Simulating API delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return userSettings.value;
});

// Options for selects
const visibilityOptions = [
  { title: "Public", value: "public" },
  { title: "Followers only", value: "followers" },
  { title: "Private", value: "private" },
];

const messagePermissionOptions = [
  { title: "Everyone", value: "all" },
  { title: "Following only", value: "following" },
  { title: "Followers only", value: "followers" },
  { title: "No one", value: "none" },
];

const moderationOptions = [
  { title: "Disabled", value: "disabled" },
  { title: "Basic", value: "basic" },
  { title: "Moderate", value: "moderate" },
  { title: "Strict", value: "strict" },
];

const fontSizeOptions = [
  { title: "Small", value: "small" },
  { title: "Medium", value: "medium" },
  { title: "Large", value: "large" },
];

// Save handling - demonstration function
const handleSuccess = (data: any) => {
  console.log("Setting saved:", data);
};

const handleError = (data: any) => {
  console.error("Error saving setting:", data);
};

// Function to change category
const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId;
};

// Stream key dialog state
const streamKeyDialog = ref(false);
const copySuccess = ref(false);

// Pobierz początkowy klucz i status streamera przy mountowaniu komponentu
onMounted(async () => {
  await checkStreamerStatus();
  // Pozostałe dane (fetchedSettings) są ładowane przez useAsyncData
});

// Dodaj funkcję do potwierdzenia resetu
const promptReset = () => {
  confirmResetDialog.value = true;
};

// Funkcja do resetowania klucza
const resetStreamKey = async () => {
  if (!username.value) return;
  confirmResetDialog.value = false;
  isResetting.value = true;
  resetError.value = null;
  try {
    const { data, error } = await api.streamers.updateToken(username.value);
    if (error.value) throw error.value;
    if (data.value?.token) {
      userSettings.value.streamKey = data.value.token;
      streamKeyDialog.value = true;
    } else {
      throw new Error("New token not received after reset.");
    }
  } catch (err: any) {
    console.error("Error resetting stream key:", err);
    resetError.value = err.data?.message || err.message || "Failed to generate new key.";
  } finally {
    isResetting.value = false;
  }
};

// Dodaj funkcję toggle visibility
const toggleKeyVisibility = () => {
  showStreamKey.value = !showStreamKey.value;
};

// Dodaj computed property dla maskowania klucza
const maskedStreamKey = computed(() => {
  if (!userSettings.value.streamKey) return "";
  return showStreamKey.value
    ? userSettings.value.streamKey
    : userSettings.value.streamKey.replace(/./g, "•");
});

// Function to copy key to clipboard
const copyStreamKey = () => {
  navigator.clipboard
    .writeText(userSettings.value.streamKey)
    .then(() => {
      copySuccess.value = true;
      setTimeout(() => {
        copySuccess.value = false;
      }, 3000);
    })
    .catch((err) => {
      console.error("Failed to copy the key: ", err);
    });
};

// Check if current user is a streamer
const checkStreamerStatus = async () => {
  if (!username.value) {
    isLoadingStreamerStatus.value = false;
    isStreamer.value = false;
    return;
  }
  isLoadingStreamerStatus.value = true;
  streamerStatusError.value = null;
  try {
    const isUserStreamer = await api.streamers.isStreamer(username.value);
    isStreamer.value = isUserStreamer;
    if (isUserStreamer) {
      await fetchStreamKey();
    }
  } catch (err: any) {
    console.error("Error checking streamer status:", err);
    streamerStatusError.value = err.data?.message || err.message || "Failed to check streamer status.";
    isStreamer.value = false;
  } finally {
    isLoadingStreamerStatus.value = false;
  }
};

const fetchStreamKey = async () => {
  if (!username.value) return;
  isFetchingToken.value = true;
  tokenError.value = null;
  try {
    const { data, error } = await api.streamers.getToken(username.value);
    if (error.value) throw error.value;
    if (data.value?.token) {
      userSettings.value.streamKey = data.value.token;
    } else {
      userSettings.value.streamKey = ""; // Wyczyść, jeśli brak tokenu
      console.warn("Stream key not found.");
    }
  } catch (err: any) {
    console.error("Error fetching stream key:", err);
    tokenError.value = err.data?.message || err.message || "Failed to fetch stream key.";
    userSettings.value.streamKey = ""; // Wyczyść w przypadku błędu
  } finally {
    isFetchingToken.value = false;
  }
};

// Function to become a streamer
const handleBecomeStreamer = async () => {
  if (!username.value) return;
  isBecomingStreamer.value = true;
  becomeStreamerError.value = null;
  try {
    const { error } = await api.users.becomeStreamer(username.value);
    if (error.value) throw error.value;
    isStreamer.value = true;
    await fetchStreamKey();
    if (userSettings.value.streamKey) {
      streamKeyDialog.value = true; // Pokaż dialog z nowym kluczem
    }
  } catch (err: any) {
    console.error("Error becoming streamer:", err);
    becomeStreamerError.value = err.data?.message || err.message || "Failed to become a streamer.";
  } finally {
    isBecomingStreamer.value = false;
  }
};
</script>

<template>
  <v-container
    fluid
    class="settings-layout pa-0"
  >
    <v-row no-gutters>
      <!-- Sidebar with categories -->
      <v-col
        cols="12"
        md="3"
        lg="2"
        class="settings-sidebar"
      >
        <v-card
          flat
          color="grey-darken-4"
          class="h-100"
        >
          <v-list bg-color="transparent">
            <v-list-item>
              <v-list-item-title class="text-h6">Settings</v-list-item-title>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list-item
              v-for="category in settingsCategories"
              :key="category.id"
              :value="category.id"
              :active="activeCategory === category.id"
              @click="setActiveCategory(category.id)"
              :prepend-icon="category.icon"
              :title="category.title"
              :subtitle="category.description"
              variant="flat"
              color="primary"
              class="mb-1"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Main settings content -->
      <v-col
        cols="12"
        md="9"
        lg="10"
        class="settings-content"
      >
        <v-container>
          <v-row>
            <v-col
              cols="12"
              lg="8"
              xl="7"
            >
              <!-- Loader while fetching data -->
              <v-skeleton-loader
                v-if="pending"
                type="card, card, card, card"
                class="mt-2"
              ></v-skeleton-loader>

              <!-- Settings fetch error -->
              <v-alert
                v-else-if="error"
                type="error"
                class="mt-2"
                title="An error occurred"
                text="Failed to load settings. Try refreshing the page."
              ></v-alert>

              <!-- Category content: Notifications -->
              <template v-else-if="activeCategory === 'notifications'">
                <h2 class="text-h5 mb-4">Notifications</h2>

                <SettingItem
                  title="Email notifications"
                  description="Receive notifications to your email address"
                  icon="mdi-email-outline"
                  v-model="userSettings.notifications.emailNotifications"
                  setting-id="notifications.emailNotifications"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Push notifications"
                  description="Receive push notifications in your browser"
                  icon="mdi-bell-ring-outline"
                  v-model="userSettings.notifications.pushNotifications"
                  setting-id="notifications.pushNotifications"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Mention alerts"
                  description="Receive notifications when someone mentions you"
                  icon="mdi-at"
                  v-model="userSettings.notifications.mentionAlerts"
                  setting-id="notifications.mentionAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="New followers"
                  description="Notifications about new followers"
                  icon="mdi-account-plus-outline"
                  v-model="userSettings.notifications.newFollowerAlerts"
                  setting-id="notifications.newFollowerAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Stream start"
                  description="Notifications when followed streamers go live"
                  icon="mdi-video-outline"
                  v-model="userSettings.notifications.streamStartAlerts"
                  setting-id="notifications.streamStartAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />
              </template>

              <!-- Category content: Privacy -->
              <template v-else-if="activeCategory === 'privacy'">
                <h2 class="text-h5 mb-4">Privacy and Safety</h2>

                <SettingItem
                  title="Profile visibility"
                  description="Control who can see your profile"
                  icon="mdi-eye-outline"
                  type="select"
                  v-model="userSettings.privacy.profileVisibility"
                  :options="visibilityOptions"
                  setting-id="privacy.profileVisibility"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Online status"
                  description="Show when you are online"
                  icon="mdi-access-point"
                  v-model="userSettings.privacy.showOnlineStatus"
                  setting-id="privacy.showOnlineStatus"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Direct messages"
                  description="Who can send you private messages"
                  icon="mdi-message-outline"
                  type="select"
                  v-model="userSettings.privacy.allowDirectMessages"
                  :options="messagePermissionOptions"
                  setting-id="privacy.allowDirectMessages"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Comments"
                  description="Allow comments on your profile"
                  icon="mdi-comment-outline"
                  v-model="userSettings.privacy.allowComments"
                  setting-id="privacy.allowComments"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />
              </template>

              <!-- Category content: Stream -->
              <template v-else-if="activeCategory === 'stream'">
                <h2 class="text-h5 mb-4">Stream Settings</h2>

                <!-- Loader for streamer status check -->
                <v-skeleton-loader
                  v-if="isLoadingStreamerStatus"
                  type="list-item-two-line, button"
                  class="mb-4"
                ></v-skeleton-loader>

                <!-- Error checking streamer status -->
                <v-alert
                  v-else-if="streamerStatusError"
                  type="error"
                  class="mb-4"
                  title="Error"
                  :text="streamerStatusError"
                  variant="tonal"
                ></v-alert>

                <!-- Become Streamer Section -->
                <template v-else-if="isStreamer === false">
                  <v-card
                    variant="outlined"
                    class="pa-3 mb-6"
                  >
                    <v-card-title class="text-h6">Become a Streamer</v-card-title>
                    <v-card-text class="pb-2">
                      Start sharing your content with the world. Becoming a streamer will generate a unique stream key for you to use with your streaming software.
                    </v-card-text>
                    <v-card-actions class="px-4 pb-3">
                      <v-btn
                        color="primary"
                        @click="handleBecomeStreamer"
                        :loading="isBecomingStreamer"
                        block
                        size="large"
                        variant="flat"
                      >
                        <v-icon
                          start
                          icon="mdi-video-plus-outline"
                        ></v-icon>
                        Become a Streamer
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                  <v-alert
                    v-if="becomeStreamerError"
                    type="error"
                    class="mb-4"
                    title="Could not become streamer"
                    :text="becomeStreamerError"
                    variant="tonal"
                  ></v-alert>
                </template>

                <!-- Stream Key Management (if user is a streamer) -->
                <template v-else-if="isStreamer === true">
                  <!-- Dialog potwierdzenia resetowania klucza -->
                  <v-dialog
                    v-model="confirmResetDialog"
                    max-width="400"
                    persistent
                  >
                    <v-card>
                      <v-card-title class="text-h5">Confirm Reset</v-card-title>
                      <v-card-text>
                        Are you sure you want to generate a new stream key? The
                        old key will become invalid immediately.
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                          text
                          @click="confirmResetDialog = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          color="error"
                          @click="resetStreamKey"
                          :loading="isResetting"
                          variant="tonal"
                        >
                          Confirm
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>

                  <!-- Alert dla błędów resetowania klucza -->
                  <v-alert
                    v-if="resetError"
                    type="error"
                    class="mb-4"
                    title="Reset Error"
                    :text="resetError"
                    variant="tonal"
                    closable
                  />
                  
                  <!-- Alert dla błędów pobierania klucza -->
                  <v-alert
                    v-if="tokenError && !userSettings.streamKey && !isFetchingToken"
                    type="error"
                    class="mb-4"
                    title="Stream Key Error"
                    :text="tokenError"
                    variant="tonal"
                    closable
                  ></v-alert>
                  
                  <v-card
                    class="mb-4 pa-0"
                    flat
                    border
                  >
                    <v-list-item lines="two">
                       <template v-slot:prepend>
                        <v-icon
                          class="ml-1 mr-3"
                          size="large"
                        >mdi-key-variant</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium">Stream Key</v-list-item-title>
                      <v-list-item-subtitle>Your unique key for streaming software.</v-list-item-subtitle>

                      <template v-slot:append>
                        <div class="d-flex align-center py-2">
                          <v-progress-circular
                            v-if="isFetchingToken"
                            indeterminate
                            size="24"
                            width="2"
                            class="mr-4"
                          ></v-progress-circular>
                          <template v-else>
                            <v-btn
                              v-if="userSettings.streamKey"
                              @click="streamKeyDialog = true"
                              color="primary"
                              variant="tonal"
                              size="small"
                              class="mr-2"
                            >
                              Show Key
                            </v-btn>
                            <v-btn
                              v-else-if="!tokenError"
                              @click="fetchStreamKey"
                              color="primary"
                              variant="tonal"
                              size="small"
                              class="mr-2"
                              :loading="isFetchingToken"
                            >
                              Get Key
                            </v-btn>
                            <v-btn
                              v-if="userSettings.streamKey"
                              @click="promptReset"
                              color="error"
                              variant="outlined"
                              size="small"
                              :loading="isResetting"
                            >
                              Reset Key
                            </v-btn>
                          </template>
                        </div>
                      </template>
                    </v-list-item>
                  </v-card>
                  
                  <SettingItem
                    title="Auto-record"
                    description="Automatically record your streams"
                    icon="mdi-record-circle-outline"
                    v-model="userSettings.stream.autoRecord"
                    setting-id="stream.autoRecord"
                    @save:success="handleSuccess"
                    @save:error="handleError"
                  />

                  <SettingItem
                    title="Low latency mode"
                    description="Reduce stream delay at the cost of quality"
                    icon="mdi-clock-fast"
                    v-model="userSettings.stream.lowLatencyMode"
                    setting-id="stream.lowLatencyMode"
                    @save:success="handleSuccess"
                    @save:error="handleError"
                  />

                  <SettingItem
                    title="Chat moderation"
                    description="Level of automatic chat moderation"
                    icon="mdi-message-alert-outline"
                    type="select"
                    v-model="userSettings.stream.chatModeration"
                    :options="moderationOptions"
                    setting-id="stream.chatModeration"
                    @save:success="handleSuccess"
                    @save:error="handleError"
                  />

                  <SettingItem
                    title="Clips"
                    description="Allow viewers to create clips from your stream"
                    icon="mdi-content-cut"
                    v-model="userSettings.stream.allowClips"
                    setting-id="stream.allowClips"
                    @save:success="handleSuccess"
                    @save:error="handleError"
                  />

                  <!-- Stream key dialog -->
                  <v-dialog
                    v-model="streamKeyDialog"
                    max-width="500"
                    persistent
                  >
                    <v-card>
                      <v-card-title
                        class="d-flex justify-space-between align-center"
                      >
                        <span class="text-h5">Your stream key</span>
                        <v-btn
                          icon="mdi-close"
                          variant="text"
                          density="comfortable"
                          @click="streamKeyDialog = false"
                        ></v-btn>
                      </v-card-title>

                      <v-card-text>
                        <p class="text-body-2 mb-4">
                          This key is private and allows you to start streaming.
                          Do not share it with anyone.
                        </p>

                        <v-card
                          color="grey-darken-3"
                          class="stream-key-container pa-3 mb-4"
                          variant="outlined"
                        >
                          <div class="d-flex align-center">
                            <code
                              class="stream-key text-body-2 font-weight-medium flex-grow-1"
                              >{{ maskedStreamKey }}</code
                            >

                            <v-btn
                              :icon="showStreamKey ? 'mdi-eye-off' : 'mdi-eye'"
                              variant="text"
                              density="comfortable"
                              @click="toggleKeyVisibility"
                              class="ml-2"
                              :title="showStreamKey ? 'Hide key' : 'Show key'"
                            ></v-btn>

                            <v-btn
                              :icon="
                                copySuccess ? 'mdi-check' : 'mdi-content-copy'
                              "
                              :color="copySuccess ? 'success' : undefined"
                              variant="text"
                              density="comfortable"
                              @click="copyStreamKey"
                              class="ml-2"
                              :title="
                                copySuccess ? 'Copied!' : 'Copy to clipboard'
                              "
                            ></v-btn>
                          </div>
                        </v-card>

                        <v-slide-y-transition>
                          <v-alert
                            v-if="copySuccess"
                            type="success"
                            variant="tonal"
                            class="mb-4"
                            icon="mdi-check-circle"
                            density="compact"
                            closable
                          >
                            Key has been copied to clipboard!
                          </v-alert>
                        </v-slide-y-transition>

                        <v-alert
                          type="info"
                          variant="tonal"
                          density="compact"
                          icon="mdi-information-outline"
                        >
                          <strong>How to use:</strong> Paste this key in your
                          streaming application settings (e.g. OBS Studio,
                          Streamlabs).
                        </v-alert>
                      </v-card-text>

                      <v-divider></v-divider>

                      <v-card-actions class="pa-3">
                        <v-btn
                          color="error"
                          variant="tonal"
                          prepend-icon="mdi-refresh"
                          @click="promptReset"
                          :loading="isResetting"
                        >
                          Reset key
                        </v-btn>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="primary"
                          variant="flat"
                          @click="streamKeyDialog = false"
                        >
                          Close
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </template>
              </template>

              <!-- Category content: Appearance -->
              <template v-else-if="activeCategory === 'appearance'">
                <h2 class="text-h5 mb-4">Appearance</h2>

                <SettingItem
                  title="Dark mode"
                  description="Use dark theme interface"
                  icon="mdi-theme-light-dark"
                  v-model="userSettings.appearance.darkMode"
                  setting-id="appearance.darkMode"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="High contrast"
                  description="Increase contrast of interface elements"
                  icon="mdi-contrast-box"
                  v-model="userSettings.appearance.highContrast"
                  setting-id="appearance.highContrast"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Font size"
                  description="Choose preferred text size"
                  icon="mdi-format-size"
                  type="select"
                  v-model="userSettings.appearance.fontSize"
                  :options="fontSizeOptions"
                  setting-id="appearance.fontSize"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />
              </template>
            </v-col>
          </v-row>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.settings-layout {
  min-height: 100vh;
  background: #0a0a0a;
}

.settings-sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 100vh;
}

.settings-content {
  padding-top: 2rem;
}

// Mobile optimizations
@media (max-width: 960px) {
  .settings-sidebar {
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.stream-key-container {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);

  .stream-key {
    font-family: monospace;
    letter-spacing: 1px;
    overflow-x: auto;
    white-space: nowrap;
    padding: 8px 0;
    user-select: all;
  }
}
</style>
