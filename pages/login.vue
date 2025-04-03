<template>
  <AuthForm
    title="Logowanie"
    submitText="Zaloguj się"
    :errorMessage="errorMessage"
    @submit="login"
  >
    <template #fields>
      <v-text-field label="Username or email" v-model="email"></v-text-field>
      <v-text-field 
        label="Hasło" 
        type="password" 
        v-model="password" 
        @keydown.enter="login"
      ></v-text-field>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref } from "vue";
import { getPasswordHash } from "@/src/utils/crypto/hash";
import StatusCodes from "http-status-codes";
import AuthForm from '@/components/auth/AuthForm.vue';

const authStore = useAuthStore();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const config = useRuntimeConfig();

const login = () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Wypełnij wszystkie pola";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
    return;
  }

  const SALT = config.public.SALT;
  const PEPPER = config.public.PEPPER;
  const BACK_HOST = config.public.BACK_HOST;
  const HASH = getPasswordHash(password.value, SALT, PEPPER);

  const dataREQUEST = JSON.stringify({
    username: email.value,
    passwordHash: HASH,
  });

  fetch(`http://${BACK_HOST}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: dataREQUEST,
  })
    .then((response) => {
      const respJSON = response.json();
      console.log(response);
      if (response.status === StatusCodes.OK) {
        return respJSON;
      } else {
        return respJSON.then(data => {
          if (response.status === StatusCodes.UNAUTHORIZED) {
            errorMessage.value = data.cause === "credentials" ?
              "Invalid credentials" : "You are banned";
          } else {
            errorMessage.value = "Sorry, something went wrong";
          }
          setTimeout(() => {
            errorMessage.value = "";
          }, 5000);

          return data;
        });
      }
    })
    .then(async (data) => {
      console.log(data);
      if (data.success) {
        console.log("Login successful");
        await authStore.fetchUser();
        navigateTo("/", { replace: true });
      } else {
        console.log("Login failed");
      }
    })
    .catch((error) => {
      console.error(error);
    });
};
</script>
