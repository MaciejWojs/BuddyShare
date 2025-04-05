<!-- components/auth/AuthForm.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>{{ title }}</v-card-title>
          <v-card-text>
            <slot name="fields"></slot>
            
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
            <v-btn @click="$emit('submit')">{{ submitText }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
  submitText: { type: String, required: true },
  errorMessage: { type: String, default: '' }
});

defineEmits(['submit']);
</script>