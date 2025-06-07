<template>
  <v-app class="d-flex flex-column min-h-100vh">
    <v-app-bar
      app
      flat
      dark
      :color="undefined"
      class="px-8"
      :class="{
        'v-app-bar-hidden': isScrollingDown && lastScrollY > 50,
        'streaming-bg-header-transparent': isScrollingDown && lastScrollY > 50,
        'streaming-bg-header': !isScrollingDown || lastScrollY <= 50,
      }"
      :elevation="0"
    >
      <!-- Owijamy pierwszy v-tooltip w ClientOnly -->
      <client-only>
        <v-tooltip
          location="bottom"
          text="Menu"
        >
          <template #activator="{ props }">
            <v-app-bar-nav-icon
              v-bind="props"
              @click.stop="drawer = !drawer"
              class="mr-4"
            />
          </template>
        </v-tooltip>
        
        <!-- Fallback dla ClientOnly -->
        <template #fallback>
          <v-app-bar-nav-icon
            @click.stop="drawer = !drawer"
            class="mr-4"
          />
        </template>
      </client-only>
      
      <v-img
        src="/Buddyshare.svg"
        max-width="45"
        class="mr-2"
        alt="Logo"
        @click="navigateTo('/')"
        style="cursor: pointer"
      />
      <span
        class="text-h4 font-weight-bold"
        style="user-select: none; cursor: pointer"
        @click="navigateTo('/')"
        >BuddyShare</span
      >

      <v-spacer />

      <div class="d-flex align-center">
        <!-- Notification Tray -->
        <client-only>
          <v-btn
            v-if="authStore.authenticated"
            variant="text"
            icon
            color="white"
            class="mr-2"
            v-bind="showNotifications ? {} : {}"
          >
            <v-icon icon="mdi-bell-outline" />
            <v-badge
              :content="unreadCount"
              :model-value="unreadCount > 0"
              color="red"
              floating
            />
            
            <v-menu
              v-model="showNotifications"
              :close-on-content-click="false"
              location="bottom end"
              transition="slide-y-transition"
              activator="parent"
            >
              <v-card width="350">
                <v-toolbar
                  density="compact"
                  color="grey-darken-4"
                >
                  <v-toolbar-title>Notifications</v-toolbar-title>
                  <v-spacer />
                  <v-btn
                    variant="text"
                    icon="mdi-check-all"
                    @click="markAllAsRead"
                    :disabled="unreadCount === 0"
                    title="Mark all as read"
                  />
                  <v-btn
                    variant="text"
                    icon="mdi-delete-sweep"
                    @click="deleteAllNotifications"
                    :disabled="notifications.length === 0"
                    title="Delete all notifications"
                    class="ml-2"
                  />
                </v-toolbar>

                <v-list
                  class="py-0"
                  density="compact"
                >
                  <template v-if="notifications.length > 0">
                    <v-list-item
                      v-for="notification in notifications"
                      :key="notification.id"
                      :class="{ 'bg-grey-darken-3': !notification.isRead }"
                    >
                      <template #prepend>
                        <v-icon
                          icon="mdi-bell-outline"
                          color="primary"
                        />
                      </template>

                      <v-list-item-subtitle
                        class="text-caption"
                        @click="handleNotificationClick(notification)"
                        style="cursor: pointer"
                      >
                        {{ notification.message }}
                      </v-list-item-subtitle>
                      <v-list-item-subtitle
                        class="text-caption text-medium-emphasis text-right"
                      >
                        {{ formatTime(notification.created_at) }}
                      </v-list-item-subtitle>

                      <template #append>
                        <v-btn
                          icon="mdi-delete-outline"
                          variant="text"
                          size="small"
                          color="error"
                          @click.stop="handleDeleteNotification(notification.id)"
                          title="Delete notification"
                        />
                      </template>
                    </v-list-item>
                  </template>

                  <v-list-item v-else>
                    <v-list-item-title class="text-caption text-center py-4">
                      No new notifications
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-menu>
          </v-btn>
          
          <template #fallback>
            <v-btn
              variant="text"
              icon="mdi-bell-outline"
              color="white"
              class="mr-2"
              disabled
            />
          </template>
        </client-only>

        <!-- Auth Buttons -->
        <client-only>
          <template v-if="!isAuthenticated">
            <v-btn
              variant="text"
              to="/register"
              class="text-white mx-2"
            >
              Register
            </v-btn>
            <v-btn
              variant="text"
              to="/login"
              class="text-white mx-2"
            >
              Login
            </v-btn>
          </template>
          
          <template v-else>
            <v-btn
              variant="text"
              @click="logout"
              class="text-white mx-2"
            >
              Logout
            </v-btn>

            <v-tooltip
              location="bottom"
              text="Your Profile"
            >
              <template #activator="{ props }">
                <Icon
                  name="ic:baseline-person-outline"
                  size="2em"
                  v-bind="props"
                  @click="navigateToProfile"
                  class="cursor-pointer transition-opacity hover:opacity-80"
                />
              </template>
            </v-tooltip>
          </template>
          
          <!-- Fallback dla przycisków auth -->
          <template #fallback>
            <div class="d-flex align-center">
              <v-skeleton-loader
                type="button"
                width="70"
                class="mx-2"
              ></v-skeleton-loader>
              <v-skeleton-loader
                type="button"
                width="70"
                class="mx-2"
              ></v-skeleton-loader>
            </div>
          </template>
        </client-only>
      </div>
    </v-app-bar>

    <client-only>
      <v-navigation-drawer
        v-model="drawer"
        app
        dark
        width="280"
        class="pa-4"
      >
        <v-list density="compact">
          <template
            v-for="(item, i) in computedNavItems"
            :key="i"
          >
            <!-- Element z dziećmi - używamy v-list-group -->
            <v-list-group
              v-if="item.children"
              v-model="openGroups[i]"
              class="minimal-indent"
            >
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.icon" />
                  </template>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
              </template>

              <v-list-item
                v-for="(child, j) in item.children"
                :key="j"
                :to="child.to"
                active-class="active-nav-item"
                class="child-item"
              >
                <template #prepend>
                  <v-icon
                    :icon="child.icon"
                    class="child-icon"
                  />
                </template>
                <v-list-item-title>{{ child.title }}</v-list-item-title>
              </v-list-item>
            </v-list-group>

            <!-- Standardowy element bez dzieci -->
            <v-list-item
              v-else
              :to="item.to"
              active-class="active-nav-item"
            >
              <template #prepend>
                <v-icon :icon="item.icon" />
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
        
        <template #fallback>
          <div class="pa-4 text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
        </template>
      </v-navigation-drawer>
    </client-only>

    <v-main class="streaming-bg flex-grow-1">
      <v-container
        fluid
        class="fill-height pa-0"
      >
        <slot />
      </v-container>
    </v-main>

    <v-footer
      app
      class="justify-center py-4"
      :absolute="!$vuetify.display.mobile"
    >
      © {{ new Date().getFullYear() }} BuddyShare. All rights reserved.
    </v-footer>
  </v-app>

  <!-- Dialog potwierdzenia usunięcia wszystkich powiadomień -->
  <client-only>
    <v-dialog
      v-model="showDeleteConfirmDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h6"> Delete all notifications? </v-card-title>
        <v-card-text>
          This action is <strong>irreversible</strong>. All notifications will be
          permanently deleted. Are you sure you want to continue?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteConfirmDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="confirmDeleteAllNotifications"
          >
            Delete all
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </client-only>

  <!-- Snackbar informujący o utracie połączenia internetowego -->
  <client-only>
    <v-snackbar
      v-model="showOfflineMessage"
      :timeout="-1"
      color="error"
      location="bottom center"
      multi-line
      app
    >
      Utracono połączenie z internetem. Niektóre funkcje mogą być niedostępne.
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="showOfflineMessage = false"
        >
          Zamknij
        </v-btn>
      </template>
    </v-snackbar>
  </client-only>

  <!-- Snackbar informujący o problemach z WebSocket -->
  <client-only>
    <v-snackbar
      v-model="showWebSocketMessage"
      :timeout="-1"
      :color="websocketSnackbarColor"
      location="bottom center"
      multi-line
      app
    >
      <div class="d-flex align-center">
        <v-icon
          :icon="websocketStatus.type === 'critical' ? 'mdi-close-circle' : 
                 websocketStatus.type === 'auth' ? 'mdi-account-alert' : 
                 'mdi-alert-circle'"
          class="mr-2"
        />
        <div>
          <div class="font-weight-medium">
            {{ websocketStatus.type === 'critical' ? 'Krytyczny błąd połączenia' :
               websocketStatus.type === 'auth' ? 'Problem z autoryzacją' :
               'Problem z połączeniem publicznym' }}
          </div>
          <div class="text-caption">{{ websocketStatus.message }}</div>
          <div class="text-caption mt-1" v-if="online">
            Spróbuj odświeżyć stronę, aby przywrócić połączenie
          </div>
        </div>
      </div>
      
      <template #actions>
        <v-btn
          v-if="online"
          color="white"
          variant="text"
          size="small"
          @click="refreshPage"
          class="mr-2"
        >
          Odśwież
        </v-btn>
        <v-btn
          color="white"
          variant="text"
          size="small"
          @click="showWebSocketMessage = false"
        >
          Zamknij
        </v-btn>
      </template>
    </v-snackbar>
  </client-only>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useNotificationsStore } from "~/stores/notifications";
