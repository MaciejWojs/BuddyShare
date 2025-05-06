// ~/stores/notifications.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useAuthStore } from './auth'
import { useAuthWebSocket } from '~/composables/useAuthWebSocket'

interface Notification {
    id: number;
    user_id: number;
    stream_id?: number;
    message: string;
    created_at: string;
    isRead: boolean;
    // Dodajemy opcjonalne pola, które mogą przyjść z WebSocket
    type?: string;
    streamer?: string;
    streamerName?: string;
    title?: string;
}

export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref<Notification[]>([])
    // Usunięto wsConnected, ponieważ stan połączenia jest zarządzany globalnie przez wtyczkę
    // i dostępny przez useAuthWebSocket().isConnected

    const authStore = useAuthStore()
    const authWs = useAuthWebSocket() // Pobieramy instancję composable

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

    // Funkcja do obsługi nowych powiadomień z WebSocket
    const handleNewNotification = (data: Notification) => {
        console.log('Otrzymano nowe powiadomienie przez WebSocket:', data)
        // Sprawdź, czy powiadomienie już istnieje
        const exists = notifications.value.some(n => n.id === data.id)
        if (!exists) {
            // Dodaj nowe powiadomienie na początek listy (najnowsze)
            notifications.value.unshift(data)
            console.log('Dodano nowe powiadomienie do listy.')
        } else {
            console.log('Powiadomienie już istnieje, pomijam dodanie.')
        }
    }

    async function updateNotificationStatus(id: number, isRead: boolean) {
        const notification = notifications.value.find(
            (n) => n.id === id)

        if (!notification || notification.type === 'dismissable') {
            return;
        }

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
            await fetchNotifications()
        }
    }

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
            await fetchNotifications()
        }
    }

    async function markAsRead(id: number) {
        const notification = notifications.value.find(
            (n) => n.id === id && typeof n === 'object' && 'isRead' in n
        );
        if (notification && !notification.isRead) { // Dodano warunek !notification.isRead
            notification.isRead = true;
            await updateNotificationStatus(id, true);
        }
    }

    async function markAllAsRead() {
        const unreadNotifications = notifications.value
            .filter(n => typeof n === 'object' && 'isRead' in n && !n.isRead && n.type !== 'dismissable')
            .map(n => ({ id: n.id, isRead: true }));

        if (unreadNotifications.length === 0) return;

        notifications.value.forEach((notification) => {
            if (typeof notification === 'object' && 'isRead' in notification) {
                notification.isRead = true;
            }
        });
        await updateMultipleNotifications(unreadNotifications);
    }

    async function deleteNotification(id: number) {
        try {
            const notification = notifications.value.find(n => n.id === id)
            if (notification && notification.type !== 'dismissable') {
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
            }
            notifications.value = notifications.value.filter(n => n.id !== id)
            console.log(`Usunięto powiadomienie ${id}`)
        } catch (e) {
            console.error(`Błąd usuwania powiadomienia ${id}:`, e)
            await fetchNotifications()
        }
    }

    async function deleteNotificationsInBulk(notificationIds: number[]) {
        try {
            const config = useRuntimeConfig()
            const headers = useRequestHeaders(['cookie'])

            await $fetch(
                `http://${config.public.BACK_HOST}/users/${authStore.userName}/notifications`,
                {
                    method: 'DELETE', // Używamy DELETE zgodnie z sugestią dla usuwania zbiorczego
                    body: { notifications: notificationIds }, // Przekazujemy ID w ciele żądania
                    credentials: 'include',
                    headers
                }
            )
            notifications.value = notifications.value.filter(n => !notificationIds.includes(n.id))
            console.log(`Usunięto ${notificationIds.length} powiadomień`)
        } catch (e) {
            console.error('Błąd usuwania powiadomień:', e)
            await fetchNotifications()
        }
    }

    async function deleteAllNotifications() {
        try {
            const allNotificationIds = notifications.value.filter(n => n.type !== 'dismissable').map(n => n.id)
            if (allNotificationIds.length === 0) return;

            const previousNotifications = [...notifications.value]
            notifications.value = []

            try {
                await deleteNotificationsInBulk(allNotificationIds)
            } catch (e) {
                notifications.value = previousNotifications
                throw e
            }
        } catch (e) {
            console.error('Błąd usuwania wszystkich powiadomień:', e)
            await fetchNotifications()
        }
    }

    // Inicjalizacja i nasłuchiwanie na zmiany autentykacji
    if (import.meta.client) {
        // Nasłuchuj na powiadomienia WebSocket tylko raz
        authWs.onStreamNotification(handleNewNotification);
        authWs.onNotifyStreamer((data) => {
            console.log('Otrzymano powiadomienie jako streamer:', data);
            if (data.streamerName === authStore.userName) {
                console.log('Otrzymano powiadomienie o twoim streamie:', data);
                handleNewNotification(data);
            }
        });

        watch(() => authStore.authenticated, (loggedIn) => {
            if (loggedIn) {
                console.log("Użytkownik zalogowany, pobieram powiadomienia.");
                fetchNotifications();
                // Nie ma potrzeby ręcznego łączenia WebSocket, wtyczka to robi
            } else {
                console.log("Użytkownik wylogowany, czyszczę powiadomienia.");
                notifications.value = []; // Wyczyść powiadomienia po wylogowaniu
                // Nie ma potrzeby ręcznego rozłączania WebSocket, wtyczka to robi
            }
        }, { immediate: true }); // Uruchom od razu
    }

    return {
        notifications,
        // usunięto wsConnected
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    }
})
