<script setup lang="ts">
// definePageMeta({
// const authStore = useAuthStore();
// });
const authStore = useAuthStore();
</script>
<template>
  <v-container>
    <v-row>
      <v-col
        v-for="n in 6"
        :key="n"
        cols="12"
        md="3"
      >
        <div v-if="authStore.isAuthenticated">
          <h1>Witaj, {{ authStore.user?.displayName }}!</h1>
          <button @click="authStore.logout">Wyloguj</button>
        </div>
        <v-card>
          <!-- <v-img src="/placeholder.png" height="150px"></v-img> -->
          <v-card-title>Popularne Video</v-card-title>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
