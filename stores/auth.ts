import { defineStore } from "pinia";
import type { User } from "../types/User"; // Wydziel interfejs do osobnego pliku

export const useAuthStore = defineStore("auth", () => {
  // state
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  // getters
  const currentUser = computed(() => user.value);
  const authenticated = computed(() => isAuthenticated.value);
  const userName = computed(() => user.value?.userInfo.username || null);
  const userEmail = computed(() => user.value?.userInfo.email || null);
  const userRole = computed(() => user.value?.userInfo.userRole || null);
  const isReady = computed(() => isAuthenticated.value);

  // Lazy imports dla funkcji Nuxt
  const lazyFetch = () => {
    const config = useRuntimeConfig();
    const BACK_HOST = config.public.BACK_HOST;
    const headers = useRequestHeaders(["cookie"]);
    return { config, BACK_HOST, headers };
  };

  // actions
  async function fetchUser() {
    const { BACK_HOST, headers } = lazyFetch();

    try {
      user.value = await $fetch<User>(`http://${BACK_HOST}/auth/me`, {
        method: "GET",
        headers,
        credentials: "include",
      });
      isAuthenticated.value = !!user.value;
    } catch (error) {
      clearUser();
    }
  }

  function clearUser() {
    user.value = null;
    isAuthenticated.value = false;
  }

  async function logout() {
    const { BACK_HOST, headers } = lazyFetch();

    try {
      await $fetch(`http://${BACK_HOST}/auth/logout`, {
        method: "GET",
        headers,
        credentials: "include",
      });
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }

    const cookie = useCookie("JWT");
    cookie.value = null;
    clearUser();
  }

  return {
    user,
    isAuthenticated,
    currentUser,
    authenticated,
    userName,
    userEmail,
    userRole,
    isReady,
    fetchUser,
    clearUser,
    logout,
  };
});