import { useAuthStore } from "~/stores/auth";
import { useOnline, useEventListener, useTimeoutFn, watchDebounced } from '@vueuse/core';
import { useAuthWebSocket } from "~/composables/useAuthWebSocket";
import { usePublicWebSocket } from "~/composables/usePublicWebSocket";

const nuxtApp = useNuxtApp(); // Dodajemy nuxtApp

// Inicjalizacja prostych wartości (nie zależnych od stanu autentykacji)
const drawer = ref(false);
const showNotifications = ref(false);
const showDeleteConfirmDialog = ref(false);
const openGroups = ref<boolean[]>([]);

// Store
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

// Izolujemy dane zależne od stanu autentykacji do computed
const isAuthenticated = computed(() => authStore.authenticated);

// Online status
const online = useOnline();
const showOfflineMessage = ref(false);

// WebSocket connection status
const { isConnected: authConnected } = useAuthWebSocket();
const { isConnected: publicConnected } = usePublicWebSocket();
const showWebSocketMessage = ref(false);

// Zabezpieczenie przed undefined podczas inicjalizacji
const safeAuthConnected = computed(() => authConnected?.value ?? false);
const safePublicConnected = computed(() => publicConnected?.value ?? false);

// Dostęp do błędów WebSocket z plugin'u z zabezpieczeniem
const websocketErrors = computed(() => {
  try {
    // Sprawdź czy plugin'y są już załadowane
    if (!nuxtApp.$websocketErrors) {
      return { public: null, auth: null };
    }
    const errors = nuxtApp.$websocketErrors as Ref<{ public: string | null, auth: string | null }>;
    return errors?.value ?? { public: null, auth: null };
  } catch (error) {
    return { public: null, auth: null };
  }
});

