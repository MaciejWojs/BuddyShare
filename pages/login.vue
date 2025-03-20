<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title>Logowanie</v-card-title>
          <v-card-text>
            <v-text-field
              label="Username or email"
              v-model="email"
            ></v-text-field>
            <v-text-field
              label="Hasło"
              type="password"
              v-model="password"
              @keydown.enter="login"
            ></v-text-field>

            <!-- Wyświetlanie komunikatu o błędzie -->
            <v-alert
              v-if="errorMessage"
              type="error"
              dismissible
            >
              {{ errorMessage }}
            </v-alert>
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
import { ref } from "vue";
import { getPasswordHash } from "@/src/utils/crypto/hash";
import StatusCodes from "http-status-codes";

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
  // console.log(`Logowanie: ${email.value}`);

  // Environment variables
  const SALT = config.public.SALT;
  const PEPPER = config.public.PEPPER;
  const BACK_HOST = config.public.BACK_HOST;

  // const PASS = SALT + password.value + PEPPER;
  // const HASH = CryptoJS.SHA256(PASS).toString(CryptoJS.enc.Hex);
  const HASH = getPasswordHash(password.value, SALT, PEPPER);

  // console.log(SALT, PEPPER);
  // console.log(`hasło: ${PASS}`);
  // console.log(`hash: ${HASH}`);

  const dataREQUEST = JSON.stringify({
    username: email.value,
    reqHASH: HASH,
  });

  // console.log(dataREQUEST);
  fetch(`http://${BACK_HOST}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: dataREQUEST,
  })
    .then((response) => {
      console.log(response);
      if (response.status === StatusCodes.OK) {
        return response.json();
      } else if (response.status === StatusCodes.UNAUTHORIZED) {
        errorMessage.value = "Błąd logowania";
        setTimeout(() => {
          errorMessage.value = "";
        }, 5000);
        return response.json();
      }
    })
    .then(async (data) => {
      console.log(data);
      if (data.success) {
        // Handle successful login
        console.log("Login successful");
        await authStore.fetchUser();
        navigateTo("/", { replace: true });
      } else {
        // Handle login failure
        console.log("Login failed");
      }
    })
    .catch((error) => {
      console.error(error);
    });
};
</script>
