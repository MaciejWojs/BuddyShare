// middleware/is-moderator.ts
import type { Moderator } from "~/types/moderator";
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  // const nuxtData = useNuxtApp();
  const moderatorStatus = useState<Moderator | null>(
    "moderatorStatus",
    () => null
  );

  // Sprawdzenie czy użytkownik jest zalogowany
  if (!authStore.authenticated) {
    return;
  }

  // Pobranie nazwy użytkownika z authStore
  const currentUserUsername = authStore.userName;
  console.log("currentUserUsername", currentUserUsername);
  if (!currentUserUsername) {
    console.error("EXITING MIDDLEWARE : currentUserUsername is null");
    return;
  }

  // Pobranie nazwy streamera z parametrów ścieżki
  const streamerUsername = to.params.displayname;
  if (!streamerUsername) {
    throw createError({
      statusCode: 400,
      statusMessage: "Nazwa streamera jest wymagana",
    });
  }

  const config = useRuntimeConfig();
  const BACK_HOST = config.public.BACK_HOST;

  // Budowanie URL do API
  const url = `http://${BACK_HOST}/streamers/${streamerUsername}/moderators/${currentUserUsername}`;
  const headers = useRequestHeaders(["cookie"]);

  // Wysłanie zapytania do API z tokenem autoryzacyjnym używając useFetch
  const { data, error } = await useFetch<Moderator | null>(url, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  });

  if (error.value?.statusCode === 404) {
    console.error("EXITING MIDDLEWARE : user is not a moderator");
    return;
  }

  if (error.value) {
    console.error(
      "EXITING MIDDLEWARE : Error fetching moderator status",
      error.value
    );
    console.error("EXITING MIDDLEWARE : error value", error.value.statusCode);
    return;
  }

  if (!data.value) {
    console.error("EXITING MIDDLEWARE : user is not a moderator");

    return;
  }

  // nuxtData.$moderator = data.value;
  moderatorStatus.value = data.value;
  console.log("EXITING MIDDLEWARE : user is a moderator", data.value);
  // console.log("EXITING MIDDLEWARE : NUXT DATA", nuxtData.$moderator);
  // Sprawdzenie czy użytkownik jest moderatorem
});
