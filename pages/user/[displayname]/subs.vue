<script setup lang="ts">
import { ref, onMounted, watch, onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useSubscriptionStore } from "~/stores/subscriptions";

console.log("SUB: Component setup initialized");
const route = useRoute();
const authStore = useAuthStore();
const subscriptionStore = useSubscriptionStore();

const config = useRuntimeConfig();
const host = config.public.BACK_HOST;

const isCurrentUser = ref(false);
const isLoading = ref(true);

// Sprawdź i załaduj subskrypcje, gdy zmienia się parametr displayname

async function loadSubscriptions() {
  console.log("SUB: Loading subscriptions started");
  isLoading.value = true;

  try {
    console.log("SUB: Fetching subscriptions for user", authStore.userName);
    // const response = await $fetch(
    //   `http://${host}/users/${authStore.userName}/subscriptions`,
    //   {
    //     method: "GET",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     credentials: "include",
    //   }
    // );

    const response = await subscriptionStore.fetchSubscriptions(
      authStore.userName
    );

    console.log("SUB: Subscriptions response", response);

    console.log(
      "SUB: Subscriptions fetched successfully",
      subscriptionStore.subscribedStreamers
    );
  } catch (error) {
    console.error("SUB: Error fetching subscriptions", error);
  } finally {
    isLoading.value = false;
    console.log("SUB: Loading subscriptions completed");
  }
}

// Sprawdź autentykację i pobierz subskrypcje przed zamontowaniem komponentu
onBeforeMount(() => {
  console.log("SUB: Before component mount");
  if (authStore.authenticated) {
    const displayname = route.params.displayname as string;
    console.log("SUB: Current route displayname in beforeMount", displayname);
    if (displayname === authStore.userName) {
      console.log(
        "SUB: Current user detected in beforeMount, loading subscriptions"
      );
      isCurrentUser.value = true;
      loadSubscriptions();
    } else {
      console.log("SUB: Not current user in beforeMount");
      isCurrentUser.value = false;
      isLoading.value = false;
    }
  } else {
    console.log("SUB: User not authenticated in beforeMount");
    isCurrentUser.value = false;
    isLoading.value = false;
  }
});

// Inicjalizacja przy montowaniu komponentu
onMounted(() => {
  console.log("SUB: Component mounted");
  // Unikamy ponownego ładowania, jeśli już wykonano to w onBeforeMount
  if (isLoading.value) {
    const displayname = route.params.displayname as string;
    console.log("SUB: Current route displayname", displayname);
    if (displayname === authStore.userName) {
      console.log("SUB: Current user detected, loading subscriptions");
      isCurrentUser.value = true;
    } else {
      console.log("SUB: Not current user, skipping subscription loading");
      isCurrentUser.value = false;
      isLoading.value = false;
    }
  }
});

// Jeżeli dynamicznie zmieni się route, ponów sprawdzanie
watch(
  () => route.params.displayname,
  (newName) => {
    console.log("SUB: Route displayname changed to", newName);
    isLoading.value = true;
    if (newName === authStore.userName) {
      console.log("SUB: Current user detected after route change");
      isCurrentUser.value = true;
      loadSubscriptions();
    } else {
      console.log("SUB: Not current user after route change");
      isCurrentUser.value = false;
      isLoading.value = false;
    }
  }
);

// Obsługa anulowania subskrypcji
async function handleUnsubscribe(username: string) {
  console.log("SUB: Unsubscribe requested for", username);
  try {
    await subscriptionStore.unsubscribe(username);
    console.log("SUB: Successfully unsubscribed from", username);
  } catch (err) {
    console.error("SUB: Error when unsubscribing:", err);
  }
}
</script>

<template>
  <div class="subscriptions-container">
    <h1 class="title">Moje subskrypcje</h1>

    <div
      v-if="isLoading"
      class="loading"
    >
      <p>Ładowanie subskrypcji...</p>
    </div>

    <div
      v-else-if="!isCurrentUser"
      class="error-message"
    >
      <p>Możesz przeglądać tylko własne subskrypcje.</p>
    </div>

    <div
      v-else-if="subscriptionStore.error"
      class="error-message"
    >
      <p>
        Wystąpił błąd podczas pobierania subskrypcji:
        {{ subscriptionStore.error.message }}
      </p>
    </div>

    <div
      v-else-if="!subscriptionStore.subscribedStreamers.length"
      class="empty-state"
    >
      <p>Nie subskrybujesz jeszcze żadnych streamerów.</p>
      <NuxtLink
        to="/discover"
        class="discover-link"
        >Odkryj streamerów</NuxtLink
      >
    </div>

    <div
      v-else
      class="subscriptions-list"
    >
      <div
        v-for="streamer in subscriptionStore.subscribedStreamers"
        :key="streamer.id"
        class="subscription-card"
      >
        <div class="avatar">
          <img
            v-if="streamer.profilePicture"
            :src="streamer.profilePicture"
            :alt="streamer.username"
          />
          <div
            v-else
            class="fallback-avatar"
          >
            {{ streamer.username.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="info">
          <NuxtLink
            :to="`/user/${streamer.username}`"
            class="username"
          >
            {{ streamer.username }}
          </NuxtLink>
        </div>
        <button
          class="unsubscribe-button"
          @click="handleUnsubscribe(streamer.username)"
        >
          Anuluj subskrypcję
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.subscriptions-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.title {
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: bold;
}
.loading,
.error-message,
.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}
.discover-link {
  display: inline-block;
  margin-top: 10px;
  color: #4a6cf7;
  text-decoration: underline;
}
.subscriptions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.subscription-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
  transition: transform 0.2s ease;
}
.subscription-card:hover {
  transform: translateY(-5px);
}
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 10px;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fallback-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4a6cf7;
  color: white;
  font-size: 24px;
  font-weight: bold;
}
.info {
  text-align: center;
  margin-bottom: 10px;
}
.username {
  font-weight: 600;
  font-size: 18px;
  color: #333;
  text-decoration: none;
}
.username:hover {
  text-decoration: underline;
}
.unsubscribe-button {
  margin-top: 10px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.unsubscribe-button:hover {
  background-color: #ff7875;
}
</style>
