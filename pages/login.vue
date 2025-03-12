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
              label="Email"
              v-model="email"
            ></v-text-field>
            <v-text-field
              label="Hasło"
              type="password"
              v-model="password"
            ></v-text-field>
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

import CryptoJS from "crypto-js";

const email = ref("");
const password = ref("");
const config = useRuntimeConfig();

const login = () => {
  // console.log(`Logowanie: ${email.value}`);

  const SALT = config.public.SALT;

  const PEPPER = config.public.PEPPER;

  const PASS = SALT + password.value + PEPPER;

  const BACK_PORT = config.public.BACK_PORT;

  const HASH = CryptoJS.SHA256(PASS).toString(CryptoJS.enc.Hex);

  // console.log(SALT, PEPPER);

  // console.log(`hasło: ${PASS}`);

  console.log(`hash: ${HASH}`);

  const dataREQUEST = JSON.stringify({
    username: email.value,
    reqHASH: HASH,
  });

  // console.log(dataREQUEST);
  fetch("http://localhost:" + BACK_PORT + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: dataREQUEST,
  })
    .then((response) => {
      // console.log(response.json());
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Login failed");
      }
    })
    .then((data) => {
      if (data.success) {
        // Handle successful login
        console.log("Login successful");
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
