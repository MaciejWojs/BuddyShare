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
                  :class="{ 'bg-grey-darken-3': !notification.read }"
                  @click="handleNotificationClick(notification)"
                >
                  <template #prepend>
                    <v-icon
                      :icon="notification.icon"
                      :color="notification.type === 'alert' ? 'red' : 'primary'"
                      class="mr-3"
                    />
                  </template>

                  <v-list-item-title class="text-body-2">
                    {{ notification.title }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ notification.message }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle
                    class="text-caption text-medium-emphasis text-right"
                  >
                    {{ formatTime(notification.time) }}
                  </v-list-item-subtitle>
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
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
// import { useAuthStore } from "~/stores/auth";

const drawer = ref(false);
const showNotifications = ref(false);
const authStore = useAuthStore();

// Notifications
const notifications = ref([
  {
    id: 1,
    title: "New Follower",
    message: "JohnDoe started following you",
    type: "info",
    icon: "mdi-account-plus",
    time: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: 2,
    title: "Stream Alert",
    message: "Your favorite streamer is live!",
    type: "alert",
    icon: "mdi-alert",
    time: new Date(Date.now() - 1800000),
    read: true,
  },
]);

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.read).length
);
const navItems = computed(() => [
  { title: "Home", to: "/", icon: "mdi-home" },
  { title: "Discover", to: "/discover", icon: "mdi-compass" },
  ...(authStore.authenticated
    ? [
        { title: "Following", to: "/following", icon: "mdi-heart" },
        {
          title: "Profile",
          to: `/user/${authStore.userName}`,
          icon: "mdi-account",
        },
        { title: "Settings", to: "/user/settings", icon: "mdi-cog" },
      ]
    : []),
  { title: "About", to: "/about", icon: "mdi-information" },
]);

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const markAllAsRead = () => {
  notifications.value = notifications.value.map((n) => ({ ...n, read: true }));
};

const handleNotificationClick = (notification: any) => {
  notification.read = true;
  // Handle notification click logic
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
