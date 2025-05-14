import type { UseFetchOptions } from "#app"

export const useApi = () => {
    const config = useRuntimeConfig()
    const host = config.public.BACK_HOST
    if (!host) {
        throw new Error('BACK_HOST is not defined in runtime config')
    }
    const formattedHost = (host.startsWith('http') ? host : `http://${host}`)
    const baseURL = formattedHost || 'http://localhost:5000'

    /**
     * Wykonuje żądanie HTTP
     */
    const request = async <T = any>(
        endpoint: string,
        options: UseFetchOptions<T> = {}
    ) => {
        const { data, error, pending } = await useFetch<T>(endpoint, {
            baseURL,
            credentials: 'include',
            ...options,
        })

        return { data, error, pending }
    }

    /**
     * Autentykacja
     */
    const auth = {
        login: (username: string, passwordHash: string) =>
            request('/auth/login', {
                method: 'POST',
                body: { username, passwordHash }
            }),

        register: (username: string, email: string, password: string) =>
            request('/auth/register', {
                method: 'POST',
                body: { username, email, password }
            }),

        logout: () => request('/auth/logout'),

        getCurrentUser: () => request('/auth/me'),

        test: () => request('/auth/test')
    }

    /**
     * Użytkownicy
     */
    const users = {
        checkIfExists: (username: string) =>
            request(`/users/${username}`),

        getAll: () => request('/users/'),

        getBriefInfo: () => request('/users/brief'),

        getProfile: (username: string) =>
            request(`/users/${username}/profile`),

        updateProfile: (username: string, profileData: { description?: string, profilePicture?: string }) =>
            request(`/users/${username}/profile`, {
                method: 'PATCH',
                body: profileData
            }),

        getSettings: (username: string) =>
            request(`/users/${username}/settings`),

        updateSettings: (username: string, settings: {
            notificationsEnabled?: boolean,
            darkMode?: boolean,
            language?: 'pl' | 'en'
        }) => request(`/users/${username}/settings`, {
            method: 'PATCH',
            body: settings
        }),

        updateSingleSetting: (username: string, settingId: string, value: string) =>
            request(`/users/${username}/settings/${settingId}`, {
                method: 'PATCH',
                body: { value }
            }),

        getRole: (username: string) =>
            request(`/users/${username}/role`),

        changeRole: (username: string, role: 'USER' | 'ADMIN') =>
            request(`/users/${username}/role`, {
                method: 'PATCH',
                body: { role }
            }),

        banUser: (username: string) =>
            request(`/users/${username}/ban`, {
                method: 'PATCH'
            }),

        unbanUser: (username: string) =>
            request(`/users/${username}/unban`, {
                method: 'PATCH'
            }),

        followUser: (username: string) =>
            request(`/users/${username}/follow`, {
                method: 'POST'
            }),

        unfollowUser: (username: string) =>
            request(`/users/${username}/unfollow`, {
                method: 'POST'
            }),

        getFollowers: (username: string) =>
            request(`/users/${username}/followers`),

        getFollowersCount: (username: string) =>
            request(`/users/${username}/followers/count`),

        getFollowing: (username: string) =>
            request(`/users/${username}/following`),

        getFollowingCount: (username: string) =>
            request(`/users/${username}/following/count`),

        getSubscriptions: (username: string) =>
            request(`/users/${username}/subscriptions`),

        getNotifications: (username: string) => {
            console.log("(COMPOSABLES) useApi: getNotifications", username)
            return request(`/users/${username}/notifications`)
        },

        updateNotifications: (username: string, notifications: any[]) =>
            request(`/users/${username}/notifications`, {
                method: 'PUT',
                body: { notifications }
            }),

        deleteNotifications: (username: string, notifications: number[]) =>
            request(`/users/${username}/notifications`, {
                method: 'DELETE',
                body: { notifications }
            }),

        updateNotification: (username: string, notificationId: number, data: any) =>
            request(`/users/${username}/notifications/${notificationId}`, {
                method: 'PATCH',
                body: data
            }),

        deleteNotification: (username: string, notificationId: number) =>
            request(`/users/${username}/notifications/${notificationId}`, {
                method: 'DELETE'
            })
    }

    /**
     * Streamerzy
     */
    const streamers = {
        getAll: () => request('/streamers/'),

        getByUsername: (username: string) =>
            request(`/streamers/${username}`),

        getModerators: (username: string) =>
            request(`/streamers/${username}/moderators`),

        getModerator: (username: string, modUsername: string) =>
            request(`/streamers/${username}/moderators/${modUsername}`),

        addModerator: (username: string, modUsername: string) =>
            request(`/streamers/${username}/moderators/${modUsername}`, {
                method: 'PUT'
            }),

        removeModerator: (username: string, modUsername: string) =>
            request(`/streamers/${username}/moderators/${modUsername}`, {
                method: 'DELETE'
            }),

        getToken: (username: string) =>
            request(`/streamers/${username}/token`),

        updateToken: (username: string) =>
            request(`/streamers/${username}/token`, {
                method: 'PATCH'
            }),

        getSubscribers: (username: string) =>
            request(`/streamers/${username}/subscribers`),

        subscribe: (username: string) =>
            request(`/streamers/${username}/subscribers`, {
                method: 'POST'
            }),

        unsubscribe: (username: string) =>
            request(`/streamers/${username}/subscribers`, {
                method: 'DELETE'
            })
    }

    /**
     * Media i strumienie
     */
    const media = {
        getAllStreams: () => request('/media'),

        getStream: (id: string) => request(`/media/${id}`),

        createStream: (streamData: {
            title: string,
            description?: string,
            thumbnail?: string
        }) => request('/media', {
            method: 'POST',
            body: streamData
        }),

        updateStream: (id: string, streamData: {
            title?: string,
            description?: string,
            thumbnail?: string
        }) => request(`/media/${id}`, {
            method: 'PUT',
            body: streamData
        }),

        patchStream: (id: string, partialData: object) =>
            request(`/media/${id}`, {
                method: 'PATCH',
                body: partialData
            }),

        deleteStream: (id: string) =>
            request(`/media/${id}`, {
                method: 'DELETE'
            })
    }

    const streams = {
        getAll: () => request('/streams'),

        getStream: (username: string, streamId: string) =>
            request(`/streams/${username}/${streamId}`),

        updateStream: (username: string, streamId: string, streamData: {
            title?: string,
            description?: string,
            isPublic?: boolean,
            thumbnail?: string
        }) => request(`/streams/${username}/${streamId}`, {
            method: 'PATCH',
            body: streamData
        }),

        deleteStream: (username: string, streamId: string) =>
            request(`/streams/${username}/${streamId}`, {
                method: 'DELETE'
            }),

        notify: {
            start: () => request('/streams/notify/start'),
            end: () => request('/streams/notify/end')
        },

        getToken: () => request('/streams/token')
    }

    /**
     * Moderatorzy
     */
    const moderators = {
        getModerator: (modUsername: string) =>
            request(`/moderators/${modUsername}`)
    }

    return {
        request,
        auth,
        users,
        streamers,
        media,
        streams,
        moderators
    }
}
