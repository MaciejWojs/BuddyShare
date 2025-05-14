// middleware/is-moderator.ts
import type { Moderator } from '~/types/moderator'
import { useApi } from '~/composables/useApi'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  // globalny stan, w którym będziemy przechowywać info o moderatorze
  const moderatorStatus = useState<Moderator | null>(
    'moderatorStatus',
    () => null
  )

  // jeśli niezalogowany, wychodzimy
  if (!authStore.authenticated) {
    return
  }

  const currentUserUsername = authStore.userName
  if (!currentUserUsername) {
    console.error('EXITING MIDDLEWARE: brak nazwy użytkownika')
    return
  }

  const streamerUsername = to.params.displayname as string | undefined
  if (!streamerUsername) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nazwa streamera jest wymagana',
    })
  }

  // korzystamy z useApi
  const { streamers } = useApi()

  // wywołujemy endpoint GET /streamers/:streamer/moderators/:user
  const { data, error } = await streamers.getModerator(
    streamerUsername,
    currentUserUsername
  )

  // 404 → nie jest moderatorem, wychodzimy bez błędu
  if (error.value?.statusCode === 404) {
    console.log('EXITING MIDDLEWARE: użytkownik nie jest moderatorem')
    return
  }

  // inny błąd → logujemy i wychodzimy
  if (error.value) {
    console.error(
      'EXITING MIDDLEWARE: błąd pobierania statusu moderatora',
      error.value
    )
    return
  }

  // jeśli API zwróciło null albo undefined — nie jest moderatorem
  if (!data.value) {
    console.log('EXITING MIDDLEWARE: użytkownik nie jest moderatorem')
    return
  }

  // zapiszemy info o moderatorze w stanie globalnym
  moderatorStatus.value = data.value
  console.log('EXITING MIDDLEWARE: użytkownik jest moderatorem', data.value)
})
