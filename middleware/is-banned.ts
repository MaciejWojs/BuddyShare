// middleware/is-user-not-banned.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Nie wykonujemy na serwerze
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Admin zawsze przepuszczamy
  if (authStore.isAdmin) return

  // Musimy mieć nazwę użytkownika w URL
  const username = to.params.displayname as string | undefined
  if (!username) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username is required',
    })
  }

  const { users } = useApi()
  const { data, error } = await users.checkIfExists(username)

  // Błąd sieci lub inny niż brak rekordu traktujemy jako wewnętrzny
  if (error.value) {
    console.error('Failed to verify user existence:', error.value)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify user',
    })
  }

  // Jeżeli API zwróciło null lub undefined, to znaczy że coś nie tak z odpowiedzią
  if (!data.value) {
    console.error('Empty response verifying user:', username)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify user',
    })
  }

  // Sprawdzamy pole isBanned
  if ((data.value as { isBanned?: boolean }).isBanned) {
    throw createError({
      statusCode: 404,
      statusMessage: `${username} is banned`,
    })
  }
})
