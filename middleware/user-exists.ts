// middleware/user-exists.ts
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const username = to.params.displayname as string | undefined
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'Username is required' })
  }

  const api = useApi()
  const { error } = await api.users.checkIfExists(username)

  if (error.value) {
    // 404 → user not found
    if (error.value.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: `User "${username}" not found`,
      })
    }
    // anything else → server error
    throw createError({
      statusCode: error.value.statusCode || 500,
      statusMessage: error.value.statusMessage || 'Failed to verify user',
    })
  }

  // if we get here, the user exists and is not banned
})