const websocketStatus = computed(() => {
  if (!online.value) return { connected: false, message: '', type: 'offline' };
  
  const authShouldBeConnected = isAuthenticated.value;
  const authConnectedStatus = authShouldBeConnected ? safeAuthConnected.value : true;
  const publicConnectedStatus = safePublicConnected.value;
  
  // Sprawdź błędy z plugin'u z zabezpieczeniem
  const hasPublicError = websocketErrors.value.public !== null;
  const hasAuthError = websocketErrors.value.auth !== null;
  
  // Krytyczny błąd - oba websockety są odłączone i mamy błędy
  if (!authConnectedStatus && !publicConnectedStatus && authShouldBeConnected && (hasPublicError || hasAuthError)) {
    return { 
      connected: false, 
      message: 'Utracono połączenie z serwerem. Próba ponownego połączenia...',
      type: 'critical',
      details: {
        public: websocketErrors.value.public,
        auth: websocketErrors.value.auth
      }
    };
  } 
  // Auth websocket odłączony (użytkownik zalogowany)
  else if (!authConnectedStatus && authShouldBeConnected && hasAuthError) {
    return { 
      connected: false, 
      message: websocketErrors.value.auth || 'Brak połączenia z serwerem autoryzacji',
      type: 'auth',
      details: { auth: websocketErrors.value.auth }
    };
  } 
  // Public websocket odłączony
  else if (!publicConnectedStatus && hasPublicError) {
    return { 
      connected: false, 
      message: websocketErrors.value.public || 'Brak połączenia z serwerem publicznym',
      type: 'public',
      details: { public: websocketErrors.value.public }
    };
  }
  
  return { connected: true, message: '', type: 'connected', details: {} };
});

