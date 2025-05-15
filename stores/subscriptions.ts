
export const useSubscriptionsStore = defineStore("Subscriptions", () => {
    const subscriptions = ref([])
    const { users, streamers } = useApi()
    const authStore = useAuthStore()

    async function fetchSubscriptions() {
        if (!import.meta.client) return
        await authStore.waitUntilReady?.()
        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping fetchSubscriptions.")
            return
        }
        console.log("Fetching subscriptions...")
        const { data, error } = await users.getSubscriptions(authStore.userName!)
        if (error.value) throw error.value
        if (!data.value) {
            console.error("No data received for subscriptions.")
            return
        }
        subscriptions.value = data.value
        console.log("Fetched subscriptions:", subscriptions.value)
    }

    async function removeSubscription(username: string) {
        if (!import.meta.client) return
        await authStore.waitUntilReady?.()
        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping removeSubscription.")
            return
        }
        console.log("Removing subscription for user:", username)
        const { data, error } = await streamers.unsubscribe(username)
        if (error.value) throw error.value
        if (!data.value) {
            console.error("No data received for removeSubscription.")
            return
        }
        const idx = subscriptions.value.findIndex((sub: any) => sub.streamerUsername === username)
        if (idx !== -1) {
           subscriptions.value.splice(idx, 1)
        } else {
            console.error("Subscription not found in local state.")
        }
        console.log("Removed subscription for user:", username)
    }

    onMounted(async () => {
        if (!import.meta.client) return

        try {
            await fetchSubscriptions()
        } catch (e) {
            console.error("Error fetching subscriptions:", e)
        }
    })
    return {
        subscriptions,
        fetchSubscriptions,
        removeSubscription,
    }
})
