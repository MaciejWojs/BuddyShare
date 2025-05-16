// ~/stores/notifications.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from './auth'
import { useAuthWebSocket } from '~/composables/useAuthWebSocket'
import { useApi } from '~/composables/useApi'

interface Notification {
    id: number;
    user_id: number;
    stream_id?: number;
    message: string;
    created_at: string;
    isRead: boolean;
    type?: string;
    streamer?: string;
    streamerName?: string;
    title?: string;
}

export const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref<Notification[]>([])
    const authStore = useAuthStore()
    const authWs = useAuthWebSocket()
    const { users } = useApi()

    async function fetchNotifications() {
        try {
            const { data, error } = await users.getNotifications(authStore.userName)
            if (error.value) throw error.value
            notifications.value = data.value || []
            console.log('Pobrano powiadomienia:', notifications.value)
        } catch (e) {
            console.error('Błąd fetchNotifications:', e)
        }
    }

    const handleNewNotification = (data: Notification) => {
        console.log('Otrzymano nowe powiadomienie przez WebSocket:', data)
        const exists = notifications.value.some(n => n.id === data.id)
        if (!exists) {
            notifications.value.unshift(data)
            console.log('Dodano nowe powiadomienie do listy.')
        } else {
            console.log('Powiadomienie już istnieje, pomijam dodanie.')
        }
    }

    async function updateNotificationStatus(id: number, isRead: boolean) {
        const notification = notifications.value.find(n => n.id === id)
        if (!notification || notification.type === 'dismissable') return

        try {
            await users.updateNotification(authStore.userName, id, { isRead })
            console.log(`Zaktualizowano status powiadomienia ${id}`)
        } catch (e) {
            console.error(`Błąd aktualizacji powiadomienia ${id}:`, e)
            await fetchNotifications()
        }
    }

    async function updateMultipleNotifications(notificationUpdates: { id: number, isRead: boolean }[]) {
        try {
            await users.updateNotifications(authStore.userName, notificationUpdates)
            console.log(`Zaktualizowano ${notificationUpdates.length} powiadomień`)
        } catch (e) {
            console.error('Błąd zbiorczej aktualizacji powiadomień:', e)
            await fetchNotifications()
        }
    }

    async function markAsRead(id: number) {
        const notification = notifications.value.find(n => n.id === id)
        if (notification && !notification.isRead) {
            notification.isRead = true
            await updateNotificationStatus(id, true)
        }
    }

    async function markAllAsRead() {
        const unread = notifications.value
            .filter(n => !n.isRead && n.type !== 'dismissable')
            .map(n => ({ id: n.id, isRead: true }))

        if (!unread.length) return

        notifications.value.forEach(n => {
            if (n.type !== 'dismissable') n.isRead = true
        })

        await updateMultipleNotifications(unread)
    }

    async function deleteNotification(id: number) {
        const notification = notifications.value.find(n => n.id === id)
        if (!notification || notification.type === 'dismissable') return

        try {
            await users.deleteNotification(authStore.userName, id)
            notifications.value = notifications.value.filter(n => n.id !== id)
            console.log(`Usunięto powiadomienie ${id}`)
        } catch (e) {
            console.error(`Błąd usuwania powiadomienia ${id}:`, e)
            await fetchNotifications()
        }
    }

    async function deleteNotificationsInBulk(ids: number[]) {
        try {
            await users.deleteNotifications(authStore.userName, ids)
            notifications.value = notifications.value.filter(n => !ids.includes(n.id))
            console.log(`Usunięto ${ids.length} powiadomień`)
        } catch (e) {
            console.error('Błąd usuwania powiadomień:', e)
            await fetchNotifications()
        }
    }

    async function deleteAllNotifications() {
        try {
            const deletable = notifications.value.filter(n => n.type !== 'dismissable').map(n => n.id)
            if (!deletable.length) return

            const previous = [...notifications.value]
            notifications.value = []

            try {
                await deleteNotificationsInBulk(deletable)
            } catch (e) {
                notifications.value = previous
                throw e
            }
        } catch (e) {
            console.error('Błąd usuwania wszystkich powiadomień:', e)
            await fetchNotifications()
        }
    }

    if (import.meta.client) {
        authWs.onStreamNotification(handleNewNotification)
        authWs.onNotifyStreamer(data => {
            console.log('Otrzymano powiadomienie jako streamer:', data)
            if (data.streamerName === authStore.userName) {
                handleNewNotification(data)
            }
        })

        watch(() => authStore.authenticated, (loggedIn) => {
            if (loggedIn) {
                console.log('Użytkownik zalogowany, pobieram powiadomienia.')
                fetchNotifications()
            } else {
                console.log('Użytkownik wylogowany, czyszczę powiadomienia.')
                notifications.value = []
            }
        }, { immediate: true })
    }

    return {
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
    }
})
