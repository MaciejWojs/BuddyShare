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
          <v-card-title class="text-h4">Twoje subskrypcje</v-card-title>

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

          <v-card
            v-else-if="!subscriptions.length"
            class="pa-6 text-center"
            flat
          >
            <v-card-text>
              <p class="text-h6">Brak subskrypcji.</p>
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
              v-for="sub in subscriptions"
              :key="sub.subscriberId"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card
                hover
                class="fill-height d-flex flex-column pa-4"
                color="grey-darken-4"
                border="lg"
              >
                <div class="d-flex justify-center pa-4">
                  <v-avatar size="80">
                    <v-img src="/Buddyshare.svg"></v-img>
                  </v-avatar>
                </div>
                <v-card-title class="text-center">
                  {{ sub.streamerUsername }}
                </v-card-title>
                <v-card-actions class="d-flex flex-column align-center pa-2">
                  <v-btn
                    color="primary"
                    variant="text"
                    :to="`/user/${sub.streamerUsername}`"
                    class="mb-2"
                  >
                    Odwiedź profil
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="outlined"
                    @click="remove(sub.streamerUsername)"
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

<script setup lang="ts">
import { useSubscriptionsStore } from "~/stores/subscriptions";
import { onMounted, ref } from "vue";

const store = useSubscriptionsStore();
const subscriptions = computed(() => store.subscriptions);
const isLoading = ref(false);

const remove = async (username: string) => {
  await store.removeSubscription(username);
};
</script>

<style scoped>
/* Style zarządzane przez Vuetify */
</style>
