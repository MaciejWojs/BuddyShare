<script setup lang="ts">
import type { NuxtError } from "#app";

// definePageMeta nie działa w error.vue, więc usuwamy to wywołanie
// i używamy bezpośrednio definicji layoutu

// Właściwości komponentu
const props = defineProps({
  error: Object as () => NuxtError,
});

// Ustawiamy layout bezpośrednio dla tego komponentu
const layout = 'default';

// Create computed property to get appropriate error message
const errorMessage = computed(() => {
  if (!props.error) return "An unknown error occurred";

  switch (props.error.statusCode) {
    case 403:
      return "You don't have permission to access this resource";
    case 404:
      return "The page you were looking for does not exist";
    case 500:
      return "Server error occurred, please try again later";
    case 502:
    case 503:
      return "Service temporarily unavailable";
    default:
      return props.error.message || "An error occurred";
  }
});
</script>

<template>
  <NuxtLayout :name="layout">
    <v-container class="py-10">
      <v-empty-state
        :headline="`Whoops :(`"
        :title="`${props.error?.message || 'Something went wrong'}`"
        :text="errorMessage"
        image="/Buddyshare.svg"
        variant="elevated"
        class="mx-auto my-10"
        style="max-width: 600px"
      ></v-empty-state>
      <div class="text-center">
        <v-btn
          to="/"
          color="primary"
          class="mt-4"
          >Go back home</v-btn
        >
      </div>
    </v-container>
  </NuxtLayout>
</template>
