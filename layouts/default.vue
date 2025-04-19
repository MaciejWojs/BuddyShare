<!-- layouts/default.vue -->
<template>
  <v-app>
    <v-app-bar
      app
      flat
      dark
      color="transparent"
      class="px-8"
    >
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
        <v-menu
          v-if="authStore.authenticated"
          v-model="showNotifications"
          :close-on-content-click="false"
          location="bottom end"
          transition="slide-y-transition"
          offset-y
        >
          <template #activator="{ props }">
            <v-tooltip
              location="bottom"
              text="Notifications"
            >
              <template #activator="{ props: tooltipProps }">
                <v-badge
                  :content="unreadCount"
                  :model-value="unreadCount > 0"
                  color="red"
                  class="mr-2"
                >
                  <v-btn
                    variant="text"
                    icon="mdi-bell-outline"
                    color="white"
                    v-bind="{ ...props, ...tooltipProps }"
                  />
                </v-badge>
              </template>
            </v-tooltip>
          </template>

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
                      class="mr-3"
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

        <!-- Auth Buttons -->
        <v-btn
          v-if="!authStore.authenticated"
          variant="text"
          to="/register"
          class="text-white mx-2"
        >
          Register
        </v-btn>
        <v-btn
          v-if="!authStore.authenticated"
          variant="text"
          to="/login"
          class="text-white mx-2"
        >
          Login
        </v-btn>

        <v-btn
          v-if="authStore.authenticated"
          variant="text"
          @click="authStore.logout"
          class="text-white mx-2"
        >
          Logout
        </v-btn>

        <v-tooltip
          v-if="authStore.authenticated"
          location="bottom"
          text="Your Profile"
        >
          <template #activator="{ props }">
            <Icon
              name="ic:baseline-person-outline"
              size="2em"
              v-bind="props"
              @click="navigateTo(`/user/${authStore.userName}`)"
              class="cursor-pointer transition-opacity hover:opacity-80"
            />
          </template>
        </v-tooltip>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      dark
      width="280"
      class="pa-4"
    >
      <v-list density="compact">
        <v-list-item
          v-for="(item, i) in navItems"
          :key="i"
          :to="item.to"
          active-class="active-nav-item"
        >
          <template #prepend>
            <v-icon :icon="item.icon" />
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="streaming-bg">
      <v-container
        fluid
        class="fill-height pa-0"
      >
        <slot />
      </v-container>
    </v-main>

    <v-footer class="justify-center py-4">
      © {{ new Date().getFullYear() }} BuddyShare. All rights reserved. Made
      with ❤️ by BuddyShare Team
    </v-footer>
  </v-app>

  <!-- Dialog potwierdzenia usunięcia wszystkich powiadomień -->
  <v-dialog v-model="showDeleteConfirmDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">
        Delete all notifications?
      </v-card-title>
      <v-card-text>
        This action is <strong>irreversible</strong>. All notifications will be permanently deleted.
        Are you sure you want to continue?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="showDeleteConfirmDialog = false">
          Cancel
        </v-btn>
        <v-btn color="error" variant="text" @click="confirmDeleteAllNotifications">
          Delete all
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useNotificationsStore } from "~/stores/notifications";
// import { useAuthStore } from "~/stores/auth";

const drawer = ref(false);
const showNotifications = ref(false);
const authStore = useAuthStore();
const showDeleteConfirmDialog = ref(false);

const notificationsStore = useNotificationsStore();
const notifications = computed(() => {
  // Filtrujemy out pole 'count' z tablicy powiadomień
  return notificationsStore.notifications.filter(item => typeof item !== 'object' || !('count' in item));
});

console.log("Notifications: ", notifications.value);

const unreadCount = computed(
  () => notifications.value.filter((n: { isRead: boolean }) => !n.isRead).length
);

const navItems = computed(() => [
  { title: "Home", icon: "mdi-home", to: "/" },
  {
    title: "Discover",
    icon: "mdi-compass",
    to: "/discover",
  },
  ...(authStore.authenticated
    ? [
        {
          title: "Following",
          icon: "mdi-heart",
          to: `/user/${authStore.userName}/profile/following`,
        },
        {
          title: "Profile",
          icon: "mdi-account",
          to: `/user/${authStore.userName}`,
        },
        {
          title: "Settings",
          icon: "mdi-cog",
          to: "/user/settings",
        },
        ...(authStore.isAdmin
          ? [
              {
                title: "Admin",
                icon: "mdi-shield-account",
                to: "/admin",
              },
            ]
          : []),
      ]
    : []),
  {
    title: "About",
    icon: "mdi-information",
    to: "/about",
  },
]);

const formatTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const markAllAsRead = async () => {
  await notificationsStore.markAllAsRead();
};

const handleNotificationClick = async (notification: any) => {
  await notificationsStore.markAsRead(notification.id);
  // Przekierowanie na stronę streamu jeśli istnieje stream_id
  if (notification.stream_id) {
    const streamer = notification.message.split(" ")[0];
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
  showNotifications.value = false; // Zamykamy menu powiadomień po usunięciu wszystkich
};
</script>

<style scoped>
.streaming-bg {
  background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
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
</style>
