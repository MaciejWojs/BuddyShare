<script setup lang="ts">
import type { NuxtError } from "#app";

definePageMeta({
  layout: "default",
});

const { error } = defineProps({
  error: Object as () => NuxtError,
});

// Create computed property to get appropriate error message
const errorMessage = computed(() => {
  if (!error) return "An unknown error occurred";

  switch (error.statusCode) {
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
      return error.message || "An error occurred";
  }
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <v-container class="py-10">
      <v-empty-state
        :headline="`Whoops :(`"
        :title="`${error?.message || 'Something went wrong'}`"
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
