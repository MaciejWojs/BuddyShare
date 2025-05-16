<script lang="ts" setup>
import { ref } from "vue";

const config = useRuntimeConfig();
const BACK_HOST = config.public.BACK_HOST;
const route = useRoute();

import { useSubscriptionsStore } from "~/stores/subscriptions";
import type { Subscription } from "~/types/Subscription";

const store = useSubscriptionsStore();
// const subscriptions = computed(() => store.subscriptions);

const authStore = useAuthStore();
const displayName = route.params.displayname;

const { users, streamers } = useApi();

const streamerName = String(displayName);

// Check if user is already subscribed to this streamer
const isSubscribed = computed(() => {
  return store.subscriptions.some(
    (sub: Subscription) => sub.streamerUsername === displayName
  );
});
const onSubscribe = async () => {
  try {
    if (isSubscribed.value) {
      await store.removeSubscription(streamerName);
    } else {
      await store.addSubscription(streamerName);
    }
  } catch (error) {
    console.error("Error subscribing/unsubscribing:", error);
  }
};
const isLoading = ref(true);
onMounted(() => {
  isLoading.value = !isLoading.value;
});
</script>

<template>
  <button
    v-if="authStore.userName !== displayName && !isLoading"
    class="subscribe-button"
    @click="onSubscribe"
  >
    <v-icon
      start
      :icon="isSubscribed ? 'mdi-bell-off-outline' : 'mdi-bell-plus-outline'"
      class="mr-1"
    ></v-icon>
    <span class="button-text">{{
      isSubscribed ? "Unsubscribe" : "Subscribe"
    }}</span>
  </button>
</template>

<style lang="scss" scoped>
.subscribe-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid white; // Zmieniono na biały kontur
  background-color: transparent; // Ustawiono przezroczyste tło
  color: white; // Kolor tekstu biały
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 140px;
  height: 40px;

  &:hover {
    background-color: #7d5bbe; // Jasnofioletowe wypełnienie po najechaniu
    border-color: #7d5bbe; // Kolor ramki dopasowany do tła po najechaniu
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .button-text {
    font-weight: 600;
  }
}
</style>
