<!-- layouts/default.vue -->
<template>
    <v-app>
      <!-- Górny pasek -->
    <v-app-bar app flat dark>
      <!-- Ikona/hamburger w razie potrzeby -->
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <!-- Logo BuddyShare -->
      <v-toolbar-title class="text-h6 text-uppercase ml-2">
        <!-- <v-img
        src="/buddyshare-logo.svg"
        max-width="30"
        class="mr-2"
        alt="BuddyShare Logo"
        /> -->
        BuddyShare
      </v-toolbar-title>
      <v-spacer />
      <!-- Linki w topbarze, np. do logowania -->
      <v-btn variant="text" to="/register" class="text-white mr-2">
        Zarejestruj
      </v-btn>
      <v-btn variant="text" to="/login" class="text-white">
        Zaloguj
      </v-btn>
    </v-app-bar>
  
      <!-- Boczne menu (opcjonalnie) -->
      <v-navigation-drawer v-model="drawer" app dark>
        <v-list>
          <v-list-item to="/">
            <v-list-item-title>Strona główna</v-list-item-title>
          </v-list-item>
          <v-list-item to="/login">
            <v-list-item-title>Logowanie</v-list-item-title>
          </v-list-item>
          <v-list-item to="/register">
            <v-list-item-title>Rejestracja</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
  
      <!-- Główna sekcja strony -->
      <v-main>
        <v-container fluid class="pa-0">
          <slot />
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  const drawer = ref(false)
  </script>
  
  <style scoped>
  /* Drobna korekta stylów, np. */
  .v-application {
    background-color: #0d0d0d !important;
    color: #fff !important;
  }
  </style>
  