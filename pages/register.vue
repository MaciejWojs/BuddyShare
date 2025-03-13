<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="12"
        md="4"
      >
        <v-card>
          <v-card-title>Rejestracja</v-card-title>
          <v-card-text>
            <v-text-field
              label="Nickname"
              v-model="nickname"
            ></v-text-field>
            <v-text-field
              label="Email"
              v-model="email"
            ></v-text-field>
            <v-text-field
              label="Hasło"
              type="password"
              v-model="password"
            ></v-text-field>
            <v-text-field
              label="Powtórz hasło"
              type="password"
              v-model="confirmPassword"
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
            <v-btn @click="register">Zarejestruj się</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import CryptoJS from "crypto-js";
import StatusCodes from "http-status-codes";

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const config = useRuntimeConfig();

const register = () => {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Hasła nie są zgodne";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5000);
    return;
  }

  // Environment variables
  const SALT = config.public.SALT;
  const PEPPER = config.public.PEPPER;
  const BACK_PORT = config.public.BACK_PORT;

  // const PASS = SALT + password.value + PEPPER;
  // const HASH = CryptoJS.SHA256(PASS).toString(CryptoJS.enc.Hex);

  const dataREQUEST = JSON.stringify({
    username: username.value,
    email: email.value,
    // reqHASH: HASH,
    password: password.value,
  });

  // console.log(dataREQUEST);

  fetch("http://localhost:" + BACK_PORT + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: dataREQUEST,
  })
    .then((response) => {
      if (response.status === StatusCodes.OK) {
        return response.json();
      } else if (response.status === StatusCodes.BAD_REQUEST) {
        errorMessage.value = "Błąd rejestracji";
        setTimeout(() => {
          errorMessage.value = "";
        }, 5000);
        return response.json();
      }
    })
    .then((data) => {
      if (data.success) {
        // Handle successful registration
        console.log("Registration successful");
        navigateTo("/login", { replace: true });
      } else {
        // Handle registration failure
        console.log("Registration failed");
      }
    })
    .catch((error) => {
      console.error(error);
    });
};
</script>
