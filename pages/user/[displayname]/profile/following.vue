<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import type { UserInfo } from "~/types/User";

definePageMeta({
  middleware: ["user-exists"],
});

const route = useRoute();
const displayName = computed(() => route.params.displayname as string);
const headers = useRequestHeaders(["cookie"]);
const config = useRuntimeConfig();
const BACK_HOST = config.public.BACK_HOST;

// Stany listy obserwowanych
const following = ref<UserInfo[]>([]);
const isLoading = ref(true);
const initialLoading = ref(true);
const currentPage = ref(1);
const pageSize = ref(20);
const hasMoreItems = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const sortOptions = ["Newest", "Oldest", "A-Z", "Z-A"];
const selectedSort = ref("Newest");

// Załaduj listę obserwowanych
const loadFollowing = async (page: number = 1) => {
  if (!hasMoreItems.value && page > 1) return;

  isLoading.value = true;

  try {
    // Reset data when starting a new search
    if (page === 1) {
      following.value = [];
    }

    // W prawdziwej implementacji powinieneś użyć rzeczywistego endpointu API
    // Na przykład: `http://${BACK_HOST}/user/${displayName.value}/following?page=${page}&limit=${pageSize.value}`

    // Przykładowa implementacja z timeoutem symulującym odpowiedź z API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Symulowany zestaw danych dla demonstracji
    const mockData = Array(
      page === 1 ? pageSize.value : Math.min(pageSize.value, 5)
    )
      .fill(null)
      .map((_, i) => ({
        username: `user_${(page - 1) * pageSize.value + i + 1}`,
        displayName: `User ${(page - 1) * pageSize.value + i + 1}`,
        email: `user${(page - 1) * pageSize.value + i + 1}@example.com`,
        avatar: "/Buddyshare.svg",
        userRole: "user",
        isBanned: i % 10 === 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        followedAt: new Date(Date.now() - i * 43200000).toISOString(),
        isLive: i % 5 === 0,
        viewers: i % 5 === 0 ? Math.floor(Math.random() * 1000) : 0,
      }));

    following.value = [...following.value, ...mockData];

    // Sprawdź czy mamy więcej elementów do załadowania
    hasMoreItems.value = mockData.length >= pageSize.value;
  } catch (error) {
    console.error("Failed to fetch following:", error);
  } finally {
    isLoading.value = false;
    initialLoading.value = false;
  }
};

// Obsługa unfollowa
const unfollowUser = async (username: string) => {
  try {
    // Symulacja żądania unfollow
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Usunięcie użytkownika z listy (symulacja skutecznego unfollowa)
    following.value = following.value.filter(
      (user) => user.username !== username
    );

    // Wyświetlenie powiadomienia o sukcesie
    // W rzeczywistej implementacji użyłbyś swojego systemu powiadomień
    alert(`Unfollow ${username} successful!`);
  } catch (error) {
    console.error("Failed to unfollow user:", error);
  }
};

// Format daty
const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return "N/A";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// Filtrowanie i sortowanie danych
const filteredFollowing = computed(() => {
  let filtered = [...following.value];

  // Filtrowanie według wyszukiwanego tekstu
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
    );
  }

  // Sortowanie
  switch (selectedSort.value) {
    case "Newest":
      filtered.sort(
        (a, b) =>
          new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime()
      );
      break;
    case "Oldest":
      filtered.sort(
        (a, b) =>
          new Date(a.followedAt).getTime() - new Date(b.followedAt).getTime()
      );
      break;
    case "A-Z":
      filtered.sort((a, b) => a.username.localeCompare(b.username));
      break;
    case "Z-A":
      filtered.sort((a, b) => b.username.localeCompare(a.username));
      break;
  }

  return filtered;
});

// Załaduj początkowe dane
onMounted(async () => {
  await loadFollowing();

  // Obserwator przewijania dla nieskończonego ładowania
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value && hasMoreItems.value) {
        currentPage.value++;
        loadFollowing(currentPage.value);
      }
    },
    { threshold: 0.5 }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }

  onBeforeUnmount(() => {
    observer.disconnect();
  });
});

// Obserwuj zmiany w filtrach i odświeżaj dane
watch(
  [searchQuery, selectedSort],
  () => {
    currentPage.value = 1;
    hasMoreItems.value = true;
    loadFollowing(1);
  },
  { deep: true }
);

// Funkcja pomocnicza do nawigacji
const navigateToUser = (username: string) => {
  navigateTo(`/user/${username}`);
};

// Oblicz liczbę wyświetlanych użytkowników
const displayedCount = computed(() => filteredFollowing.value.length);
const totalFollowingCount = ref(186); // W rzeczywistości pobrałbyś tę wartość z API
</script>

