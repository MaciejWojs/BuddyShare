<template>
  <AuthForm title="Rejestracja" submitText="Zarejestruj się" :errorMessage="errorMessage" @submit="register">
    <template #fields>
      <v-text-field label="Username" v-model="username"></v-text-field>
      <v-text-field label="Email" v-model="email"></v-text-field>
      <v-text-field label="Hasło" type="password" v-model="password"></v-text-field>
      <v-text-field label="Powtórz hasło" type="password" v-model="confirmPassword"
        @keydown.enter="register"></v-text-field>
    </template>
  </AuthForm>
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
const { auth } = useApi();

const clearErrorMessage = () => {
  setTimeout(() => {
    errorMessage.value = "";
  }, 5000);
};

const register = async () => {
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

  try {
    const { data, error } = await auth.register(
      username.value,
      email.value,
      password.value
    );

    if (error.value) {
      // Handle different error types
      if (error.value.statusCode === StatusCodes.CONFLICT) {
        const cause = error.value.data?.cause;
        const whatsWrong = cause === "username" ? "podanej nazwie" : "podanym emailu";
        errorMessage.value = `Użytkownik o ${whatsWrong} już istnieje`;
      } else if (error.value.statusCode === StatusCodes.BAD_REQUEST) {
        errorMessage.value = "Błąd rejestracji";
      } else {
        errorMessage.value = "Błąd serwera";
      }

      // Clear error message after timeout
      clearErrorMessage();
      console.log("Registration failed");
      return;
    }

    if (data.value?.success) {
      // Handle successful registration
      console.log("Registration successful");
      navigateTo("/login", { replace: true });
    } else {
      // Handle registration failure
      console.log("Registration failed");
      errorMessage.value = "Błąd rejestracji";
      clearErrorMessage();
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "Błąd serwera";
    clearErrorMessage();
  }
};
</script>
