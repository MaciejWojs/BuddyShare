<!-- pages/admin/users.vue -->
<template>
  <v-container
    fluid
    class="admin-panel pa-4 fill-height"
  >
    <v-row
      no-gutters
      class="fill-height"
    >
      <!-- Main Content Column -->
      <v-col cols="12">
        <v-card class="h-100">
          <!-- Admin Panel Header -->
          <v-toolbar
            flat
            class="bg-grey-darken-4"
          >
            <v-toolbar-title class="font-weight-bold"
              >User Management</v-toolbar-title
            >
            <v-spacer />
            <v-text-field
              v-model="searchQuery"
              density="compact"
              placeholder="Search users..."
              variant="outlined"
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="mx-4"
              style="max-width: 300px"
            />
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon
                  variant="text"
                >
                  <v-icon>mdi-filter</v-icon>
                  <v-badge
                    v-if="selectedRoles.length > 0"
                    color="primary"
                    :content="selectedRoles.length"
                    dot
                  />
                </v-btn>
              </template>
              <v-list>
                <v-list-subheader>Filter by Role</v-list-subheader>
                <v-list-item
                  v-for="role in availableRoles"
                  :key="role"
                >
                  <v-checkbox
                    v-model="selectedRoles"
                    :label="role"
                    :value="role"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-subheader>User status</v-list-subheader>
                <v-list-item>
                  <v-checkbox
                    v-model="showBannedOnly"
                    label="Show banned users only"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item>
                  <v-btn
                    block
                    variant="text"
                    size="small"
                    @click="clearFilters"
                  >
                    Clear Filters
                  </v-btn>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-toolbar>

          <!-- User List with virtualization -->
          <v-card-text class="pa-0">
            <div class="user-list-container">
              <!-- Loading states -->
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
                      :style="{ opacity: 0.7 + n * 0.05 }"
                    />
                  </div>
                </div>
              </template>

              <v-list
                v-else
                class="pt-0 user-list"
              >
                <v-list-item
                  v-for="user in displayedUsers"
                  :key="user.username"
                  class="px-4 py-3 user-list-item"
                  :height="88"
                >
                  <template #prepend>
                    <v-avatar
                      size="36"
                      color="primary"
                      class="cursor-pointer"
                      @click="navigateTo(`/user/${user.username}`)"
                    >
                      <v-icon icon="ic:baseline-person-outline" />
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    <div class="d-flex align-center">
                      <span class="font-weight-medium">{{
                        user.username
                      }}</span>
                      <v-chip
                        size="small"
                        class="ml-2 px-2"
                        variant="outlined"
                        label
                      >
                        {{ user.userRole }}
                      </v-chip>
                      <v-chip
                        v-if="user.isBanned"
                        size="small"
                        class="ml-2 px-2"
                        color="error"
                        label
                      >
                        BANNED
                      </v-chip>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="text-caption">{{ user.email }}</div>
                    <div class="text-caption mt-1">
                      Created: {{ formatDate(user.createdAt) }} | Last login:
                      <!-- {{ formatDate(user.lastLogin) }} -->
                    </div>
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="user-actions">
                      <v-btn-group
                        variant="tonal"
                        density="comfortable"
                      >
                        <v-btn
                          icon="mdi-account-edit"
                          size="small"
                          color="primary"
                          title="Edit"
                        />
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          color="error"
                          title="Delete"
                        />
                        <v-btn
                          icon="mdi-hammer"
                          size="small"
                          :color="user.isBanned ? 'blue' : 'warning'"
                          :title="user.isBanned ? 'Unban' : 'Ban'"
                          @click="banUser(user.username)"
                        />
                        <v-btn
                          icon="mdi-shield-account"
                          size="small"
                          title="Manage Roles"
                          color="success"
                        />
                      </v-btn-group>
                    </div>
                  </template>
                </v-list-item>

                <!-- Empty state placeholder -->
                <v-list-item v-if="displayedUsers.length === 0 && !isLoading">
                  <v-sheet class="text-center py-8 w-100">
                    <v-icon
                      icon="mdi-alert-circle-outline"
                      size="x-large"
                      class="mb-4"
                    />
                    <h3 class="text-h6">No users found</h3>
                    <p class="text-body-2 text-grey">
                      Try changing your search criteria or filters
                    </p>
                  </v-sheet>
                </v-list-item>
              </v-list>

              <!-- Loading more indicator -->
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

              <!-- Intersection observer target for infinite scroll -->
              <div
                ref="loadMoreTrigger"
                class="load-more-trigger"
              ></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { UserInfo } from "~/types/User";
import { Role } from "~/types/Roles";
definePageMeta({
  middleware: ["is-logged-in", "is-admin"],
});
const authStore = useAuthStore();
const headers = useRequestHeaders(["cookie"]);

const searchQuery = ref("");
const selectedRoles = ref<string[]>([]);
const showBannedOnly = ref(false);
const config = useRuntimeConfig();

const BACK_HOST = config.public.BACK_HOST;
const endpoint = `http://${BACK_HOST}/users`;

