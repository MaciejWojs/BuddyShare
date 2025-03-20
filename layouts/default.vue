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
      <v-app-bar-nav-icon
        @click.stop="drawer = !drawer"
        class="mr-4"
      />
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

        <v-avatar
          v-if="authStore.authenticated"
          size="45"
          class="ml-4"
          @click="navigateTo(`/user/${authStore.userName}`)"
        >
          <v-img src="/Buddyshare.svg" />
        </v-avatar>
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
          <template v-slot:prepend>
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
import { ref } from "vue";
// import { useAuthStore } from "~/stores/auth";

const drawer = ref(false);
const authStore = useAuthStore();

const navItems = [
  { title: "Home", to: "/", icon: "mdi-home" },
  { title: "Discover", to: "/discover", icon: "mdi-compass" },
  { title: "Following", to: "/following", icon: "mdi-heart" },
  { title: "Profile", to: `/user/${authStore.userName}`, icon: "mdi-account" },
  { title: "Settings", to: "/user/settings", icon: "mdi-cog" },
  { title: "About", to: "/about", icon: "mdi-information" },
];
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
</style>
