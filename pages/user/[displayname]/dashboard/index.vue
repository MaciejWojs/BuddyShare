<template>
  <div class="dashboard">
    <h1 class="text-h4 mb-6">Dashboard</h1>
    <p>Witaj w swoim dashboardzie, {{ displayName }}!</p>

    <v-divider class="my-4"></v-divider>

    <section class="stream-stats-section">
      <h2 class="text-h5 mb-4">Statystyki streama</h2>
      <v-row>
        <v-col cols="12" md="8">
          <!-- Wykres statystyk -->
          <ViewerChart :streamerName="displayName"/>
        </v-col>
      </v-row>
    </section>

    <v-divider class="my-4"></v-divider>

    <section>
      <h2 class="text-h5 mb-4">Szybkie akcje</h2>
      <v-row>
        <v-col cols="12" md="4">
          <v-btn block color="primary" :to="`/user/${displayName}/dashboard/stream`">
            Ustawienia streama
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn block color="secondary" :to="`/user/${displayName}/settings`">
            Ustawienia konta
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn block color="info" :to="`/user/${displayName}`">
            Przejdź do kanału
          </v-btn>
        </v-col>
      </v-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useStreamsStore } from '~/stores/streams';

const route = useRoute();
const displayName = route.params.displayname;
const streamsStore = useStreamsStore();

</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

section {
  margin-bottom: 2rem;
}
</style>