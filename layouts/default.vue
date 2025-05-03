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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useNotificationsStore } from "~/stores/notifications";
import { useAuthStore } from "~/stores/auth";

// Inicjalizacja prostych wartości (nie zależnych od stanu autentykacji)
const drawer = ref(false);
const showNotifications = ref(false);
const showDeleteConfirmDialog = ref(false);
const openGroups = ref<boolean[]>([]);

// Zmienne do śledzenia przewijania
const lastScrollY = ref(0);
const isScrollingDown = ref(false);

// Store
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

// Izolujemy dane zależne od stanu autentykacji do computed
const isAuthenticated = computed(() => authStore.authenticated);
const userName = computed(() => authStore.userName);
const isAdmin = computed(() => authStore.isAdmin);

// Funkcje pomocnicze do nawigacji
const navigateToProfile = () => {
  navigateTo(`/user/${userName.value}/profile`);
};

const logout = () => {
  authStore.logout();
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
  ];
  
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

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  isScrollingDown.value = currentScrollY > lastScrollY.value;
  lastScrollY.value = currentScrollY;
};

// Lifecycle hooks
onMounted(() => {
  if (import.meta.client) {
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener("scroll", handleScroll);
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
