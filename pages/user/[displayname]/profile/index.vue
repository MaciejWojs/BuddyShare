<script lang="ts" setup>
import { ref, computed, watchEffect, onMounted } from "vue";

definePageMeta({
  middleware: ["user-exists", "is-banned"],
});

const route = useRoute();
const displayName = route.params.displayname as string;

const api = useApi();
const authStore = useAuthStore(); // Zachowane, jeśli jest używane gdzie indziej (np. canEditProfile)

// Pobieranie danych za pomocą useApi
const {
  data: userProfileInfo,
  error: userProfileError,
} = await api.users.getProfile(displayName);

console.log("Dane użytkownika", userProfileInfo.value);
if (userProfileError.value) {
  console.error("Błąd zapytania:", userProfileError.value);
}

const {
  data: userFollowersCount,
  error: followersError,
} = await api.users.getFollowersCount(displayName);

console.log("Liczba obserwujących", userFollowersCount.value);
if (followersError.value) {
  console.error("Błąd zapytania:", followersError.value);
}

const {
  data: userFollowingCount,
  error: followingError,
} = await api.users.getFollowingCount(displayName);

console.log("Liczba obserwowanych", userFollowingCount.value);
if (followingError.value) {
  console.error("Błąd zapytania:", followingError.value);
}

// Reaktywne referencje dla obrazów
const userAvatar = ref("/Buddyshare.svg");
const userCoverImage = ref("/Buddyshare.svg");

// Computed properties dla danych użytkownika
const userFollowers = computed(() => (userFollowersCount.value as any)?.count || 0);
const userFollowing = computed(() => (userFollowingCount.value as any)?.count || 0);
const userDescription = computed(() => (userProfileInfo.value as any)?.description || "No description");

// Pobieranie obrazów za pomocą api.media.getImage (tylko po stronie klienta)
onMounted(async () => {
  console.log("onMounted - userProfileInfo:", userProfileInfo.value);
  
  if (userProfileInfo.value) {
    const profileDataVal = userProfileInfo.value as any; // Zmieniona nazwa, aby uniknąć konfliktu
    console.log("Profile data:", profileDataVal);
    
    // Pobieranie awatara
    if (profileDataVal.profilePicture) {
      console.log("Próba pobrania awatara:", profileDataVal.profilePicture);
      try {
        const avatarUrl = await api.media.getImage(profileDataVal.profilePicture, 'avatar' as any);
        console.log("Avatar URL otrzymany:", avatarUrl);
        userAvatar.value = avatarUrl;
      } catch (e) {
        console.error("Nie udało się załadować awatara:", e);
        console.error("Szczegóły błędu:", JSON.stringify(e, null, 2));
        userAvatar.value = "/Buddyshare.svg";
      }
    } else {
      console.log("Brak profilePicture w danych użytkownika");
    }
    
    // Pobieranie obrazu okładki
    if (profileDataVal.coverImage) {
      console.log("Próba pobrania okładki:", profileDataVal.coverImage);
      try {
        const coverUrl = await api.media.getImage(profileDataVal.coverImage, 'cover' as any);
        console.log("Cover URL otrzymany:", coverUrl);
        userCoverImage.value = coverUrl;
      } catch (e) {
        console.error("Nie udało się załadować obrazu okładki:", e);
        console.error("Szczegóły błędu:", JSON.stringify(e, null, 2));
        userCoverImage.value = "/Buddyshare.svg";
      }
    } else {
      console.log("Brak coverImage w danych użytkownika");
    }
  } else {
    console.log("Brak danych użytkownika w onMounted");
  }
});

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

// Używamy formatowanej daty jako computed property
const userJoinDate = computed(() => 
  (userProfileInfo.value as any)?.createdAt
    ? formatDate((userProfileInfo.value as any).createdAt)
    : "Nieznana data"
);

// Dane profilu jako computed property dla reaktywności
const profileData = computed(() => ({
  username: displayName,
  displayName: displayName,
  avatar: userAvatar.value,
  coverImage: userCoverImage.value,
  description: userDescription.value,
  followers: userFollowers.value,
  following: userFollowing.value,
  joinDate: userJoinDate.value,
}));

const streamsStore = useStreamsStore();
const router = useRouter();

// Dodaj zmienne dla edycji profilu - zachowane z oryginalnego kodu, jeśli potrzebne
const editProfileDialog = ref(false);
const editedDescription = ref("");
const editedProfilePicture = ref(""); // Ta zmienna jest używana w szablonie
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

// Inicjalizuj wartości edycji - zachowane
const initEditValues = () => {
  editedDescription.value = userDescription.value; // Użyj .value dla computed
  editedProfilePicture.value = userAvatar.value; // Użyj .value dla ref
  selectedFile.value = null;
  isUploading.value = false;
};

// Funkcja upload obrazu - zachowane
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    selectedFile.value = null;
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Proszę wybrać plik obrazu (JPG, PNG, GIF, etc.)");
    target.value = "";
    selectedFile.value = null;
    return;
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Rozmiar pliku nie może przekraczać 10 MB");
    target.value = "";
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
  isUploading.value = false;

  // Stwórz lokalny podgląd pliku
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      editedProfilePicture.value = e.target.result as string;
    }
  };
  reader.readAsDataURL(file);
};

// Funkcja czyszczenia wyboru pliku - zachowane
const clearFileSelection = () => {
  selectedFile.value = null;
  editedProfilePicture.value = userAvatar.value; // Użyj .value dla ref
  isUploading.value = false;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Sprawdź czy użytkownik może edytować profil - zachowane
const canEditProfile = computed(() => {
  return authStore.userName === displayName;
});

// Funkcja aktualizacji profilu - zachowane
const updateProfile = async () => {
  if (!editedDescription.value.trim()) {
    console.error("Opis jest wymagany.");
    alert("Opis jest wymagany.");
    return;
  }

  // Przygotuj dane do wysłania
  const profileData: {
    description: string;
    profilePicture?: string;
    file?: File;
  } = {
    description: editedDescription.value,
  };

  // Jeśli wybrano nowy plik, dodaj go do danych
  if (selectedFile.value) {
    profileData.file = selectedFile.value;
  } else if (editedProfilePicture.value && !editedProfilePicture.value.startsWith('blob:')) {
    // Jeśli nie ma pliku, ale jest URL/hash, dodaj go
    profileData.profilePicture = editedProfilePicture.value;
  }

  const { error, data } = await api.users.updateProfile(displayName as string, profileData);

  if (error.value) {
    console.error("Błąd aktualizacji profilu:", error.value);
    alert("Błąd podczas aktualizacji profilu.");
    return;
  }

  // Aktualizuj lokalne dane
  if (userProfileInfo.value && data.value) {
    const updatedUser = (data.value as any).user;
    (userProfileInfo.value as any).description = updatedUser.description;
    
    // Jeśli serwer zwrócił nowy hash obrazu, zaktualizuj awatar
    if (updatedUser.profilePicture) {
      try {
        const avatarUrl = api.media.getImage(updatedUser.profilePicture, 'avatar' as any);
        userAvatar.value = avatarUrl;
      } catch (e) {
        console.error("Nie udało się załadować nowego awatara po aktualizacji:", e);
      }
    }
  }
  
  editProfileDialog.value = false;
  selectedFile.value = null;
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
                @click="router.push(`/user/${displayName}`)"
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
                      router.push(`/user/${displayName}/profile/followers`)
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
                      router.push(`/user/${displayName}/profile/following`)
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
