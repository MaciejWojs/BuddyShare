<script lang="ts" setup>
import { ref, computed } from "vue";

definePageMeta({
  middleware: ["user-exists", "is-banned"],
});

const config = useRuntimeConfig();
const { media } = useApi();
const authStore = useAuthStore();

const BACK_HOST = config.public.BACK_HOST;

const route = useRoute();
const endpoint = `http://${BACK_HOST}/users`;

const displayName = route.params.displayname;

const {
  data: userProfileInfo,
  status: userProfilestatus,
  error: userProfileError,
} = await useFetch(`${endpoint}/${displayName}/profile`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

console.log("Dane użytkownika", userProfileInfo.value);
console.log("Status zapytania:", userProfilestatus.value);
if (userProfileError.value) {
  console.error("Błąd zapytania:", userProfileError.value);
}

const {
  data: userFollowersCount,
  status: followersStatus,
  error: followersError,
} = await useFetch(`${endpoint}/${displayName}/followers/count`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

console.log("Liczba obserwujących", userFollowersCount.value);
console.log("Status zapytania:", followersStatus.value);
if (followersError.value) {
  console.error("Błąd zapytania:", followersError.value);
}

const {
  data: userFollowingCount,
  status: followingStatus,
  error: followingError,
} = await useFetch(`${endpoint}/${displayName}/following/count`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

console.log("Liczba obserwujących", userFollowingCount.value);
console.log("Status zapytania:", followingStatus.value);
if (followingError.value) {
  console.error("Błąd zapytania:", followingError.value);
}

const userFollowers = userFollowersCount.value.count || 0;

const userFollowing = userFollowingCount.value.count || 0;

const userDescription = userProfileInfo.value.description || "No description";

const userAvatar = userProfileInfo.value.profilePicture || "/Buddyshare.svg";

const userCoverImage = userProfileInfo.value.coverImage || "/Buddyshare.svg";

// Funkcja do formatowania daty na czytelny dla człowieka format
const formatDate = (dateString: string) => {
  if (!dateString) return "Nieznana data";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Nieprawidłowa data";

  // Opcje formatowania
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
};

// Używamy formatowanej daty
const userJoinDate = userProfileInfo.value.createdAt
  ? formatDate(userProfileInfo.value.createdAt)
  : "Nieznana data";

// Dane profilu (na sztywno)
const profileData = ref({
  username: displayName,
  displayName: displayName,
  avatar: userAvatar,
  coverImage: userCoverImage,
  description: userDescription,
  followers: userFollowers,
  following: userFollowing,
  joinDate: userJoinDate,
});

const streamsStore = useStreamsStore();

// Dodaj zmienne dla edycji profilu
const editProfileDialog = ref(false);
const editedDescription = ref("");
const editedProfilePicture = ref("");
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

// Inicjalizuj wartości edycji
const initEditValues = () => {
  editedDescription.value = userDescription;
  editedProfilePicture.value = userAvatar;
  selectedFile.value = null;
  isUploading.value = false;
};

// Funkcja upload obrazu

// Funkcja obsługi wyboru pliku
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  // Sprawdź typ pliku
  if (!file.type.startsWith("image/")) {
    alert("Proszę wybrać plik obrazu (JPG, PNG, GIF, etc.)");
    target.value = "";
    selectedFile.value = null;
    return;
  }

  // Sprawdź rozmiar pliku (10 MB = 10 * 1024 * 1024 bytes)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Rozmiar pliku nie może przekraczać 10 MB");
    target.value = "";
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
  isUploading.value = true;

  try {
    // Upload pliku
    const uploadedUrl = await media.uploadImage(file);
    console.log("Wysłano!", uploadedUrl);

    // Ustaw URL zauploadowanego obrazu
    editedProfilePicture.value = uploadedUrl;

    // Stwórz podgląd obrazu (lokalny)
    const reader = new FileReader();
    reader.onload = (e) => {
      // Opcjonalnie można użyć lokalnego podglądu
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Błąd podczas uploadowania pliku:", error);
    alert("Błąd podczas uploadowania pliku. Spróbuj ponownie.");
    selectedFile.value = null;
    target.value = "";
  } finally {
    isUploading.value = false;
  }
};

// Funkcja czyszczenia wyboru pliku
const clearFileSelection = () => {
  selectedFile.value = null;
  editedProfilePicture.value = userAvatar;
  isUploading.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Sprawdź czy użytkownik może edytować profil
const canEditProfile = computed(() => {
  return authStore.userName === displayName;
});

// Funkcja aktualizacji profilu
const updateProfile = async () => {
  if (!editedDescription.value.trim()) {
    console.error("Opis jest wymagany.");
    alert("Opis jest wymagany.");
    return;
  }

  const { error } = await api.users.updateProfile(displayName as string, {
    description: editedDescription.value,
    profilePicture: editedProfilePicture.value,
  });

  if (error.value) {
    console.error("Błąd aktualizacji profilu:", error.value);
    alert("Błąd podczas aktualizacji profilu.");
    return;
  }

  // Aktualizuj lokalne dane
  profileData.value.description = editedDescription.value;
  profileData.value.avatar = editedProfilePicture.value;

  editProfileDialog.value = false;
  console.log("Profil zaktualizowany pomyślnie");
};
</script>

<template>
  <v-container
    fluid
    class="profile-layout pa-0"
  >
    <!-- Cover Image Section -->
    <v-img
      :src="profileData.coverImage"
      height="240"
      cover
      class="profile-cover"
    >
      <template v-slot:placeholder>
        <v-row
          class="fill-height ma-0"
          align="center"
          justify="center"
        >
          <v-progress-circular
            indeterminate
            color="grey-lighten-5"
          ></v-progress-circular>
        </v-row>
      </template>
    </v-img>

    <!-- Profile Information Section -->
    <v-container>
      <v-row>
        <v-col
          cols="12"
          md="4"
          class="profile-info"
        >
          <!-- Avatar and Main Info -->
          <div class="d-flex flex-column align-center">
            <div class="position-relative">
              <v-avatar
                size="150"
                class="profile-avatar mt-n10 mb-4"
              >
                <v-img
                  :src="profileData.avatar"
                  alt="Avatar"
                ></v-img>
              </v-avatar>

              <!-- Edit Profile Button -->
              <v-dialog
                v-model="editProfileDialog"
                max-width="600px"
                class="mt-6"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-if="canEditProfile"
                    icon="mdi-pencil"
                    color="grey"
                    variant="elevated"
                    size="small"
                    class="edit-profile-btn"
                    v-bind="props"
                    @click="initEditValues"
                  ></v-btn>
                </template>
                <v-card>
                  <v-card-title>Edytuj profil</v-card-title>
                  <v-card-text>
                    <v-form @submit.prevent="updateProfile">
                      <v-textarea
                        v-model="editedDescription"
                        label="Opis profilu"
                        variant="outlined"
                        rows="4"
                        class="mb-4"
                        required
                      ></v-textarea>

                      <!-- Sekcja zdjęcia profilowego -->
                      <div class="mb-4">
                        <v-label class="text-subtitle-2 mb-2"
                          >Zdjęcie profilowe</v-label
                        >

                        <!-- Podgląd aktualnego zdjęcia -->
                        <div class="d-flex align-center mb-3">
                          <v-avatar
                            size="80"
                            class="mr-4"
                          >
                            <v-img
                              :src="editedProfilePicture"
                              alt="Podgląd"
                            ></v-img>
                          </v-avatar>
                          <div class="flex-grow-1">
                            <div class="text-caption text-grey">
                              Aktualne zdjęcie profilowe
                            </div>
                            <div class="text-caption text-grey">
                              Maksymalny rozmiar: 10 MB
                            </div>
                          </div>
                        </div>

                        <!-- Input do wyboru pliku -->
                        <input
                          ref="fileInput"
                          type="file"
                          accept="image/*"
                          style="display: none"
                          @change="handleFileSelect"
                        />

                        <!-- Przyciski akcji -->
                        <div class="d-flex gap-2 mb-3">
                          <v-btn
                            color="primary"
                            variant="outlined"
                            prepend-icon="mdi-upload"
                            :loading="isUploading"
                            :disabled="isUploading"
                            @click="fileInput?.click()"
                          >
                            {{
                              isUploading ? "Uploadowanie..." : "Wybierz plik"
                            }}
                          </v-btn>

                          <v-btn
                            v-if="selectedFile && !isUploading"
                            color="error"
                            variant="text"
                            prepend-icon="mdi-close"
                            @click="clearFileSelection"
                          >
                            Usuń
                          </v-btn>
                        </div>

                        <!-- Informacja o wybranym pliku -->
                        <div
                          v-if="selectedFile"
                          class="mb-3"
                        >
                          <v-chip
                            :color="isUploading ? 'orange' : 'success'"
                            variant="tonal"
                            :prepend-icon="
                              isUploading ? 'mdi-loading mdi-spin' : 'mdi-check'
                            "
                            class="text-caption"
                          >
                            {{ selectedFile.name }} ({{
                              (selectedFile.size / 1024 / 1024).toFixed(2)
                            }}
                            MB)
                            {{
                              isUploading
                                ? "- Uploadowanie..."
                                : "- Zauploadowano!"
                            }}
                          </v-chip>
                        </div>

                        <!-- Alternatywnie URL -->
                        <v-text-field
                          v-model="editedProfilePicture"
                          label="Lub podaj URL zdjęcia"
                          variant="outlined"
                          class="mb-4"
                          hint="Zostaw puste aby zachować obecne zdjęcie"
                          persistent-hint
                          :disabled="!!selectedFile || isUploading"
                        ></v-text-field>
                      </div>
                    </v-form>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="error"
                      variant="text"
                      @click="editProfileDialog = false"
                      :disabled="isUploading"
                    >
                      Anuluj
                    </v-btn>
                    <v-btn
                      color="primary"
                      @click="updateProfile"
                      :disabled="isUploading"
                    >
                      Zapisz zmiany
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </div>

            <h1 class="text-h4 mb-1">{{ profileData.displayName }}</h1>
            <p class="text-subtitle-1 text-grey-lighten-1">
              @{{ profileData.username }}
            </p>
            <div class="d-flex">
              <v-btn
                color="primary"
                class="mt-2 mr-2"
                prepend-icon="mdi-check"
                >Obserwuj</v-btn
              >
              <v-btn
                v-if="streamsStore.isStreamerLive(displayName as string)"
                color="secondary"
                class="mt-2"
                prepend-icon="mdi-video"
                @click="navigateTo(`/user/${displayName}`)"
                >view Stream</v-btn
              >
            </div>
          </div>

          <!-- Social Links -->
          <div class="d-flex justify-center my-4">
            <!-- <v-btn
              v-for="(link, index) in profileData.socialLinks"
              :key="index"
              :icon="link.icon"
              variant="text"
              density="comfortable"
              class="mx-1"
            ></v-btn> -->
          </div>
        </v-col>

        <v-col
          cols="12"
          md="8"
        >
          <!-- Stats Section -->
          <v-card class="mb-4">
            <v-card-text>
              <v-row>
                <v-col
                  cols="6"
                  md="4"
                  class="text-center"
                >
                  <div class="text-h5">
                    {{ profileData.followers.toLocaleString() }}
                  </div>
                  <NuxtLink
                    @click="
                      navigateTo(`/user/${displayName}/profile/followers`)
                    "
                    class="profile-link"
                  >
                    Obserwujący
                  </NuxtLink>
                </v-col>
                <v-col
                  cols="6"
                  md="4"
                  class="text-center"
                >
                  <div class="text-h5">
                    {{ profileData.following.toLocaleString() }}
                  </div>
                  <NuxtLink
                    @click="
                      navigateTo(`/user/${displayName}/profile/following`)
                    "
                    class="profile-link"
                  >
                    Obserwuje
                  </NuxtLink>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  class="text-center"
                >
                  <div class="text-h5">{{ profileData.joinDate }}</div>
                  <div class="text-subtitle-2">Dołączył/a</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Description Card -->
          <v-card>
            <v-card-title>O mnie</v-card-title>
            <v-card-text>
              <p>{{ profileData.description }}</p>
            </v-card-text>
          </v-card>

          <!-- Ostatnie transmisje (opcjonalnie) -->
          <v-card class="mt-4">
            <v-card-title class="d-flex justify-space-between">
              <span>Ostatnie transmisje</span>
              <v-btn
                variant="text"
                color="primary"
                >Zobacz wszystkie</v-btn
              >
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="i in 3"
                  :key="i"
                >
                  <v-card class="stream-preview">
                    <v-img
                      src="/Buddyshare.svg"
                      height="120"
                      cover
                      class="align-end"
                    >
                      <div class="pa-2 bg-black bg-opacity-60">
                        <div class="text-caption">2 godz. temu</div>
                      </div>
                    </v-img>
                    <v-card-title class="text-body-1 pb-0"
                      >Tytuł transmisji {{ i }}</v-card-title
                    >
                    <v-card-subtitle>12.8K wyświetleń</v-card-subtitle>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style lang="scss" scoped>
.profile-layout {
  background: #0a0a0a;
  min-height: 100vh;
}

.profile-avatar {
  border: 4px solid var(--v-theme-surface);
}

.profile-cover {
  position: relative;
}

.profile-info {
  margin-bottom: 2rem;
}

.profile-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--v-theme-primary);
    text-decoration: underline;
  }
}

.edit-profile-btn {
  position: absolute;
  bottom: 16px;
  right: 8px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: var(--v-theme-grey-darken-1) !important;
  }
}

// Mobile optimizations
@media (max-width: 960px) {
  .profile-avatar {
    margin-top: -50px;
    width: 100px;
    height: 100px;
  }

  .edit-profile-btn {
    bottom: 12px;
    right: 4px;
  }
}
</style>
