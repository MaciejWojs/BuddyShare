import { useMemoize, useObjectUrl } from "@vueuse/core";
import { ImageTypes } from "~/types/ImageTypes";

export const useApi = () => {
  const config = useRuntimeConfig();
  const host = config.public.BACK_HOST;
  if (!host) {
    throw new Error("BACK_HOST is not defined in runtime config");
  }
  const formattedHost = host.startsWith("http") ? host : `http://${host}`;
  const baseURL = formattedHost || "http://localhost:5000";

  /**
   * Wykonuje żądanie HTTP - automatycznie wykrywa kontekst (SSR vs client-side)
   */
  const request = async <T = any>(
    endpoint: string,
    options: any = {}
  ) => {
    // Sprawdź czy jesteśmy po stronie klienta i czy komponent jest już zamontowany
    if (import.meta.client && getCurrentInstance()?.isMounted) {
      // Użyj $fetch dla wywołań po stronie klienta po mounted
      try {
        const data = await $fetch<T>(endpoint, {
          baseURL,
          credentials: "include" as RequestCredentials,
          ...options,
        });
        return {
          data: ref(data),
          error: ref(null),
          pending: ref(false)
        };
      } catch (error) {
        return {
          data: ref(null),
          error: ref(error),
          pending: ref(false)
        };
      }
    } else {
      // Użyj useFetch dla SSR lub przed mounted
      const { data, error, pending } = await useFetch<T>(endpoint, {
        baseURL,
        credentials: "include" as RequestCredentials,
        ...options,
      });
      return { data, error, pending };
    }
  };

  /**
   * Autentykacja
   */
  const auth = {
    login: (username: string, passwordHash: string) =>
      request("/auth/login", {
        method: "POST",
        body: { username, passwordHash },
      }),

    register: (username: string, email: string, password: string) =>
      request("/auth/register", {
        method: "POST",
        body: { username, email, password },
      }),

    logout: () => request("/auth/logout"),

    getCurrentUser: () => request("/auth/me"),

    test: () => request("/auth/test"),
  };

  /**
   * Użytkownicy
   */
  const users = {
    checkIfExists: (username: string) => request(`/users/${username}`),

    getUserAvatar: useMemoize(async (username: string) => {
      try {
        const data = await $fetch<Blob>(`/users/${username}/avatar`, {
          responseType: 'blob',
          credentials: "include" as RequestCredentials,
          baseURL,
        });

        if (!data) {
          throw new Error("Nie udało się pobrać danych obrazu");
        }

        const objectUrl = useObjectUrl(data);
        console.log("API getUserAvatar zwraca URL:", objectUrl.value);
        return objectUrl.value;
      } catch (error) {
        console.error("Błąd podczas pobierania obrazu:", error);
        throw error;
      }
    }, {
      getKey: (username: string) => `avatar:${username}`,
    }),

    // Funkcja do czyszczenia cache awatara
    clearAvatarCache: (username?: string) => {
      if (username) {
        users.getUserAvatar.delete(`avatar:${username}`);
      } else {
        users.getUserAvatar.clear();
      }
    },

    getAll: () => request("/users/"),

    getBriefInfo: () => request("/users/brief"),

    getProfile: (username: string) => request(`/users/${username}/profile`),

    updateProfile: (
      username: string,
      profileData: {
        description?: string;
        profilePicture?: string;
        profileBanner?: string;
        avatarFile?: File;
        bannerFile?: File;
      }
    ) => {
      const { avatarFile, bannerFile, ...otherData } = profileData;

      const formData = new FormData();

      // Dodaj podstawowe dane tekstowe
      Object.entries(otherData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value);
        }
      });

      // Zbierz pliki do tablicy
      const files: File[] = [];
      if (avatarFile) {
        const fileExtension = avatarFile.name.split(".").pop();
        const newFileName = `avatar.${fileExtension}`;
        const newAvatarFile = new File([avatarFile], newFileName, { type: avatarFile.type });
        files.push(newAvatarFile);
      }
      if (bannerFile) {
        const bannerExtension = bannerFile.name.split(".").pop();
        const newBannerFileName = `banner.${bannerExtension}`;
        const newBannerFile = new File([bannerFile], newBannerFileName, { type: bannerFile.type });
        files.push(newBannerFile);
      }

      // Dodaj tablicę plików jeśli są jakieś pliki
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      return request(`/users/${username}/profile`, {
        method: "PATCH",
        body: formData,
      });
    },

    getSettings: (username: string) => request(`/users/${username}/settings`),

    updateSettings: (
      username: string,
      settings: {
        notificationsEnabled?: boolean;
        darkMode?: boolean;
        language?: "pl" | "en";
      }
    ) =>
      request(`/users/${username}/settings`, {
        method: "PATCH",
        body: settings,
      }),

    updateSingleSetting: (username: string, settingId: string, value: string) =>
      request(`/users/${username}/settings/${settingId}`, {
        method: "PATCH",
        body: { value },
      }),

    getRole: (username: string) => request(`/users/${username}/role`),

    changeRole: (username: string, role: "USER" | "ADMIN") =>
      request(`/users/${username}/role`, {
        method: "PATCH",
        body: { role },
      }),

    banUser: (username: string) =>
      request(`/users/${username}/ban`, {
        method: "PATCH",
      }),

    unbanUser: (username: string) =>
      request(`/users/${username}/unban`, {
        method: "PATCH",
      }),

    followUser: (username: string) =>
      request(`/users/${username}/follow`, {
        method: "POST",
      }),

    unfollowUser: (username: string) =>
      request(`/users/${username}/unfollow`, {
        method: "POST",
      }),

    getFollowers: (username: string) => request(`/users/${username}/followers`),

    getFollowersCount: (username: string) =>
      request(`/users/${username}/followers/count`),

    getFollowing: (username: string) => request(`/users/${username}/following`),

    getFollowingCount: (username: string) =>
      request(`/users/${username}/following/count`),

    getSubscriptions: (username: string) =>
      request(`/users/${username}/subscriptions`),

    becomeStreamer: (username: string) =>
      request(`/users/${username}/become-streamer`, {
        method: "POST",
      }),

    getNotifications: (username: string) => {
      console.log("(COMPOSABLES) useApi: getNotifications", username);
      return request(`/users/${username}/notifications`);
    },

    updateNotifications: (username: string, notifications: any[]) =>
      request(`/users/${username}/notifications`, {
        method: "PUT",
        body: { notifications },
      }),

    deleteNotifications: (username: string, notifications: number[]) =>
      request(`/users/${username}/notifications`, {
        method: "DELETE",
        body: { notifications },
      }),

    updateNotification: (username: string, notificationId: number, data: any) =>
      request(`/users/${username}/notifications/${notificationId}`, {
        method: "PATCH",
        body: data,
      }),

    deleteNotification: (username: string, notificationId: number) =>
      request(`/users/${username}/notifications/${notificationId}`, {
        method: "DELETE",
      }),
  };

  /**
   * Streamerzy
   */
  const streamers = {
    getAll: () => request("/streamers/"),
    
    getAllStats: (username: string) => request(`/streamers/${username}/stats`),

    getByUsername: (username: string) => request(`/streamers/${username}`),

    isStreamer: async (username: string) => {
      try {
        const { error } = await request(`/streamers/${username}`);
        // Jeśli nie ma błędu (np. 404), użytkownik jest streamerem
        return !error.value;
      } catch (e) {
        // Na wypadek innych nieoczekiwanych błędów w samym request
        return false;
      }
    },

    getModerators: (username: string) =>
      request(`/streamers/${username}/moderators`),

    getModerator: (username: string, modUsername: string) =>
      request(`/streamers/${username}/moderators/${modUsername}`),

    addModerator: (username: string, modUsername: string) =>
      request(`/streamers/${username}/moderators/${modUsername}`, {
        method: "PUT",
      }),

    removeModerator: (username: string, modUsername: string) =>
      request(`/streamers/${username}/moderators/${modUsername}`, {
        method: "DELETE",
      }),

    getToken: (username: string) => request(`/streamers/${username}/token`),

    updateToken: (username: string) =>
      request(`/streamers/${username}/token`, {
        method: "PATCH",
      }),

    getSubscribers: (username: string) =>
      request(`/streamers/${username}/subscribers`),

    subscribe: (username: string) =>
      request(`/streamers/${username}/subscribers`, {
        method: "PUT",
      }),

    unsubscribe: (username: string) =>
      request(`/streamers/${username}/subscribers`, {
        method: "DELETE",
      }),
  };

  /**
   * Media i strumienie
   */
  const media = {
    getAllStreams: () => request("/media"),

    uploadImage: (image: File) => {
      const formData = new FormData();
      const fileName = image.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      let finalMimeType = image.type;

      if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        finalMimeType = 'image/jpeg';
      } else if (fileExtension === 'png') {
        finalMimeType = 'image/png';
      }

      let fileToUpload: Blob = image;
      if (finalMimeType && (finalMimeType !== image.type || !image.type)) {
        fileToUpload = image.slice(0, image.size, finalMimeType);
      }

      formData.append('file', fileToUpload, fileName);

      return request("/media/", {
        method: "POST",
        body: formData,
      });
    },

    getImage: useMemoize(async (hash: string, type: ImageTypes) => {
      console.log("API getImage wywołane z:", { hash, type });

      try {
        const { data } = await request<Blob>(`/media`, {
          params: { hash, type },
          responseType: 'blob',
        });

        if (!data.value) {
          throw new Error("Nie udało się pobrać danych obrazu");
        }

        const objectUrl = useObjectUrl(data.value);
        console.log("API getImage zwraca URL:", objectUrl.value);
        return objectUrl.value;
      } catch (error) {
        console.error("Błąd podczas pobierania obrazu:", error);
        throw error;
      }
    }, {
      getKey: (hash: string, type: ImageTypes) => `image:${hash}:${type}`,
    }),

    getStream: (id: string) => request(`/media/${id}`),

    createStream: (streamData: {
      title: string;
      description?: string;
      thumbnail?: string;
    }) =>
      request("/media", {
        method: "POST",
        body: streamData,
      }),

    updateStream: (
      id: string,
      streamData: {
        title?: string;
        description?: string;
        thumbnail?: string;
      }
    ) =>
      request(`/media/${id}`, {
        method: "PUT",
        body: streamData,
      }),

    patchStream: (id: string, partialData: object) =>
      request(`/media/${id}`, {
        method: "PATCH",
        body: partialData,
      }),

    deleteStream: (id: string) =>
      request(`/media/${id}`, {
        method: "DELETE",
      }),
  };

  const streams = {
    getAll: () => request("/streams"),

    getStream: (username: string, streamId: string) =>
      request(`/streams/${username}/${streamId}`),

    updateStream: (
      username: string,
      streamId: string,
      streamData: {
        title?: string;
        description?: string;
        isPublic?: boolean;
        thumbnail?: File | null;
      },

    ) => {
      const { thumbnail, ...otherData } = streamData;

      const formData = new FormData();

      // Dodaj podstawowe dane tekstowe
      Object.entries(otherData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Zbierz pliki do tablicy
      if (thumbnail) {
        formData.append('file', thumbnail);
      }

      return request(`/streams/${username}/${streamId}`, {
        method: "PATCH",
        body: formData,
      });
    },

    getStreamThumbnail: useMemoize(
      async (username: string, streamId: string) => {
        try {
          const data = await $fetch<Blob>(`/streams/${username}/${streamId}/thumbnail`, {
            responseType: 'blob',
            credentials: "include" as RequestCredentials,
            baseURL,
          });
          if (!data) {
            throw new Error("Nie udało się pobrać danych obrazu");
          }
          const objectUrl = useObjectUrl(data);
          console.log("API getStreamThumbnail zwraca URL:", objectUrl.value);
          return objectUrl.value;
        } catch (error) {
          console.error("Błąd podczas pobierania miniatury strumienia:", error);
          throw error;
        }
      },
      {
        getKey: (username: string, streamId: string) => `streamThumbnail:${username}:${streamId}`,
      }
    ),

    deleteStream: (username: string, streamId: string) =>
      request(`/streams/${username}/${streamId}`, {
        method: "DELETE",
      }),

    notify: {
      start: () => request("/streams/notify/start"),
      end: () => request("/streams/notify/end"),
    },

    getToken: () => request("/streams/token"),
  };

  /**
   * Moderatorzy
   */
  const moderators = {
    getModerator: (modUsername: string) =>
      request(`/moderators/${modUsername}`),
  };

  return {
    request,
    auth,
    users,
    streamers,
    media,
    streams,
    moderators,
  };
};
