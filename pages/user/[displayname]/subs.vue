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

    const response = await subscriptionStore.fetchSubscriptions();

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
  <v-container
    class="py-6"
    fluid
  >
    <v-row justify="center">
      <v-col
        cols="12"
        md="10"
        lg="8"
      >
        <v-card
          elevation="2"
          class="pa-6"
        >
          <v-card-title class="text-h4"> Moje subskrypcje </v-card-title>

          <v-divider class="my-4"></v-divider>

          <div
            v-if="isLoading"
            class="text-center pa-8"
          >
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
            <div class="mt-4">Ładowanie subskrypcji...</div>
          </div>

          <v-alert
            v-else-if="!isCurrentUser"
            type="warning"
            class="mt-4"
          >
            Możesz przeglądać tylko własne subskrypcje.
          </v-alert>

          <v-alert
            v-else-if="subscriptionStore.error"
            type="error"
            class="mt-4"
          >
            Wystąpił błąd podczas pobierania subskrypcji:
            {{ subscriptionStore.error.message }}
          </v-alert>

          <v-card
            v-else-if="!subscriptionStore.subscribedStreamers.length"
            class="pa-6 text-center"
            flat
          >
            <v-card-text>
              <p class="text-h6">
                Nie subskrybujesz jeszcze żadnych streamerów.
              </p>
              <v-btn
                class="mt-4"
                color="primary"
                to="/discover"
              >
                Odkryj streamerów
              </v-btn>
            </v-card-text>
          </v-card>

          <v-row v-else>
            <v-col
              v-for="streamer in subscriptionStore.subscribedStreamers"
              :key="streamer.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                hover
                class="fill-height d-flex flex-column"
              >
                <div class="d-flex justify-center pa-4">
                  <v-avatar size="80">
                    <v-img
                      v-if="streamer.profilePicture"
                      :src="streamer.profilePicture"
                      :alt="streamer.username"
                    ></v-img>
                    <v-avatar
                      v-else
                      color="primary"
                      size="80"
                    >
                      {{ streamer.username.charAt(0).toUpperCase() }}
                    </v-avatar>
                  </v-avatar>
                </div>
                <v-card-title class="justify-center">
                  {{ streamer.username }}
                </v-card-title>
                <v-card-actions class="justify-center">
                  <v-btn
                    color="primary"
                    variant="text"
                    :to="`/user/${streamer.username}`"
                  >
                    Odwiedź profil
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="outlined"
                    @click="handleUnsubscribe(streamer.username)"
                  >
                    Anuluj subskrypcję
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Style zarządzane przez Vuetify */
</style>
