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
              label="Username"
              v-model="username"
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
              @keydown.enter="register"
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
import StatusCodes from "http-status-codes";
import * as EmailValidator from "email-validator";

//TODO weryfikacja emaila
//TODO weryfikacja hasła (długość, wielkie litery, cyfry)
//TODO weryfikacja username (obrazliwe słowa)

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const config = useRuntimeConfig();

const clearErrorMessage = () => {
  setTimeout(() => {
    errorMessage.value = "";
  }, 5000);
};

const register = () => {
  if (
    !username.value ||
    !email.value ||
    !password.value ||
    !confirmPassword.value
  ) {
    errorMessage.value = "Wypełnij wszystkie pola";
    clearErrorMessage();
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Hasła nie są zgodne";
    clearErrorMessage();
    return;
  }

  if (!EmailValidator.validate(email.value)) {
    errorMessage.value = "Niepoprawny email";
    clearErrorMessage();
    return;
  }

  // Environment variables
  const BACK_HOST = config.public.BACK_HOST;

  const dataREQUEST = JSON.stringify({
    username: username.value,
    email: email.value,
    // reqHASH: HASH,
    password: password.value,
  });

  // console.log(dataREQUEST);

  fetch(`http://${BACK_HOST}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: dataREQUEST,
  })
    .then(async (response) => {
      if (response.status === StatusCodes.OK) {
        return response.json();
      } else {
        const respJSON = await response.json();
        // Handle different error types
        if (response.status === StatusCodes.CONFLICT) {
          console.log(" response.statusText", response.statusText);
          console.log("respJSON", respJSON["cause"]);
          const whatsWrong =
            respJSON["cause"] === "username"
              ? "podanej nazwie"
              : "podanym emailu";
          errorMessage.value = `Użytkownik o ${whatsWrong} już istnieje`;
        } else if (response.status === StatusCodes.BAD_REQUEST) {
          errorMessage.value = "Błąd rejestracji";
        } else {
          errorMessage.value = "Błąd serwera";
        }

        // Clear error message after timeout
        clearErrorMessage();

        return respJSON;
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
