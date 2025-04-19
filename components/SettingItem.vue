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

      <!-- Główny element sterujący -->
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

        <v-btn
          v-else-if="type === 'button'"
          @click="$emit('click')"
          :loading="isSaving"
          :disabled="isDisabled"
          :color="buttonColor"
          :variant="buttonVariant"
          >{{ buttonText || title }}</v-btn
        >
      </div>
    </v-card-text>

    <!-- Wskaźnik zapisywania/stanu -->
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
      ["switch", "select", "text", "button"].includes(value),
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
    default: 500, // ms opóźnienia przed zapisem
  },
  apiEndpoint: {
    type: String,
    default: "/api/settings",
  },
});

const emit = defineEmits([
  "update:modelValue",
  "save:success",
  "save:error",
  "click",
]);

// Lokalna kopia wartości
const localValue = ref(props.modelValue);

// Stan komponentu
const isSaving = ref(false);
const isSaved = ref(false);
const hasError = ref(false);
const errorMessage = ref("");
const saveTimeout = ref<NodeJS.Timeout | null>(null);

// Uzyskaj dostęp do danych Nuxt dla optymistycznych aktualizacji
const { data: userSettings } = useNuxtData("userSettings");

// Monitorowanie zmian modelu
watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  }
);

// Computed properties dla statusu
const showStatus = computed(
  () => isSaving.value || isSaved.value || hasError.value
);
const statusClass = computed(() => ({
  "status-saving": isSaving.value,
  "status-saved": isSaved.value,
  "status-error": hasError.value,
}));
const statusMessage = computed(() => {
  if (isSaving.value) return "Zapisywanie...";
  if (hasError.value) return errorMessage.value || "Wystąpił błąd";
  if (isSaved.value) return "Zapisano";
  return "";
});

// Reaguj na zmiany lokalnej wartości
watch(localValue, async (newValue) => {
  // Emituj zmianę dla komunikacji z rodzicami
  emit("update:modelValue", newValue);

  // Optymistyczna aktualizacja
  if (userSettings.value) {
    userSettings.value = {
      ...userSettings.value,
      [props.settingId]: newValue,
    };
  }

  // Resetuj statusy
  isSaved.value = false;
  hasError.value = false;

  // Anuluj poprzedni timeout jeśli istnieje
  if (saveTimeout.value) {
    clearTimeout(saveTimeout.value);
  }

  // Ustaw nowy timeout do zapisania zmian
  saveTimeout.value = setTimeout(async () => {
    await saveSetting(newValue);
  }, props.saveDelay);
});

// Funkcja do zapisywania ustawień
const saveSetting = async (value: any) => {
  isSaving.value = true;

  try {
    // Tworzenie obiektu danych do wysłania
    const data = {
      settingId: props.settingId,
      value: value,
    };

    // API call - używamy useFetch z nuxt
    const { data: response, error } = await useFetch(props.apiEndpoint, {
      method: "POST",
      body: data,
      // Nie używamy awaita ponieważ używamy optymistycznej aktualizacji
    });

    if (error.value) {
      throw new Error(
        error.value.message || "Nie udało się zapisać ustawienia"
      );
    }

    // Sukces - ustaw flagę zapisano
    isSaving.value = false;
    isSaved.value = true;
    emit("save:success", {
      settingId: props.settingId,
      value,
      response: response.value,
    });

    // Po 3 sekundach ukryj komunikat o sukcesie
    setTimeout(() => {
      isSaved.value = false;
    }, 3000);
  } catch (err: any) {
    // Błąd - ustaw flagę błędu
    isSaving.value = false;
    hasError.value = true;
    errorMessage.value = err.message || "Nie udało się zapisać ustawienia";
    emit("save:error", { settingId: props.settingId, value, error: err });

    // Po 5 sekundach ukryj komunikat o błędzie
    setTimeout(() => {
      hasError.value = false;
    }, 5000);
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
