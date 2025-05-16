<!-- app/error.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// Deklarujemy, że ta strona ma layout "default"
definePageMeta({ layout: 'default' })

// Odbieramy błąd jako props (to jest mechanizm Nuxt)
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}>()

// Potem tworzymy computedy
const statusCode = computed(() => props.error.statusCode ?? 500)
const statusMessage = computed(() => props.error.statusMessage ?? props.error.message ?? 'An unexpected error occurred')

const displayTitle = computed(() => {
  switch (statusCode.value) {
    case 400: return 'Bad Request'
    case 403: return 'Access Denied'
    case 404: return 'Page Not Found'
    case 500: return 'Server Error'
    default:  return 'Error'
  }
})
</script>

<template>
  <NuxtLayout>
    <v-container class="py-10">
      <v-empty-state
        headline="Whoops :("
        :title="`${displayTitle} (${statusCode})`"
        :text="statusMessage"
        image="/Buddyshare.svg"
        variant="elevated"
        class="mx-auto my-10"
        style="max-width: 600px"
      />
      <div class="text-center">
        <v-btn to="/" color="primary" class="mt-4">
          Go back home
        </v-btn>
      </div>
    </v-container>
  </NuxtLayout>
</template>