console.log("Fetching users from:", endpoint);
const users = ref<UserInfo[]>([]);
const receivedUsers = ref<UserInfo[]>([]); // Tracks streaming users as they arrive
const isLoading = ref(false);
const initialLoading = ref(true);
const showSkeletons = ref(true); // Control skeleton visibility
const currentPage = ref(1);
const pageSize = ref(10);
const hasMoreUsers = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const streamTimeout = ref<NodeJS.Timeout | null>(null);

// Stream processing utility
const processJsonStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (data: any) => void
) => {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON objects in the buffer
      let startPos = 0;
      let depth = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\" && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === "{" || char === "[") {
          depth++;
        } else if (char === "}" || char === "]") {
          depth--;

          if (depth === 0) {
            // We've found a complete JSON object
            const jsonStr = buffer.substring(startPos, i + 1);
            try {
              const data = JSON.parse(jsonStr);
              onChunk(data);
            } catch (e) {
              console.error("Failed to parse JSON chunk:", e);
            }

            startPos = i + 1;
          }
        }
      }

      // Keep any incomplete data in the buffer
      if (startPos > 0) {
        buffer = buffer.substring(startPos);
      }
    }

    // Process any remaining complete objects
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        onChunk(data);
      } catch (e) {
        console.error("Failed to parse remaining JSON:", e);
      }
    }
  } catch (error) {
    console.error("Stream processing error:", error);
  }
};

// Stabilizacja aktualizacji danych - bufferowanie zmian
const updateBuffer = ref<UserInfo[]>([]);
const updateInterval = ref<NodeJS.Timeout | null>(null);
const updateDelayMs = 200; // Czas między aktualizacjami UI
const chunkLoadingInterval = ref<NodeJS.Timeout | null>(null); // For automatic chunk loading
const chunkLoadingDelay = 3000; // Time between automatic chunk loads (ms)
const maxChunksToLoad = 5; // Maximum number of chunks to load automatically

// Load users with streaming
const loadUsers = async (page: number = 1) => {
  if (!hasMoreUsers.value && page > 1) return;

  isLoading.value = true;

  // Reset receivedUsers when starting a new search or first page
  if (page === 1) {
    receivedUsers.value = [];
    showSkeletons.value = true;
    // Zatrzymaj istniejące interwały aktualizacji
    if (updateInterval.value) {
      clearInterval(updateInterval.value);
      updateInterval.value = null;
    }
    if (chunkLoadingInterval.value) {
      clearInterval(chunkLoadingInterval.value);
      chunkLoadingInterval.value = null;
    }
    updateBuffer.value = [];
  }

  try {
    const response = await fetch(`http://${BACK_HOST}/users`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Process the stream
    const reader = response.body.getReader();
    const tempUsers: UserInfo[] = page === 1 ? [] : [...users.value];
    let receivedCount = 0;

    // Only create interval on client-side
    if (import.meta.client) {
      // Rozpocznij interwał aktualizacji UI
      updateInterval.value = setInterval(() => {
        if (updateBuffer.value.length > 0) {
          // Aktualizuj główną listę tylko jeśli bufor ma dane
          users.value = [...tempUsers];

          // Wyczyść interwał jeśli nie ma już więcej danych do buforowania
          if (!isLoading.value && updateInterval.value) {
            clearInterval(updateInterval.value);
            updateInterval.value = null;
          }
        }
      }, updateDelayMs);
    }

    await processJsonStream(reader, (data) => {
      if (Array.isArray(data)) {
        // Handle array response - aktualizuj tempUsers, ale nie od razu users.value
        const newUsers = data.slice(
          (page - 1) * pageSize.value,
          page * pageSize.value
        );
        tempUsers.push(...newUsers);
        receivedUsers.value = [...tempUsers];
        receivedCount += newUsers.length;
        // Dodaj do bufora aktualizacji
        updateBuffer.value = [...tempUsers];
      } else if (typeof data === "object" && data !== null) {
        // Handle single user object
        tempUsers.push(data as UserInfo);
        receivedUsers.value = [...tempUsers];
        receivedCount++;
        // Dodaj do bufora aktualizacji
        updateBuffer.value = [...tempUsers];
      }
    });

    // Ostatnia aktualizacja po zakończeniu strumienia
    users.value = [...tempUsers];

    // Check if we've reached the end
    hasMoreUsers.value = receivedCount >= pageSize.value;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    if (page === 1) {
      users.value = [];
      receivedUsers.value = [];
    }
  } finally {
    // Add a small delay before hiding skeletons for smoother transition
    setTimeout(() => {
      isLoading.value = false;
      initialLoading.value = false;

      // Zatrzymaj interwał aktualizacji jeśli istnieje
      if (import.meta.client && updateInterval.value) {
        clearInterval(updateInterval.value);
        updateInterval.value = null;
      }

      // Keep skeletons visible a bit longer if no users received yet
      if (receivedUsers.value.length > 0) {
        setTimeout(() => {
          showSkeletons.value = false;
        }, 300);
      }
    }, 500);
  }
};

// Function to automatically load more data in chunks
const startAutomaticChunkLoading = () => {
  if (import.meta.client && !chunkLoadingInterval.value && hasMoreUsers.value) {
    let chunksLoaded = 1; // Start with 1 since we've already loaded the first chunk

    chunkLoadingInterval.value = setInterval(() => {
      // Only load if we're not already loading and there are more users to load
      if (
        !isLoading.value &&
        hasMoreUsers.value &&
        chunksLoaded < maxChunksToLoad
      ) {
        currentPage.value++;
        chunksLoaded++;
        loadUsers(currentPage.value);
      } else if (chunksLoaded >= maxChunksToLoad || !hasMoreUsers.value) {
        // Stop the interval if we've loaded enough chunks or there are no more users
        if (chunkLoadingInterval.value) {
          clearInterval(chunkLoadingInterval.value);
          chunkLoadingInterval.value = null;
        }
      }
    }, chunkLoadingDelay);
  }
};

// Initial data load
await loadUsers();

// Start automatic chunk loading after initial data load
onMounted(() => {
  // Set up intersection observer for infinite scrolling when user reaches the bottom
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value && hasMoreUsers.value) {
        currentPage.value++;
        loadUsers(currentPage.value);
      }
    },
    { threshold: 0.5 }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }

  // Start automatic chunk loading
  startAutomaticChunkLoading();

  onBeforeUnmount(() => {
    observer.disconnect();
    // Clear all intervals when component is unmounted
    if (chunkLoadingInterval.value) {
      clearInterval(chunkLoadingInterval.value);
      chunkLoadingInterval.value = null;
    }
    if (updateInterval.value) {
      clearInterval(updateInterval.value);
      updateInterval.value = null;
    }
  });
});

