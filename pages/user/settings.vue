<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";

// Definiujemy middleware - wymaga zalogowanego użytkownika
definePageMeta({
  middleware: ["is-logged-in", "is-banned"],
});

// Stan i dane użytkownika
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
  streamKey: "live_123456789abcdef_XYZ987654321", // Dodajemy przykładowy klucz transmisji
});

// Kategorie ustawień
const settingsCategories = ref([
  {
    id: "notifications",
    title: "Powiadomienia",
    icon: "mdi-bell-outline",
    description: "Zarządzaj ustawieniami powiadomień",
  },
  {
    id: "privacy",
    title: "Prywatność i bezpieczeństwo",
    icon: "mdi-shield-outline",
    description: "Kontroluj swoją prywatność i bezpieczeństwo",
  },
  {
    id: "stream",
    title: "Ustawienia transmisji",
    icon: "mdi-video-outline",
    description: "Dostosuj swoją konfigurację streamingową",
  },
  {
    id: "appearance",
    title: "Wygląd",
    icon: "mdi-palette-outline",
    description: "Dostosuj wygląd aplikacji",
  },
]);

// Aktywna kategoria
const activeCategory = ref("notifications");

// Fake API call do pobrania ustawień
const {
  data: fetchedSettings,
  pending,
  error,
} = useAsyncData("userSettings", async () => {
  // Symulacja opóźnienia API
  await new Promise((resolve) => setTimeout(resolve, 800));
  return userSettings.value;
});

// Opcje dla selectów
const visibilityOptions = [
  { title: "Publiczny", value: "public" },
  { title: "Tylko dla obserwujących", value: "followers" },
  { title: "Prywatny", value: "private" },
];

const messagePermissionOptions = [
  { title: "Wszyscy", value: "all" },
  { title: "Tylko obserwowani", value: "following" },
  { title: "Tylko obserwujący", value: "followers" },
  { title: "Nikt", value: "none" },
];

const moderationOptions = [
  { title: "Wyłączona", value: "disabled" },
  { title: "Podstawowa", value: "basic" },
  { title: "Umiarkowana", value: "moderate" },
  { title: "Ścisła", value: "strict" },
];

const fontSizeOptions = [
  { title: "Mały", value: "small" },
  { title: "Średni", value: "medium" },
  { title: "Duży", value: "large" },
];

// Obsługa zapisu - funkcja demonstracyjna
const handleSuccess = (data: any) => {
  console.log("Zapisano ustawienie:", data);
};

const handleError = (data: any) => {
  console.error("Błąd zapisu ustawienia:", data);
};

// Funkcja do zmiany kategorii
const setActiveCategory = (categoryId: string) => {
  activeCategory.value = categoryId;
};

// Stan dialogu z kluczem transmisji
const streamKeyDialog = ref(false);
const showStreamKey = ref(false);
const copySuccess = ref(false);

// Funkcja resetowania klucza transmisji
const resetStreamKey = () => {
  // Tu powinno być wywołanie API do generowania nowego klucza
  // Narazie tylko otwieramy dialog z przykładowym kluczem
  streamKeyDialog.value = true;
};

// Funkcja kopiowania klucza do schowka
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
      console.error("Nie udało się skopiować klucza: ", err);
    });
};

// Funkcja wyświetlania/ukrywania klucza
const toggleStreamKeyVisibility = () => {
  showStreamKey.value = !showStreamKey.value;
};

// Maskowanie klucza transmisji
const maskedStreamKey = computed(() => {
  if (!userSettings.value.streamKey) return "";
  return showStreamKey.value
    ? userSettings.value.streamKey
    : userSettings.value.streamKey.replace(/./g, "•");
});
</script>

