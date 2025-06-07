<template>
  <AuthForm title="Rejestracja" submitText="Zarejestruj się" :errorMessage="errorMessage" @submit="register">
    <template #fields>
      <!-- Sugerowany email -->
      <v-alert v-if="suggestLastEmail && !emailSuggested" color="info" variant="tonal" closable
        @close="emailSuggested = true" class="mb-4">
        <template #prepend><v-icon>mdi-email-outline</v-icon></template>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-2">Użyć poprzedniego emaila?</div>
            <div class="text-caption">{{ lastEmail }}</div>
          </div>
          <v-btn text small @click="applySuggestion">Użyj</v-btn>
        </div>
      </v-alert>

      <v-form ref="formRef" lazy-validation>
        <v-text-field v-for="(field, index) in fields" :key="`field-${index}`" v-model="form[field.model]"
          :label="field.label" :type="typeof field.type === 'function' ? field.type() : field.type"
          :clearable="field.clearable" :counter="field.counter" :maxlength="field.maxlength"
          :prepend-inner-icon="field.icon"
          :append-inner-icon="typeof field.appendIcon === 'function' ? field.appendIcon() : field.appendIcon"
          :error-messages="touched[field.model] ? [errors[field.model]].filter(Boolean) : []"
          @focus="touched[field.model] = true" @mousedown.prevent:append-inner="field.toggle?.()"
          @update:model-value="field.validate?.()" />

        <!-- Wskaźnik siły hasła -->
        <div v-if="form.password" class="password-strength-container">
          <v-progress-linear :model-value="strength.score" :max="4" :color="strength.color" height="6" rounded />
          <div class="password-feedback">
            <v-chip :color="strength.color" small flat>{{ strength.text }}</v-chip>
            <span class="text-caption">{{ strength.feedback }}</span>
          </div>
        </div>
      </v-form>
    </template>
  </AuthForm>
</template>

<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import StatusCodes from 'http-status-codes';
import * as EmailValidator from 'email-validator';
import zxcvbn from 'zxcvbn';
import { useToggle, useClipboard, useLocalStorage, watchDebounced, useTimeoutFn } from '@vueuse/core';
import { useApi } from '@/composables/useApi';

const router = useRouter();
const { auth } = useApi();
const { copy, isSupported } = useClipboard();
const [showPwd, togglePwd] = useToggle(false);

// Ref do formularza
const formRef = ref(null);

// Stan formularza
const form = reactive({ username: '', email: '', password: '', confirm: '' });
const errors = reactive({ username: '', email: '', password: '', confirm: '' });
const touched = reactive({ username: false, email: false, password: false, confirm: false });
const errorMessage = ref('');

// Email z localStorage
const lastEmail = useLocalStorage('buddyshare-last-email', '');
const emailSuggested = ref(false);
const isClient = ref(false);
const suggestLastEmail = computed(() =>
  isClient.value && lastEmail.value && EmailValidator.validate(lastEmail.value) && !emailSuggested.value
);

// Wskaźnik siły hasła
const strength = computed(() => {
  if (!form.password) return { score: 0, text: '', color: '', feedback: '' };

  const res = zxcvbn(form.password, [form.username, form.email]);
  const texts = ['Bardzo słabe', 'Słabe', 'Średnie', 'Silne', 'Bardzo silne'];
  const colors = ['error', 'error', 'warning', 'info', 'success'];

  return {
    score: res.score,
    text: texts[res.score],
    color: colors[res.score],
    feedback: form.password.length < 14
      ? `Aktualnie: ${form.password.length}/14`
      : res.score < 3
        ? res.feedback.suggestions.join(' ') || 'Dodaj różne znaki'
        : res.score === 4
          ? 'Doskonale! Bardzo bezpieczne hasło'
          : 'Dobre hasło'
  };
});

// Walidatory z debounce
const validateUsername = watchDebounced(() => form.username, () => {
  errors.username = form.username.length < 3 ? 'Min. 3 znaki' : '';
}, { debounce: 300 });

const validateEmail = watchDebounced(() => form.email, () => {
  errors.email = !EmailValidator.validate(form.email) ? 'Niepoprawny email' : '';
}, { debounce: 300 });

const validatePassword = watchDebounced(() => form.password, () => {
  errors.password = form.password.length < 14 ? 'Min. 14 znaków'
    : form.password.toLowerCase().includes(form.username.toLowerCase()) ? 'Hasło zawiera login'
      : strength.value.score < 3 ? 'Hasło za słabe' : '';
}, { debounce: 150 });

const validateConfirm = watchDebounced(() => form.confirm, () => {
  errors.confirm = form.confirm !== form.password ? 'Hasła nie są zgodne' : '';
}, { debounce: 150 });

// Pola formularza
const fields = [
  {
    model: 'username', label: 'Nazwa użytkownika', type: 'text', icon: 'mdi-account',
    clearable: true, counter: 50, maxlength: 50, validate: validateUsername
  },
  {
    model: 'email', label: 'Adres email', type: 'email', icon: 'mdi-email',
    clearable: true, validate: validateEmail
  },
  {
    model: 'password', label: 'Hasło',
    type: () => showPwd.value ? 'text' : 'password',
    icon: 'mdi-lock',
    appendIcon: () => showPwd.value ? 'mdi-eye-off' : 'mdi-eye',
    toggle: togglePwd, validate: validatePassword
  },
  {
    model: 'confirm', label: 'Powtórz hasło',
    type: () => showPwd.value ? 'text' : 'password',
    icon: 'mdi-lock-check',
    appendIcon: () => showPwd.value ? 'mdi-eye-off' : 'mdi-eye',
    toggle: togglePwd, validate: validateConfirm
  }
];

// Funkcje
const applySuggestion = () => {
  form.email = lastEmail.value;
  emailSuggested.value = true;
};

const clearError = () => errorMessage.value = '';

const register = async () => {
  Object.keys(touched).forEach(k => touched[k] = true);

  if (Object.values(errors).some(e => e) || Object.values(form).some(v => !v)) {
    errorMessage.value = 'Popraw błędy przed kontynuowaniem';
    useTimeoutFn(clearError, 5000);
    return;
  }

  try {
    const { data, error } = await auth.register(form.username.trim(), form.email.trim(), form.password);
    if (error?.value) throw error.value;

    lastEmail.value = form.email;
    if (isSupported.value) await copy(form.password);
    router.replace({ path: '/login', query: { registered: 'true' } });
  } catch (e) {
    const errorMap = {
      username: 'Użytkownik już istnieje',
      email: 'Email już użyty',
      password_contains_username: 'Hasło zawiera login',
      password_too_short: 'Hasło za krótkie',
      password_too_weak: 'Hasło za słabe',
      invalid_email: 'Niepoprawny email',
      missing_fields: 'Wypełnij wszystkie pola'
    };

    errorMessage.value = [StatusCodes.CONFLICT, StatusCodes.BAD_REQUEST].includes(e.statusCode)
      ? errorMap[e.data?.cause] || 'Błąd rejestracji'
      : 'Błąd serwera';

    useTimeoutFn(clearError, 5000);
  }
};

// Auto-sugestia emaila
onMounted(() => {
  isClient.value = true;
});
</script>

<style scoped>
.password-strength-container {
  padding: 0 12px;
  margin-top: .5rem;
}

.password-feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.field-container {
  margin-bottom: 1rem;
}
</style>
