export default defineNuxtRouteMiddleware((to, from) => {
  // console.log("MIDDLEWARE : TEST MIDDLEWARE", to, from);
  console.log("MIDDLEWARE : TEST MIDDLEWARE is being executed");
  return;
});
