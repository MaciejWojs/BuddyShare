export const useFollowsStore = defineStore("Follows", () => {
    const amFollowing = ref([]);
    const whoFollowsMe = ref([]);

    const { users } = useApi();
    const authStore = useAuthStore();

    async function initialize() {
        if (!import.meta.client) return;
        await authStore.waitUntilReady?.();

        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping initialize.");
            return;
        }

        console.log("Initializing Follows Store...");
        await getWhoIMFollowing();
        await getWhoFollowsMe();
    }

    async function getWhoIMFollowing() {
        if (!import.meta.client) return;
        await authStore.waitUntilReady?.();

        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping getWhoIMFollowing.");
            return;
        }

        const { data, error } = await users.getFollowers(authStore.userName!);

        if (error.value) throw error.value;
        if (!data.value) {
            console.error("No data received for getWhoIMFollowing.");
            return;
        }
        amFollowing.value = data.value;
        console.log("Fetched amFollowing:", amFollowing.value);
    }

    async function getWhoFollowsMe() {
        if (!import.meta.client) return;
        await authStore.waitUntilReady?.();

        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping getWhoFollowsMe.");
            return;
        }

        const { data, error } = await users.getFollowing(authStore.userName!);

        if (error.value) throw error.value;
        if (!data.value) {
            console.error("No data received for getWhoFollowsMe.");
            return;
        }
        whoFollowsMe.value = data.value;
        console.log("Fetched whoFollowsMe:", whoFollowsMe.value);
    }

    async function followUser(userName: string) {
        if (!import.meta.client) return;
        await authStore.waitUntilReady?.();
        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping followUser.");
            return;
        }
        try {
            const { data, error } = await users.followUser(userName);
            if (error.value) throw error.value;
            if (!data.value) {
                console.error("No data received for followUser.");
                return;
            }
            console.log("Followed user:", data.value);
            // Update local state
            amFollowing.value.push(data.value);
        } catch (error) {
            console.error("Error following user:", error);
        }
        // await getWhoIMFollowing();
    }

    async function unfollowUser(userName: string) {
        if (!import.meta.client) return;
        await authStore.waitUntilReady?.();
        if (!authStore.authenticated) {
            console.log("User not authenticated, skipping unfollowUser.");
            return;
        }
        try {
            const { data, error } = await users.unfollowUser(userName);
            if (error.value) throw error.value;
            if (!data.value) {
                console.error("No data received for unfollowUser.");
                return;
            }
            console.log("Unfollowed user:", data.value);
            // Update local state
            amFollowing.value = amFollowing.value.filter((user: any) => user.userName !== userName);
        } catch (error) {
            console.error("Error unfollowing user:", error);
        }
        // await getWhoIMFollowing();
    }


    return {
        amFollowing,
        whoFollowsMe,
        initialize,
        getWhoIMFollowing,
        getWhoFollowsMe,
        followUser,
        unfollowUser,
    }
})