const websocketSnackbarColor = computed(() => {
  switch (websocketStatus.value.type) {
    case 'critical': return 'error';
    case 'auth': return 'warning';
    case 'public': return 'info';
    default: return 'warning';
  }
});

// Używamy VueUse useTimeoutFn do zarządzania opóźnieniami
const { start: startWebSocketTimer, stop: stopWebSocketTimer } = useTimeoutFn(() => {
  try {
    if (!websocketStatus.value?.connected && online.value) {
      showWebSocketMessage.value = true;
    }
  } catch (error) {
    console.warn('WebSocket timer error:', error);
  }
}, 2000, { immediate: false });

// Dodatkowy timer dla sprawdzania po powrocie połączenia internetowego
const { start: startOnlineCheckTimer, stop: stopOnlineCheckTimer } = useTimeoutFn(() => {
  try {
    if (online.value && !websocketStatus.value?.connected) {
      showWebSocketMessage.value = true;
    }
  } catch (error) {
    console.warn('Online check timer error:', error);
  }
}, 1000, { immediate: false });

// Obsługa statusu online/offline z VueUse
watchDebounced(online, (isOnline) => {
  if (!isOnline) {
    showOfflineMessage.value = true;
    showWebSocketMessage.value = false;
    stopWebSocketTimer();
    stopOnlineCheckTimer();
  } else {
    showOfflineMessage.value = false;
    // Opóźnij sprawdzanie WebSocket po powrocie połączenia internetowego
    startOnlineCheckTimer();
  }
}, { debounce: 500, immediate: true });

// Obsługa statusu WebSocket z VueUse watchDebounced
watchDebounced(websocketStatus, (status) => {
  stopWebSocketTimer();
  
  if (!online.value) return; // Nie pokazuj komunikatów WebSocket gdy offline
  
  // Dodatkowe zabezpieczenie przed undefined
  if (!status || typeof status.connected === 'undefined') return;
  
  if (!status.connected && status.message) {
    // Używamy VueUse timer zamiast setTimeout
    startWebSocketTimer();
  } else if (status.connected) {
    showWebSocketMessage.value = false;
  }
}, { debounce: 300, immediate: true, deep: true });


// Zmienne do śledzenia przewijania
const lastScrollY = ref(0);
const isScrollingDown = ref(false);
const userName = computed(() => authStore.userName);
const isAdmin = computed(() => authStore.isAdmin);

// Funkcje pomocnicze do nawigacji
const navigateToProfile = () => {
  navigateTo(`/user/${userName.value}/profile`);
};

const logout = () => {
  authStore.logout();
};

// Funkcja do odświeżenia strony z zabezpieczeniem SSR
const refreshPage = () => {
  if (import.meta.client && window) {
    window.location.reload();
  }
};

// Notifications
const notifications = computed(() => {
  return notificationsStore.notifications.filter(
    (item) => typeof item !== "object" || !("count" in item)
  );
});

