<script lang="ts" setup>
import { ref } from "vue";

definePageMeta({
  middleware: ["user-exists", "is-banned"],
});

const config = useRuntimeConfig();

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
  // socialLinks: [
  //   { icon: "mdi-twitter", url: "#" },
  //   { icon: "mdi-instagram", url: "#" },
  //   { icon: "mdi-youtube", url: "#" },
  // ],
});
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
            <v-avatar
              size="150"
              class="profile-avatar mt-n10 mb-4"
            >
              <v-img
                :src="profileData.avatar"
                alt="Avatar"
              ></v-img>
            </v-avatar>
            <h1 class="text-h4 mb-1">{{ profileData.displayName }}</h1>
            <p class="text-subtitle-1 text-grey-lighten-1">
              @{{ profileData.username }}
            </p>
            <v-btn
              color="primary"
              class="mt-2"
              prepend-icon="mdi-check"
              >Obserwuj</v-btn
            >
          </div>

          <!-- Social Links -->
          <div class="d-flex justify-center my-4">
            <v-btn
              v-for="(link, index) in profileData.socialLinks"
              :key="index"
              :icon="link.icon"
              variant="text"
              density="comfortable"
              class="mx-1"
            ></v-btn>
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

// Mobile optimizations
@media (max-width: 960px) {
  .profile-avatar {
    margin-top: -50px;
    width: 100px;
    height: 100px;
  }
}
</style>
