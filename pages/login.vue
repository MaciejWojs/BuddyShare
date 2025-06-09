<template>
  <AuthForm title="Logowanie" submitText="Log in" :errorMessage="errorMessage" @submit="login">
    <template #fields>
      <!-- Sugerowany username -->
      <v-alert v-if="suggestUsername && !usernameSuggested" color="info" variant="tonal" closable
        @close="usernameSuggested = true" class="mb-4">
        <template #prepend><v-icon>mdi-account-outline</v-icon></template>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-2">Użyć poprzedniego użytkownika?</div>
            <div class="text-caption">{{ lastUsername }}</div>
          </div>
          <v-btn text small @click="applyUsernameSuggestion">Użyj</v-btn>
        </div>
      </v-alert>

      <!-- Sugerowany email -->
      <v-alert v-if="suggestEmail && !emailSuggested" color="info" variant="tonal" closable
        @close="emailSuggested = true" class="mb-4">
        <template #prepend><v-icon>mdi-email-outline</v-icon></template>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-2">Użyć poprzedniego emaila?</div>
            <div class="text-caption">{{ lastEmail }}</div>
          </div>
          <v-btn text small @click="applyEmailSuggestion">Użyj</v-btn>
        </div>
      </v-alert>

      <v-text-field label="Username or email" v-model="email"></v-text-field>
      <v-text-field label="Password" type="password" v-model="password" @keydown.enter="login"></v-text-field>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getPasswordHash } from "@/src/utils/crypto/hash";
import StatusCodes from "http-status-codes";
import AuthForm from "@/components/auth/AuthForm.vue";
import * as EmailValidator from 'email-validator';
import { useLocalStorage } from '@vueuse/core';

const authStore = useAuthStore();
const { auth } = useApi();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const config = useRuntimeConfig();

// Email z localStorage
const lastEmail = useLocalStorage('buddyshare-last-email', '');
const lastUsername = useLocalStorage('buddyshare-last-username', '');
const emailSuggested = ref(false);
const usernameSuggested = ref(false);
const isClient = ref(false);

const suggestUsername = computed(() =>
  isClient.value && lastUsername.value && !usernameSuggested.value
);

const suggestEmail = computed(() =>
  isClient.value && lastEmail.value && !emailSuggested.value && !lastUsername.value
);

// Funkcje do zastosowania sugestii
const applyUsernameSuggestion = () => {
  email.value = lastUsername.value;
  usernameSuggested.value = true;
};

const applyEmailSuggestion = () => {
  email.value = lastEmail.value;
  emailSuggested.value = true;
};

const login = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Wypełnij wszystkie pola";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
    return;
  }

  const SALT = config.public.SALT;
  const PEPPER = config.public.PEPPER;
  const HASH = getPasswordHash(password.value, SALT, PEPPER);

  try {
    const { data, error } = await auth.login(email.value, HASH);

    if (error.value) {
      if (error.value.statusCode === StatusCodes.UNAUTHORIZED) {
        const cause = error.value.data?.cause;
        errorMessage.value = cause === "credentials"
          ? "Invalid credentials"
          : "You are banned";
      } else {
        errorMessage.value = "Sorry, something went wrong";
      }

      setTimeout(() => {
        errorMessage.value = "";
      }, 5000);
      console.log("Login failed");
      return;
    }

    if (data.value?.success) {
      console.log("Login successful");

      const isEmail = EmailValidator.validate(email.value);
      if (isEmail) {
        lastEmail.value = email.value;
      } else if (!isEmail) {
        lastUsername.value = email.value;
      }

      await authStore.fetchUser();
      navigateTo("/", { replace: true });
    }
  } catch (err) {
    console.error(err);
    errorMessage.value = "Sorry, something went wrong";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
  }
};

// Auto-sugestia emaila
onMounted(() => {
  isClient.value = true;
});
</script>
