export default defineNuxtRouteMiddleware((to, from) => {
  console.log("MIDDLEWARE : TEST MIDDLEWARE", to, from);
  return;
});
