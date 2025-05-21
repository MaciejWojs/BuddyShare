<template>
  <v-container class="py-6" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card elevation="2" class="pa-6">
          <v-card-title class="text-h4">
            Dashboard
          </v-card-title>
          <v-card-subtitle class="mb-4">
            Witaj w swoim dashboardzie, <strong>{{ displayName }}</strong>!
          </v-card-subtitle>

          <v-divider class="my-4"></v-divider>

          <section class="mb-8">
            <v-card-title class="text-h5 mb-4">Statystyki streama</v-card-title>
            <LazyChartViewers :streamerName="displayName" />
          </section>

          <v-divider class="my-4"></v-divider>
          <section class="mb-8">
            <LazyChartSubsribers :streamerName="displayName" />
          </section>

          <v-divider class="my-4"></v-divider>
          <section class="mb-8">
            <LazyChartFollowers :streamerName="displayName" />
          </section>
          
          <v-divider class="my-4"></v-divider>
          <section class="mb-8">
            <LazyChartMessages :streamerName="displayName" />
          </section>
        
          <v-divider class="my-4"></v-divider>
          <section class="mb-8">
            <LazyChartTopChatters :streamerName="displayName" />
          </section>

          <v-divider class="my-4"></v-divider>

          <section>
            <v-card-title class="text-h5 mb-4">Szybkie akcje</v-card-title>
            <v-row dense>
              <v-col cols="12" sm="6" md="4">
                <v-card hover class="fill-height d-flex flex-column">
                  <v-card-title>
                    <v-icon left>mdi-video</v-icon>
                    Ustawienia streama
                  </v-card-title>
                  <v-card-text class="flex-grow-1">
                    Zarządzaj ustawieniami swojego streama.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn block color="primary" outlined :to="`/user/${displayName}/dashboard/stream`">
                      Przejdź
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-card hover class="fill-height d-flex flex-column">
                  <v-card-title>
                    <v-icon left>mdi-cog</v-icon>
                    Ustawienia konta
                  </v-card-title>
                  <v-card-text class="flex-grow-1">
                    Dostosuj ustawienia swojego konta.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn block color="secondary" outlined :to="`/user/${displayName}/settings`">
                      Przejdź
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-card hover class="fill-height d-flex flex-column">
                  <v-card-title>
                    <v-icon left>mdi-account</v-icon>
                    Przejdź do kanału
                  </v-card-title>
                  <v-card-text class="flex-grow-1">
                    Zobacz swój publiczny profil kanału.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn block color="info" outlined :to="`/user/${displayName}`">
                      Przejdź
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </section>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ChartViewers } from '#components';
import { useRoute } from 'vue-router';
import Messages from '~/components/Chart/Messages.vue';
import { useStreamsStore } from '~/stores/streams';

const route = useRoute();
const displayName = route.params.displayname;
const streamsStore = useStreamsStore();
const ws = usePublicWebSocket();

const streamData = computed(() => streamsStore.getStreamByStreamerName(displayName));

let previousOptionsId: string | undefined;

watch(streamData, (newStreamData) => {
  const newId = newStreamData?.options_id?.toString();
  if (newId === previousOptionsId) return;
  if (previousOptionsId) {
    ws.leaveStream(previousOptionsId);
  }
  if (newStreamData && newStreamData.isLive && newId) {
    ws.joinStream(newId, true);
  }
  previousOptionsId = newId;
}, { immediate: true });
</script>

<style scoped>
/* Styl jest teraz w dużej mierze przejęty przez Vuetify */
</style>