<template>
  <v-container
    fluid
    class="following-page pa-0 fill-height"
  >
    <v-card
      flat
      class="following-card h-100"
    >
      <!-- Header z informacją o liście obserwowanych -->
      <v-toolbar
        flat
        class="bg-grey-darken-4"
      >
        <v-toolbar-title class="font-weight-bold">
          {{ displayName }}'s Following
          <span class="text-caption ml-2"
            >({{ displayedCount }}/{{ totalFollowingCount }})</span
          >
        </v-toolbar-title>
        <v-spacer />

        <!-- Sortowanie -->
        <v-select
          v-model="selectedSort"
          :items="sortOptions"
          density="compact"
          variant="outlined"
          hide-details
          class="sorting-select mx-2"
          style="max-width: 150px"
          prepend-inner-icon="mdi-sort"
        />

        <!-- Wyszukiwarka -->
        <v-text-field
          v-model="searchQuery"
          density="compact"
          placeholder="Search following..."
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="search-field mx-2"
          style="max-width: 250px"
        />
      </v-toolbar>

      <!-- Lista obserwowanych -->
      <v-card-text class="pa-0">
        <div class="following-list-container">
          <!-- Ładowanie - skeleton -->
          <template v-if="initialLoading">
            <div class="pa-4">
              <div
                v-for="n in 5"
                :key="`skeleton-${n}`"
                class="skeleton-item mb-4"
              >
                <v-skeleton-loader
                  type="list-item-avatar-two-line"
                  class="mb-2"
                />
              </div>
            </div>
          </template>

          <!-- Lista użytkowników -->
          <v-list
            v-else
            class="pt-0 following-list"
            lines="two"
          >
            <v-list-item
              v-for="user in filteredFollowing"
              :key="user.username"
              class="px-4 py-3 following-list-item"
            >
              <!-- Awatar użytkownika -->
              <template #prepend>
                <v-avatar
                  size="48"
                  class="cursor-pointer"
                  @click="navigateToUser(user.username)"
                >
                  <v-img
                    :src="user.avatar"
                    alt="avatar"
                  />
                  <v-badge
                    v-if="user.isLive"
                    color="error"
                    dot
                    location="bottom end"
                    offset-x="3"
                    offset-y="3"
                  />
                </v-avatar>
              </template>

              <!-- Informacje o użytkowniku -->
              <v-list-item-title>
                <div class="d-flex align-center">
                  <span
                    class="font-weight-medium cursor-pointer"
                    @click="navigateToUser(user.username)"
                  >
                    {{ user.displayName || user.username }}
                  </span>
                  <v-chip
                    v-if="user.isLive"
                    size="x-small"
                    color="error"
                    class="ml-2 px-2"
                    label
                  >
                    LIVE
                    <span class="ml-1">{{ user.viewers }}👁</span>
                  </v-chip>
                </div>
              </v-list-item-title>

              <v-list-item-subtitle>
                <div class="text-caption">@{{ user.username }}</div>
                <div class="text-caption mt-1">
                  Following since: {{ formatDate(user.followedAt) }}
                </div>
              </v-list-item-subtitle>

              <!-- Przycisk do anulowania obserwowania -->
              <template #append>
                <div class="user-actions">
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    class="unfollow-btn"
                    @click="unfollowUser(user.username)"
                  >
                    Unfollow
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <!-- Komunikat o braku wyników -->
            <v-list-item v-if="filteredFollowing.length === 0 && !isLoading">
              <v-sheet class="text-center py-8 w-100">
                <v-icon
                  icon="mdi-account-search"
                  size="x-large"
                  class="mb-4"
                />
                <h3 class="text-h6">No following users found</h3>
                <p class="text-body-2 text-grey">
                  Try adjusting your search query
                </p>
              </v-sheet>
            </v-list-item>
          </v-list>

          <!-- Wskaźnik ładowania -->
          <div
            v-if="isLoading && !initialLoading"
            class="py-4 text-center"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            />
            <div class="mt-2">Loading more users...</div>
          </div>

          <!-- Element obserwowany do infinite scroll -->
          <div
            ref="loadMoreTrigger"
            class="load-more-trigger"
          ></div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style lang="scss" scoped>
.following-page {
  background: #1e1e1e;
  min-height: 100vh;
}

.following-card {
  background: transparent;
}

.following-list-container {
  position: relative;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.following-list {
  height: auto;
  contain: content;
}

.following-list-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

.user-actions {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.following-list-item:hover .user-actions {
  opacity: 1;
}

.load-more-trigger {
  height: 20px;
}

.cursor-pointer {
  cursor: pointer;
}

// Animacje i style dla skeletonów
.skeleton-item {
  animation: pulse 1.5s infinite ease-in-out;
  &:nth-child(odd) {
    animation-delay: 0.15s;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
}

// Style dla mobile
@media (max-width: 600px) {
  .search-field {
    width: 100%;
    max-width: none !important;
  }

  .sorting-select {
    max-width: 100px !important;
  }

  .following-list-item {
    padding: 16px 8px;
  }

  .user-actions {
    opacity: 1;
  }
}
</style>
