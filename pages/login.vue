<template>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Logowanie</v-card-title>
            <v-card-text>
              <v-text-field label="Email" v-model="email"></v-text-field>
              <v-text-field label="Hasło" type="password" v-model="password"></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="login">Zaloguj się</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const email = ref('');
  const password = ref('');
  
  const login = () => {
    console.log(`Logowanie: ${email.value}`);
  };
  </script>
  