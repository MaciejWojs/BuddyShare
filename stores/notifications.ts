// ~/stores/notifications.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAuthStore } from './auth'

interface Notification {
  id: number;
  user_id: number;
  stream_id?: number;
  message: string;
  created_at: string;
  isRead: boolean;
}

export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref<Notification[]>([])
    const isPolling = ref(false)

    // dostęp do authStore
    const authStore = useAuthStore()

    // funkcja pobierająca powiadomienia
    async function fetchNotifications() {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])
            const data = await $fetch<Notification[]>(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications`,
                { credentials: 'include', headers }
            )
            notifications.value = data
            console.log('Pobrano powiadomienia:', data)
        } catch (e) {
            console.error('Błąd fetch-notifications:', e)
        }
    }

    // ustawiamy polling co 60 000 ms (1 minuta)
    const { pause, resume } = useIntervalFn(fetchNotifications, 60_000, {
        immediate: false,  // nie uruchamiamy od razu
    })

    // kontrola start/stop pollingu
    function startPolling() {
        if (!isPolling.value) {
            fetchNotifications()  // od razu jedno wywołanie
            resume()
            isPolling.value = true
        }
    }
    function stopPolling() {
        if (isPolling.value) {
            pause()
            isPolling.value = false
        }
    }

    // obserwujemy stan zalogowania
    watch(
        () => authStore.authenticated,
        (loggedIn) => {
            if (loggedIn) startPolling()
            else stopPolling()
        },
        { immediate: true }
    )

    // Funkcja aktualizująca status powiadomienia na serwerze
    async function updateNotificationStatus(id: number, isRead: boolean) {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])
            
            await $fetch(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications/${id}`,
                {
                    method: 'PATCH',
                    body: { isRead },
                    credentials: 'include',
                    headers
                }
            )
            console.log(`Zaktualizowano status powiadomienia ${id} na serwerze`)
        } catch (e) {
            console.error(`Błąd aktualizacji powiadomienia ${id}:`, e)
            // W przypadku błędu możemy przywrócić poprzedni stan
            await fetchNotifications() // Odświeżamy dane z serwera
        }
    }

    // Funkcja aktualizująca status wielu powiadomień jednocześnie (batch update)
    async function updateMultipleNotifications(notificationUpdates: { id: number, isRead: boolean }[]) {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])
            
            await $fetch(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications`,
                {
                    method: 'PUT',
                    body: { notifications: notificationUpdates },
                    credentials: 'include',
                    headers
                }
            )
            console.log(`Zaktualizowano ${notificationUpdates.length} powiadomień na serwerze`)
        } catch (e) {
            console.error('Błąd zbiorczej aktualizacji powiadomień:', e)
            // W przypadku błędu możemy przywrócić poprzedni stan
            await fetchNotifications() // Odświeżamy dane z serwera
        }
    }

    // Aktualizacja funkcji markAsRead o optymistyczną aktualizację
    async function markAsRead(id: number) {
        const notification = notifications.value.find(
            (n) => n.id === id && typeof n === 'object' && 'isRead' in n
        );
        if (notification) {
            // Optymistyczna aktualizacja - najpierw zmieniamy lokalnie
            notification.isRead = true;
            
            // Następnie wysyłamy zmianę na serwer
            await updateNotificationStatus(id, true);
        }
    }

    // Aktualizacja funkcji markAllAsRead o zoptymalizowaną aktualizację zbiorczą
    async function markAllAsRead() {
        // Tworzymy listę nieprzeczytanych powiadomień z ich ID
        const unreadNotifications = notifications.value
            .filter(n => typeof n === 'object' && 'isRead' in n && !n.isRead)
            .map(n => ({ id: n.id, isRead: true }));

        if (unreadNotifications.length === 0) return;

        // Optymistyczna aktualizacja - najpierw zmieniamy lokalnie
        notifications.value.forEach((notification) => {
            if (typeof notification === 'object' && 'isRead' in notification) {
                notification.isRead = true;
            }
        });
        
        // Wysyłamy jedną zbiorczą aktualizację zamiast wielu pojedynczych
        await updateMultipleNotifications(unreadNotifications);
    }

    // Funkcja usuwająca pojedyncze powiadomienie
    async function deleteNotification(id: number) {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])
            
            await $fetch(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications/${id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers
                }
            )
            
            // Optymistyczna aktualizacja - usuwamy powiadomienie z lokalnego stanu
            notifications.value = notifications.value.filter(n => n.id !== id)
            console.log(`Usunięto powiadomienie ${id}`)
        } catch (e) {
            console.error(`Błąd usuwania powiadomienia ${id}:`, e)
            // W przypadku błędu odświeżamy dane
            await fetchNotifications()
        }
    }

    // Funkcja usuwająca wiele powiadomień jednocześnie
    async function deleteNotificationsInBulk(notificationIds: number[]) {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])
            
            await $fetch(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications`,
                {
                    method: 'DELETE',
                    body: { notifications: notificationIds },
                    credentials: 'include',
                    headers
                }
            )
            
            // Optymistyczna aktualizacja - usuwamy powiadomienia z lokalnego stanu
            notifications.value = notifications.value.filter(n => !notificationIds.includes(n.id))
            console.log(`Usunięto ${notificationIds.length} powiadomień`)
        } catch (e) {
            console.error('Błąd usuwania powiadomień:', e)
            // W przypadku błędu odświeżamy dane
            await fetchNotifications()
        }
    }

    // Aktualizacja funkcji usuwającej wszystkie powiadomienia użytkownika
    async function deleteAllNotifications() {
        try {
            // Pobieramy wszystkie identyfikatory powiadomień
            const allNotificationIds = notifications.value.map(n => n.id)
            
            if (allNotificationIds.length === 0) return;
            
            // Optymistyczna aktualizacja - czyścimy lokalny stan
            const previousNotifications = [...notifications.value]
            notifications.value = []
            
            try {
                // Wysyłamy żądanie usunięcia wielu powiadomień
                await deleteNotificationsInBulk(allNotificationIds)
            } catch (e) {
                // W przypadku błędu przywracamy poprzedni stan
                notifications.value = previousNotifications
                throw e
            }
        } catch (e) {
            console.error('Błąd usuwania wszystkich powiadomień:', e)
            // W przypadku błędu odświeżamy dane
            await fetchNotifications()
        }
    }

    return {
        notifications,
        isPolling,
        startPolling,
        stopPolling,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    }
})
