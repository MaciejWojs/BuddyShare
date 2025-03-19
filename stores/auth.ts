import { defineStore } from "pinia";

enum Role {
  USER = "USER",
  SUBSCRIBER = "SUBSCRIBER",
  STREAMER = "STREAMER",
  MODERATOR = "MODERATOR",
}

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
  isInitialized: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
  }),

  actions: {
    async fetchUser() {
      const headers = useRequestHeaders(["cookie"]);
      const config = useRuntimeConfig();
      const BACK_HOST = config.public.BACK_HOST;
      console.log("BACK_HOST", BACK_HOST);
      try {
        console.log("fetchUser");
        const response = await $fetch<User>(`http://${BACK_HOST}/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          credentials: "include",
        });
        this.user = response;
        this.isAuthenticated = true;
        console.log("fetchUser", response);
      } catch (error) {
        this.clearUser();
      } finally {
        this.isInitialized = true;
      }
    },

    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
      console.log("clearUser");
      // # TODO Remove cookie
      // const cookie = useCookie("JWT");
      // cookie.value = "";
    },

    async logout() {
      const config = useRuntimeConfig();
      const BACK_HOST = config.public.BACK_HOST;
      const response = await fetch(`http://${BACK_HOST}/logout`);
      this.clearUser();
    },
  },
});