const unreadCount = computed(
  () => notifications.value.filter((n: { isRead: boolean }) => !n.isRead).length
);

// Używamy funkcji zamiast computed do generowania elementów nawigacyjnych
// aby zapobiec problemom z hydratacją
const computedNavItems = computed(() => {
  const items = [
    { title: "Home", icon: "mdi-home", to: "/" },
    {
      title: "Discover",
      icon: "mdi-compass",
      to: "/discover",
    }
  ] as Array<{
    title: string;
    icon: string;
    to?: string;
    children?: Array<{
      title: string;
      icon: string;
      to: string;
    }>;
  }>;
  
  // Dynamiczne elementy tylko gdy użytkownik jest zalogowany
  if (isAuthenticated.value) {
    items.push({
      title: "Community",
      icon: "mdi-account-group",
      children: [
        {
          title: "Following",
          icon: "mdi-heart",
          to: `/user/${userName.value}/profile/following`,
        },
        {
          title: "Followed By",
          icon: "mdi-account-multiple",
          to: `/user/${userName.value}/profile/followers`,
        },
      ],
    });
    
    items.push({
      title: "Management",
      icon: "mdi-cog-outline",
      children: [
        {
          title: "Dashboard",
          icon: "mdi-view-dashboard",
          to: `/user/${userName.value}/dashboard`,
        },
        {
          title: "Your Stream",
          icon: "mdi-video-account",
          to: `/user/${userName.value}`,
        },
        {
          title: "Profile",
          icon: "mdi-account",
          to: `/user/${userName.value}/profile`,
        },
        {
          title: "Settings",
          icon: "mdi-cog",
          to: `/user/${userName.value}/settings`,
        },
      ],
    });
    
    if (isAdmin.value) {
      items.push({
        title: "Admin",
        icon: "mdi-shield-account",
        to: "/admin",
      });
    }
  }
  
  items.push({
    title: "About",
    icon: "mdi-information",
    to: "/about",
  });
  
  return items;
});

const formatTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const markAllAsRead = async () => {
  await notificationsStore.markAllAsRead();
};

const handleNotificationClick = async (notification: any) => {
  await notificationsStore.markAsRead(notification.id);
  if (notification.stream_id) {
    const streamer = notification.streamerName || notification.message.split(" ")[0];
    navigateTo(`/user/${streamer}`);
  }
  showNotifications.value = false;
};

const handleDeleteNotification = async (id: number) => {
  await notificationsStore.deleteNotification(id);
};

const deleteAllNotifications = async () => {
  showDeleteConfirmDialog.value = true;
};

const confirmDeleteAllNotifications = async () => {
  showDeleteConfirmDialog.value = false;
  await notificationsStore.deleteAllNotifications();
  showNotifications.value = false;
};

// Lifecycle hooks z VueUse
onMounted(() => {
  if (import.meta.client) {
    useEventListener(window, 'scroll', () => {
      const currentScrollY = window.scrollY;
      isScrollingDown.value = currentScrollY > lastScrollY.value;
      lastScrollY.value = currentScrollY;
    }, { passive: true });
  }
});

</script>

<style scoped>
.min-h-100vh {
  min-height: 100vh;
}

.streaming-bg {
  background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
}

.streaming-bg-header {
  background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
  transition: background 0.3s ease, transform 0.3s ease;
}

.streaming-bg-header-transparent {
  background: transparent;
  transition: background 0.3s ease, transform 0.3s ease;
}

.active-nav-item {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-left: 4px solid #2196f3;
}

.v-list-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.minimal-indent {
  padding-left: 0px !important;
}

.child-item {
  padding-left: -10px !important;
}

.child-icon {
  margin-left: -1.5em !important;
}

.footer-position {
  position: relative;
  z-index: 1;
  margin-top: auto;
}

/* Dodajemy style do animacji znikania nagłówka */
.v-app-bar-hidden {
  transform: translateY(-100%);
}

.v-app-bar {
  transition: transform 0.3s ease, background 0.3s ease;
}
</style>