// Format date to a readable format
const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return "N/A";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

// Extract unique roles for filter dropdown
const availableRoles = computed(() => {
  return Object.values(Role);
});

const filteredUsers = computed(() => {
  if (!users.value || !Array.isArray(users.value)) return [];

  let filtered = users.value;

  if (selectedRoles.value.length > 0) {
    filtered = filtered.filter((usr) =>
      selectedRoles.value.includes(usr.userRole)
    );
  }

  if (showBannedOnly.value) {
    filtered = filtered.filter((usr) => usr.isBanned === true);
  }
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (user: UserInfo) =>
        user.username?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.userRole.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Debug banned users
watch(
  () => filteredUsers.value,
  (newVal) => {
    console.log("Filtered users:", newVal);
    console.log("Show banned only:", showBannedOnly.value);
    console.log(
      "Banned users count:",
      users.value.filter((u) => u.isBanned === true).length
    );
  },
  { deep: true }
);

// Funkcja do czyszczenia wszystkich filtrów
const clearFilters = () => {
  selectedRoles.value = [];
  showBannedOnly.value = false;
};

// When filters change, reset and reload data
watch(
  [searchQuery, selectedRoles, showBannedOnly],
  () => {
    currentPage.value = 1;
    hasMoreUsers.value = true;
    initialLoading.value = true; // Show skeleton loading when filters change
    showSkeletons.value = true;
    loadUsers(1);
  },
  { deep: true }
);

// Users to display - all filtered users
const displayedUsers = computed(() => {
  return filteredUsers.value;
});
const banUser = async (username: string) => {
  try {
    const user = users.value.find((user) => user.username === username);
    if (!user) return;

    const action = user.isBanned ? "unban" : "ban";
    const response = await fetch(
      `http://${BACK_HOST}/users/${username}/${action}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Accept: "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to ban user: ${response.status}`);
    }

    // Update the user locally first for immediate UI feedback
    user.isBanned = !user.isBanned;

    // Then refresh the user list to get updated data from server
    loadUsers();
  } catch (error) {
    console.error("Error banning user:", error);
  }
};
</script>

<style lang="scss" scoped>
.admin-panel {
  background: #1e1e1e;
  height: 100vh;
}

.v-list-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

// Scrollable user list
.v-card-text {
  overflow-y: auto;
  max-height: calc(100vh - 96px);
  scrollbar-width: thin;
}

.load-more-trigger {
  height: 20px;
}

// Add styles for skeleton loaders
:deep(.v-skeleton-loader__button),
:deep(.v-skeleton-loader__text),
:deep(.v-skeleton-loader__chip),
:deep(.v-skeleton-loader__avatar) {
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
}

// Transition animation for user items
.fade-list-enter-active,
.fade-list-leave-active {
  transition: all 0.3s ease;
}
.fade-list-enter-from,
.fade-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-list-move {
  transition: transform 0.3s ease;
}

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

// Stabilizacja układu listy
.user-list-container {
  position: relative;
  height: calc(100vh - 130px);
  overflow-y: auto;
}

.user-list {
  height: auto;
  contain: content;
}

.user-list-item {
  contain: layout style;
  height: 88px !important;
}

.user-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.user-list-item:hover .user-actions {
  opacity: 1;
}
</style>
