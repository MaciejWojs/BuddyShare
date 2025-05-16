<template>
  <AuthForm title="Logowanie" submitText="Log in" :errorMessage="errorMessage" @submit="login">
    <template #fields>
      <v-text-field label="Username or email" v-model="email"></v-text-field>
      <v-text-field label="Password" type="password" v-model="password" @keydown.enter="login"></v-text-field>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref } from "vue";
import { getPasswordHash } from "@/src/utils/crypto/hash";
import StatusCodes from "http-status-codes";
import AuthForm from "@/components/auth/AuthForm.vue";

const authStore = useAuthStore();
const { auth } = useApi();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const config = useRuntimeConfig();

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
</script>
