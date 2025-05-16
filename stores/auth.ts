import { defineStore } from "pinia";
import type { User } from "../types/User";
import { Role } from "~/types/Roles";

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
  const isAdmin = computed(() => user.value?.userInfo.userRole === Role.ADMIN);

  const { auth } = useApi();

  // actions
  async function fetchUser() {
    try {
      const { data, error } = await auth.getCurrentUser();
      
      if (error.value) {
        clearUser();
        return;
      }
      
      user.value = data.value as User;
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
    try {
      await auth.logout();
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }

    const cookie = useCookie("JWT");
    cookie.value = null;
    clearUser();
  }

  return {
    user,
    currentUser,
    authenticated,
    userName,
    userEmail,
    userRole,
    isReady,
    isAdmin,
    fetchUser,
    clearUser,
    logout,
  };
});
