export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  const isAdmin = authStore.isAdmin;

  if (isAdmin) return;

  const username = to.params.displayname;

  const config = useRuntimeConfig();

  const BACK_HOST = config.public.BACK_HOST;

  console.log("Checking if user exists:", to.params);

  console.log("Checking if user exists:", username);

  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username is required",
    });
  }
  const baben = `http://${BACK_HOST}/users/${username}`;

  console.log("Checking if user exists:", baben);
  const { error, status, data } = await useFetch(baben);

  // console.log("ERROR: ", error.value);
  // console.log("STATUS: ", status);
  // console.log("DATA: ", data.value);
  if (!data.value) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to verify user",
    });
  }

  if ((data.value as { isBanned?: boolean })?.isBanned) {
    throw createError({
      statusCode: 404,
      statusMessage: `${username} is banned`,
    });
  }
});
