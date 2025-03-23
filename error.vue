<script setup lang="ts">
import type { NuxtError } from "#app";

definePageMeta({
  layout: "default",
});

const { error } = defineProps({
  error: Object as () => NuxtError,
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <v-container class="py-10">
      <v-empty-state
        :headline="`Whoops, ${error?.statusCode} :(`"
        :title="`${error?.message}`"
        text="The page you were looking for does not exist"
        image="/Buddyshare.svg"
        variant="elevated"
        class="mx-auto my-10"
        style="max-width: 600px"
      ></v-empty-state>
    </v-container>
    <!-- <NuxtLink to="/">Go back home</NuxtLink> -->
  </NuxtLayout>
</template>
