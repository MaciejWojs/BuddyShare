import type { BanOptions } from "~/types/BanOptions";
import type { ChatAction } from "~/types/ChatAction";
import type { ChatMessage } from "~/types/ChatMessage";

type EventHandler = (data: any) => void;
type StreamData = {
    title: string;
    description: string;
    category: string;
};

// Dodanie typów dla statystyk streamu
type StreamCurrentStats = {
    viewers: number;
    followers: number;
    subscribers: number;
};

type StreamStatsHistory = {
    timestamp: number;
    value: number;
}[];

type StreamStats = {
    streamId: string;
    timestamp: number;
    currentStats: StreamCurrentStats;
    viewerHistory: StreamStatsHistory;
    followerHistory: StreamStatsHistory;
    subscriberHistory: StreamStatsHistory;
};

export const useAuthWebSocket = () => {
    const nuxtApp = useNuxtApp();

    // Pobierz instancję socketu z wtyczki
    // $authSocket jest teraz computed ref zwracającym Socket | null
    const socket = nuxtApp.$authSocket;

    // ComputedRef sprawdzający status połączenia
    const isConnected = computed(() => {
        return socket?.value?.connected ?? false;
    });

    const on = (event: string, handler: EventHandler) => {
        if (!import.meta.client) return;

        // Rejestrujemy handler tylko jeśli socket istnieje
        // watchEffect zapewni, że handler zostanie dodany/usunięty gdy socket się pojawi/zniknie
        watchEffect((onCleanup) => {
            const currentSocket = socket?.value;
            if (currentSocket) {
                console.log(`Registering handler for ${event} on Auth WebSocket`);
                currentSocket.on(event, handler);

                // Funkcja czyszcząca
                onCleanup(() => {
                    if (currentSocket) {
                        console.log(`Unregistering handler for ${event} from Auth WebSocket`);
                        currentSocket.off(event, handler);
                    }
                });
            } else {
                console.log(`Auth WebSocket not available, cannot register handler for ${event}`);
            }
        });
    };

    const off = (event: string, handler?: EventHandler) => {
        if (!import.meta.client) return;

        // Usuwamy bezpośrednio z instancji socketu, jeśli istnieje
        const currentSocket = socket?.value;
        if (currentSocket) {
            currentSocket.off(event, handler);
            console.log(`Handler for ${event} removed from Auth WebSocket`);
        } else {
            console.warn(`Auth WebSocket not available during 'off' for ${event}`);
        }
    };

    const emit = (event: string, ...data: any[]) => {
        const currentSocket = socket?.value;
        if (currentSocket?.connected) {
            currentSocket.emit(event, ...data);
        } else {
            console.error(`Auth WebSocket not connected during 'emit' for ${event}. User might not be logged in or connection failed.`);
        }
    };

    // Stream management
    const startStream = (streamId: string, streamData: StreamData) => {
        emit("startStream", streamId, streamData);
    };

    const endStream = (streamId: string) => {
        emit("endStream", streamId);
    };

    // Chat functionality
    const sendChatMessage = (streamId: string, message: string) => {
        if (!streamId) {
            console.error("Nie podano ID streamu");
            return;
        }
        if (!message) {
            console.error("Nie podano wiadomości do wysłania");
            return;
        }

        emit("sendChatMessage", { streamId, message });
    };

    const onStreamNotification = (handler: (data: {
        id: number;
        type: string;
        streamId?: number;
        streamer?: string;
        streamerName?: string;
        title?: string;
        message: string;
        created_at: string;
        isRead: boolean;
    }) => void) => {
        on("streamNotification", handler);
    };

    const onNotifyStreamer = (handler: (data: {
        streamerId: string;
        message: string;
        streamerName: string;
        createdAt: string;
        isRead: boolean;
    }) => void) => {
        on("notifyStreamer", handler);
    };

    // Stream stats handling
    const onStreamStats = (handler: (stats: StreamStats) => void) => {
        on("streamStats", handler);
        console.log("Registered handler for stream stats:", handler);
    };

    const onChatMessageError = (handler: (data: { message: string }) => void) => {
        on("chatMessageError", handler);
        console.log("chatMessageError: ", handler);
    };

    const banUserInChat = (message: ChatMessage, action: ChatAction, options?: BanOptions) => {
        emit("manageChat", message, action, options);
    }

    const unbanUserInChat = (message: ChatMessage, action: ChatAction, options?: BanOptions) => {
        emit("manageChat", message, action, options);
    }

    const onBanUserStatus = (handler: (data: { message: string, success: boolean }) => void) => {
        on("banUserStatus", handler);
        console.log("banUserStatus: ", handler);
    };

    const onUnBanUserStatus = (handler: (data: { message: string, success: boolean }) => void) => {
        on("unbanUserStatus", handler);
        console.log("unbanUserStatus: ", handler);
    };

    const patchChatMessage = (message: ChatMessage, action: ChatAction) => {
        console.log("emitting patchChatMessage", message.chatMessageId);
        emit("manageChat", message, action);
    };


    return {
        on,
        off,
        emit,
        socket, // Zwracamy computed ref do socketu
        isConnected,
        // Stream management
        startStream,
        endStream,
        // Chat functionality
        sendChatMessage,
        // Stream event handlers
        onStreamNotification,
        onNotifyStreamer,
        // Stream stats handler
        onStreamStats,
        // Chat message handling
        onChatMessageError,
        banUserInChat,
        unbanUserInChat,
        onBanUserStatus,
        onUnBanUserStatus,
        patchChatMessage,
    };
};
