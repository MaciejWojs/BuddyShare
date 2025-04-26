<template>
  <v-card
    class="setting-item mb-3"
    :color="background"
    :class="{ saving: isSaving }"
    flat
  >
    <v-card-text class="d-flex align-center justify-space-between">
      <div>
        <div class="d-flex align-center">
          <v-icon
            v-if="icon"
            :icon="icon"
            class="mr-3"
            :color="iconColor"
          />
          <h3 class="text-subtitle-1 font-weight-medium">{{ title }}</h3>
        </div>
        <p
          v-if="description"
          class="text-caption text-medium-emphasis mt-1"
        >
          {{ description }}
        </p>
      </div>

      <!-- Main control element -->
      <div class="setting-control">
        <v-switch
          v-if="type === 'switch'"
          v-model="localValue"
          :disabled="isDisabled || isSaving"
          hide-details
          density="compact"
          color="primary"
        />

        <v-select
          v-else-if="type === 'select'"
          v-model="localValue"
          :items="options"
          :disabled="isDisabled || isSaving"
          hide-details
          density="compact"
          variant="outlined"
          bg-color="grey-darken-3"
          class="setting-select"
        />

        <v-text-field
          v-else-if="type === 'text'"
          v-model="localValue"
          :disabled="isDisabled || isSaving"
          hide-details
          density="compact"
          variant="outlined"
          bg-color="grey-darken-3"
          class="setting-input"
        />

        <div
          v-else-if="type === 'streamKey'"
          class="d-flex align-center"
        >
          <v-text-field
            :model-value="maskedValue"
            readonly
            hide-details
            density="compact"
            variant="outlined"
            bg-color="grey-darken-3"
            class="setting-input stream-key-input mr-2"
            :type="showValue ? 'text' : 'password'"
            :append-icon="showValue ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="toggleShowValue"
          />
          <v-btn
            icon="mdi-content-copy"
            variant="text"
            density="comfortable"
            class="mr-2"
            @click="copyValue"
            :title="copySuccess ? 'Skopiowano!' : 'Kopiuj do schowka'"
            :color="copySuccess ? 'success' : ''"
          />
          <v-btn
            icon="mdi-refresh"
            variant="tonal"
            color="error"
            density="comfortable"
            @click="$emit('reset')"
            :loading="loading || isSaving"
            :title="'Resetuj klucz'"
          />
        </div>

        <v-btn
          v-else-if="type === 'button'"
          @click="$emit('click')"
          :loading="loading || isSaving"
          :disabled="isDisabled"
          :color="buttonColor"
          :variant="buttonVariant"
          >{{ buttonText || title }}</v-btn
        >
      </div>
    </v-card-text>

    <!-- Saving/status indicator -->
    <div
      v-if="showStatus"
      class="status-indicator px-4 py-1"
      :class="statusClass"
    >
      <v-icon
        v-if="isSaved"
        icon="mdi-check-circle"
        size="small"
        class="mr-1"
      />
      <v-icon
        v-if="hasError"
        icon="mdi-alert-circle"
        size="small"
        class="mr-1"
      />
      <v-progress-circular
        v-if="isSaving"
        indeterminate
        size="16"
        width="2"
        class="mr-1"
      />
      <span class="text-caption">{{ statusMessage }}</span>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useNuxtData } from "#app";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "switch",
    validator: (value: string) =>
      ["switch", "select", "text", "button", "streamKey"].includes(value),
  },
  modelValue: {
    type: [Boolean, String, Number, Array],
    default: false,
  },
  options: {
    type: Array,
    default: () => [],
  },
  icon: {
    type: String,
    default: "",
  },
  iconColor: {
    type: String,
    default: "primary",
  },
  background: {
    type: String,
    default: "grey-darken-4",
  },
  settingId: {
    type: String,
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: "",
  },
  buttonColor: {
    type: String,
    default: "primary",
  },
  buttonVariant: {
    type: String,
    default: "tonal",
  },
  saveDelay: {
    type: Number,
    default: 500, // delay in ms before saving
  },
  apiEndpoint: {
    type: String,
    default: "/api/settings",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "save:success",
  "save:error",
  "click",
  "reset",
]);

// Local copy of value
const localValue = ref(props.modelValue);

// Component state
const isSaving = ref(false);
const isSaved = ref(false);
const hasError = ref(false);
const errorMessage = ref("");
const saveTimeout = ref<NodeJS.Timeout | null>(null);
const showValue = ref(false);
const copySuccess = ref(false);

// Get access to Nuxt data for optimistic updates
const { data: userSettings } = useNuxtData("userSettings");

// Monitor model changes
watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  }
);

// Computed properties for status
const showStatus = computed(
  () => isSaving.value || isSaved.value || hasError.value
);
const statusClass = computed(() => ({
  "status-saving": isSaving.value,
  "status-saved": isSaved.value,
  "status-error": hasError.value,
}));
const statusMessage = computed(() => {
  if (isSaving.value) return "Saving...";
  if (hasError.value) return errorMessage.value || "An error occurred";
  if (isSaved.value) return "Saved";
  return "";
});

const maskedValue = computed(() =>
  showValue.value ? localValue.value : "********"
);

// React to local value changes
watch(localValue, async (newValue) => {
  // Emit change for parent communication
  emit("update:modelValue", newValue);

  // Optimistic update
  if (userSettings.value) {
    userSettings.value = {
      ...userSettings.value,
      [props.settingId]: newValue,
    };
  }

  // Reset statuses
  isSaved.value = false;
  hasError.value = false;

  // Cancel previous timeout if exists
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  // Set new timeout to save changes
  saveTimeout.value = setTimeout(async () => {
    await saveSetting(newValue);
  }, props.saveDelay);
});

// Function to save settings
const saveSetting = async (value: any) => {
  isSaving.value = true;

  try {
    // Create data object to send
    const data = {
      settingId: props.settingId,
      value: value,
    };

    // API call - using useFetch from nuxt
    const { data: response, error } = await useFetch(props.apiEndpoint, {
      method: "POST",
      body: data,
      // Not using await because we're using optimistic update
    });

    if (error.value) {
      throw new Error(error.value.message || "Failed to save setting");
    }

    // Success - set saved flag
    isSaving.value = false;
    isSaved.value = true;
    emit("save:success", {
      settingId: props.settingId,
      value,
      response: response.value,
    });

    // After 3 seconds hide success message
    setTimeout(() => {
      isSaved.value = false;
    }, 3000);
  } catch (err: any) {
    // Error - set error flag
    isSaving.value = false;
    hasError.value = true;
    errorMessage.value = err.message || "Failed to save setting";
    emit("save:error", { settingId: props.settingId, value, error: err });

    // After 5 seconds hide error message
    setTimeout(() => {
      hasError.value = false;
    }, 5000);
  }
};

// Function to toggle visibility of stream key
const toggleShowValue = () => {
  showValue.value = !showValue.value;
};

// Function to copy stream key to clipboard
const copyValue = async () => {
  try {
    await navigator.clipboard.writeText(localValue.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy value:", err);
  }
};
</script>

<style lang="scss" scoped>
.setting-item {
  transition: all 0.3s ease;

  &.saving {
    opacity: 0.8;
  }

  .setting-control {
    min-width: 100px;

    .setting-select,
    .setting-input {
      max-width: 200px;
    }

    .stream-key-input {
      max-width: 300px;
    }
  }

  .status-indicator {
    display: flex;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.75rem;

    &.status-saving {
      color: var(--v-primary-base);
    }

    &.status-saved {
      color: var(--v-success-base);
    }

    &.status-error {
      color: var(--v-error-base);
    }
  }
}
</style>