<template>
  <v-container
    fluid
    class="settings-layout pa-0"
  >
    <v-row no-gutters>
      <!-- Sidebar z kategoriami -->
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
              <v-list-item-title class="text-h6">Ustawienia</v-list-item-title>
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

      <!-- Główna zawartość ustawień -->
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
              <!-- Loader podczas pobierania danych -->
              <v-skeleton-loader
                v-if="pending"
                type="card, card, card, card"
                class="mt-2"
              ></v-skeleton-loader>

              <!-- Błąd pobierania ustawień -->
              <v-alert
                v-else-if="error"
                type="error"
                class="mt-2"
                title="Wystąpił błąd"
                text="Nie udało się pobrać ustawień. Spróbuj odświeżyć stronę."
              ></v-alert>

              <!-- Zawartość kategorii: Powiadomienia -->
              <template v-else-if="activeCategory === 'notifications'">
                <h2 class="text-h5 mb-4">Powiadomienia</h2>

                <SettingItem
                  title="Powiadomienia e-mail"
                  description="Otrzymuj powiadomienia na swój adres e-mail"
                  icon="mdi-email-outline"
                  v-model="userSettings.notifications.emailNotifications"
                  setting-id="notifications.emailNotifications"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Powiadomienia push"
                  description="Otrzymuj powiadomienia push w przeglądarce"
                  icon="mdi-bell-ring-outline"
                  v-model="userSettings.notifications.pushNotifications"
                  setting-id="notifications.pushNotifications"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Alerty o wzmiankach"
                  description="Otrzymuj powiadomienia gdy ktoś wspomni o Tobie"
                  icon="mdi-at"
                  v-model="userSettings.notifications.mentionAlerts"
                  setting-id="notifications.mentionAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Nowi obserwujący"
                  description="Powiadomienia o nowych obserwujących"
                  icon="mdi-account-plus-outline"
                  v-model="userSettings.notifications.newFollowerAlerts"
                  setting-id="notifications.newFollowerAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Rozpoczęcie transmisji"
                  description="Powiadomienia gdy obserwowany streamer rozpocznie transmisję"
                  icon="mdi-video-outline"
                  v-model="userSettings.notifications.streamStartAlerts"
                  setting-id="notifications.streamStartAlerts"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />
              </template>

              <!-- Zawartość kategorii: Prywatność -->
              <template v-else-if="activeCategory === 'privacy'">
                <h2 class="text-h5 mb-4">Prywatność i bezpieczeństwo</h2>

                <SettingItem
                  title="Widoczność profilu"
                  description="Kontroluj kto może zobaczyć Twój profil"
                  icon="mdi-eye-outline"
                  type="select"
                  v-model="userSettings.privacy.profileVisibility"
                  :options="visibilityOptions"
                  setting-id="privacy.profileVisibility"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Status online"
                  description="Pokazuj kiedy jesteś online"
                  icon="mdi-access-point"
                  v-model="userSettings.privacy.showOnlineStatus"
                  setting-id="privacy.showOnlineStatus"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Wiadomości bezpośrednie"
                  description="Kto może wysyłać Ci wiadomości prywatne"
                  icon="mdi-message-outline"
                  type="select"
                  v-model="userSettings.privacy.allowDirectMessages"
                  :options="messagePermissionOptions"
                  setting-id="privacy.allowDirectMessages"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Komentarze"
                  description="Zezwalaj na komentarze na Twoim profilu"
                  icon="mdi-comment-outline"
                  v-model="userSettings.privacy.allowComments"
                  setting-id="privacy.allowComments"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />
              </template>

              <!-- Zawartość kategorii: Stream -->
              <template v-else-if="activeCategory === 'stream'">
                <h2 class="text-h5 mb-4">Ustawienia transmisji</h2>

                <SettingItem
                  title="Automatyczne nagrywanie"
                  description="Automatycznie nagrywaj transmisje"
                  icon="mdi-record-circle-outline"
                  v-model="userSettings.stream.autoRecord"
                  setting-id="stream.autoRecord"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Tryb niskiego opóźnienia"
                  description="Zmniejsz opóźnienie transmisji kosztem jakości"
                  icon="mdi-clock-fast"
                  v-model="userSettings.stream.lowLatencyMode"
                  setting-id="stream.lowLatencyMode"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Moderacja czatu"
                  description="Poziom automatycznej moderacji czatu"
                  icon="mdi-message-alert-outline"
                  type="select"
                  v-model="userSettings.stream.chatModeration"
                  :options="moderationOptions"
                  setting-id="stream.chatModeration"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Klipy"
                  description="Pozwól widzom tworzyć klipy z Twojej transmisji"
                  icon="mdi-content-cut"
                  v-model="userSettings.stream.allowClips"
                  setting-id="stream.allowClips"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Reset klucza transmisji"
                  description="Wygeneruj nowy klucz transmisji"
                  icon="mdi-key-variant"
                  type="button"
                  buttonText="Wygeneruj nowy klucz"
                  buttonColor="error"
                  buttonVariant="outlined"
                  setting-id="stream.resetStreamKey"
                  @click="resetStreamKey"
                />

                <!-- Dialog z kluczem transmisji -->
                <v-dialog
                  v-model="streamKeyDialog"
                  max-width="500"
                >
                  <v-card>
                    <v-card-title
                      class="d-flex justify-space-between align-center"
                    >
                      <span class="text-h5">Twój klucz transmisji</span>
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        density="comfortable"
                        @click="streamKeyDialog = false"
                      ></v-btn>
                    </v-card-title>

                    <v-card-text>
                      <p class="text-body-2 mb-4">
                        Ten klucz jest prywatny i pozwala na rozpoczęcie
                        transmisji. Nie udostępniaj go nikomu.
                      </p>

                      <v-card
                        color="grey-darken-3"
                        class="stream-key-container pa-3 mb-4"
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
                            @click="toggleStreamKeyVisibility"
                            class="ml-2"
                            :title="
                              showStreamKey ? 'Ukryj klucz' : 'Pokaż klucz'
                            "
                          ></v-btn>

                          <v-btn
                            :icon="
                              copySuccess ? 'mdi-check' : 'mdi-content-copy'
                            "
                            :color="copySuccess ? 'success' : 'default'"
                            variant="text"
                            density="comfortable"
                            @click="copyStreamKey"
                            class="ml-2"
                            :title="
                              copySuccess ? 'Skopiowano!' : 'Kopiuj do schowka'
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
                          closable
                        >
                          Klucz został skopiowany do schowka!
                        </v-alert>
                      </v-slide-y-transition>

                      <v-alert
                        type="info"
                        variant="tonal"
                        density="compact"
                        icon="mdi-information"
                      >
                        <strong>Jak używać:</strong> Wklej ten klucz w
                        ustawieniach swojej aplikacji do streamingu (np. OBS
                        Studio, Streamlabs).
                      </v-alert>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn
                        color="error"
                        variant="tonal"
                        prepend-icon="mdi-refresh"
                        @click="resetStreamKey"
                      >
                        Zresetuj klucz
                      </v-btn>
                      <v-btn
                        color="primary"
                        variant="flat"
                        @click="streamKeyDialog = false"
                      >
                        Zamknij
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </template>

              <!-- Zawartość kategorii: Wygląd -->
              <template v-else-if="activeCategory === 'appearance'">
                <h2 class="text-h5 mb-4">Wygląd</h2>

                <SettingItem
                  title="Tryb ciemny"
                  description="Używaj ciemnego motywu interfejsu"
                  icon="mdi-theme-light-dark"
                  v-model="userSettings.appearance.darkMode"
                  setting-id="appearance.darkMode"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Wysoki kontrast"
                  description="Zwiększ kontrast elementów interfejsu"
                  icon="mdi-contrast-box"
                  v-model="userSettings.appearance.highContrast"
                  setting-id="appearance.highContrast"
                  @save:success="handleSuccess"
                  @save:error="handleError"
                />

                <SettingItem
                  title="Rozmiar czcionki"
                  description="Wybierz preferowany rozmiar tekstu"
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
