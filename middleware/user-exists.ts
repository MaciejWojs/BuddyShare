// middleware/user-exists.ts
export default defineNuxtRouteMiddleware(async (to) => {
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
  const baben = `http://${BACK_HOST}/users/${username}/exists`;

  console.log("Checking if user exists:", baben);
  const { error } = await useFetch(baben);

  if (error.value?.statusCode === 404) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
      fatal: true,
    });
  }

  if (error.value) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to verify user",
    });
  }
});
