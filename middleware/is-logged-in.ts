export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  const isLoggedIn = authStore.authenticated;
  // const isLoggedIn = true;

  console.log("MIDDLEWARE : isLoggedIn", isLoggedIn);

  if (isLoggedIn === false) {
    console.log("MIDDLEWARE : isLoggedIn - redirecting to login");
    return await navigateTo("/login");
  }

  console.log("MIDDLEWARE : User is authenticated, continuing");
});
