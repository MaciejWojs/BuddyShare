<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Rejestracja</v-card-title>
          <v-card-text>
            <v-text-field label="Imię" v-model="firstName"></v-text-field>
            <v-text-field label="Nazwisko" v-model="lastName"></v-text-field>
            <v-text-field label="Email" v-model="email"></v-text-field>
            <v-text-field label="Hasło" type="password" v-model="password"></v-text-field>
            <v-text-field label="Powtórz hasło" type="password" v-model="confirmPassword"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="register">Zarejestruj się</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const register = () => {
  console.log(`Rejestracja: ${firstName.value} ${lastName.value} (${email.value})`);
};
</script>