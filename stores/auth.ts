import { defineStore } from "pinia";
import { Role } from "../types/Roles";

interface User {
  id: number;
  email: string;
  displayName: string;
  profilePicture: string | null;
  role: Role;
  createdAt: string;
  lastLogin: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
  }),

  getters: {
    // Podstawowe gettery
    currentUser: (state) => state.user,
    authenticated: (state) => state.isAuthenticated,

    // Gettery z dodatkową logiką
    userName: (state) => state.user?.displayName || null,
    userEmail: (state) => state.user?.email || null,
    userRole: (state) => state.user?.role || null,

    // Gettery sprawdzające role
    // isAdmin: (state) => state.user?.role === Role.ADMIN,

    // Getter sprawdzający czy aplikacja jest gotowa
    isReady: (state) => state.isAuthenticated,
  },

  actions: {
    async fetchUser() {
      const headers = useRequestHeaders(["cookie"]);
      const config = useRuntimeConfig();
      const BACK_HOST = config.public.BACK_HOST;
      console.log("BACK_HOST", BACK_HOST);
      try {
        console.log("fetchUser");
        try {
          this.user = await $fetch<User>(`http://${BACK_HOST}/me`, {
            method: "GET",
            headers: {
              ...headers,
            },
            credentials: "include",
          });
          this.isAuthenticated = (this.user) ? true : false;
          console.log("fetchUser success", this.user);
        } catch (error) {
          console.error("Error fetching user:", error);
          this.clearUser();
        }
      } catch (error) {
        this.clearUser();
      }
    },

    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
    },

    async logout() {
      const config = useRuntimeConfig();
      const BACK_HOST = config.public.BACK_HOST;
      const headers = useRequestHeaders(["cookie"]);

      try {
        await $fetch(`http://${BACK_HOST}/logout`, {
          method: "GET",
          headers: {
            ...headers,
          },
          credentials: "include"
        });
      } catch (error) {
        console.error("Błąd podczas wylogowywania:", error);
      }

      // Usuń ciasteczko
      const cookie = useCookie("JWT");
      cookie.value = null;

      this.clearUser();
    },
  },
});
