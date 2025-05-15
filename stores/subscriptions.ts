import { defineStore } from "pinia";
import { useAuthStore } from "~/stores/auth";
import type { Subscription } from "~/types/Subscription";

export const useSubscriptionStore = defineStore("subscriptions", {
  state: () => ({
    subscriptions: [] as Subscription[],
    isLoading: false,
    error: null as Error | null,
  }),

  actions: {
    async fetchSubscriptions() {
      console.log("[STORESUB] Fetching subscriptions");
      const authStore = useAuthStore();
      const { users } = useApi(); // Przeniesione do wnętrza metody

      if (!authStore.userName) {
        console.log("[STORESUB] Error: User not logged in");
        this.error = new Error("User not logged in");
        return;
      }

      try {
        this.isLoading = true;
        console.log(
          `[STORESUB] Requesting subscriptions for user: ${authStore.userName}`
        );
        const { data, error } = await users.getSubscriptions(
          authStore.userName
        );
        if (error) throw error;
        this.subscriptions = data.value;
        this.error = null;
        console.log("[STORESUB] Fetched subscriptions:", this.subscriptions);
      } catch (err) {
        console.log("[STORESUB] Error fetching subscriptions:", err);
        this.error = err as Error;
      } finally {
        this.isLoading = false;
        console.log(
          "[STORESUB] Fetch completed, loading state:",
          this.isLoading
        );
      }
    },

    async subscribe(username: string) {
      console.log(`[STORESUB] Subscribing to: ${username}`);
      const { streamers } = useApi(); // Przeniesione do wnętrza metody

      try {
        const { error } = await streamers.subscribe(username);
        if (error) throw error;
        console.log(
          `[STORESUB] Successfully subscribed to ${username}, updating list`
        );
        await this.fetchSubscriptions(); // Automatyczna aktualizacja listy
      } catch (err) {
        console.log(`[STORESUB] Error subscribing to ${username}:`, err);
        this.error = err as Error;
        throw err;
      }
    },

    async unsubscribe(username: string) {
      console.log(`[STORESUB] Unsubscribing from: ${username}`);
      const { streamers } = useApi(); // Przeniesione do wnętrza metody

      try {
        const { error } = await streamers.unsubscribe(username);
        if (error) throw error;
        console.log(
          `[STORESUB] Successfully unsubscribed from ${username}, updating list`
        );
        await this.fetchSubscriptions(); // Automatyczna aktualizacja listy
      } catch (err) {
        console.log(`[STORESUB] Error unsubscribing from ${username}:`, err);
        this.error = err as Error;
        throw err;
      }
    },
  },

  getters: {
    isSubscribed: (state) => (username: string) => {
      const result = state.subscriptions.some(
        (sub) => sub.streamerUsername === username
      );
      console.log(`[STORESUB] Checking if subscribed to ${username}:`, result);
      return result;
    },

    // Dodatkowe gettery jeśli potrzebne
    subscribedStreamers: (state) => {
      const streamers = state.subscriptions.map((sub) => ({
        id: sub.streamerId,
        username: sub.streamerUsername,
        profilePicture: sub.profilePicture,
      }));
      console.log("[STORESUB] Getting subscribedStreamers:", streamers.length);
      return streamers;
    },
  },
});
