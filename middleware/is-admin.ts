import { Role } from "../types/Roles";
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  const isAdmin = authStore.isAdmin;

  if (!isAdmin) {
    // throw createError({
    //   statusCode: 403,
    //   statusMessage: "Forbidden",
    // });
    return abortNavigation({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }
});
