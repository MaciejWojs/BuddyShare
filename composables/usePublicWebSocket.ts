import { io, Socket } from "socket.io-client";
import type { Stream } from "~/types/Streams";

type EventHandler = (data: any) => void;

// Używamy obiektu zamiast state dla przechowywania handlerów
// aby uniknąć serializacji funkcji przez Nuxt
const eventHandlers: Record<string, EventHandler[]> = {};

export const usePublicWebSocket = () => {
    const socket = useState<Socket | null>("publicSocket", () => null);
    const isConnected = useState<boolean>("public-ws-connected", () => false);
    const config = useRuntimeConfig();
    const BACK_HOST = config.public.BACK_HOST;
    const BACK_PORT = config.public.BACK_PORT;
    const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;
    const socketUrl = `ws://${BACK_URL}/public`;

    const connect = () => {
        if (socket.value?.connected) return;

        const newSocket = io(socketUrl, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
        });

        newSocket.on("connect", () => {
            console.log("Connected to Public WebSocket");
            isConnected.value = true;
            setupEventListeners(newSocket);
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from Public WebSocket");
            isConnected.value = false;
        });

        newSocket.on("exception", (error) => {
            console.error("Public WebSocket error:", error);
        });

        socket.value = newSocket;
    };

    const setupEventListeners = (s: Socket) => {
        for (const [event, handlers] of Object.entries(eventHandlers)) {
            handlers.forEach(handler => s.on(event, handler));
        }
    };

    const on = (event: string, handler: EventHandler) => {
        if (!eventHandlers[event]) {
            eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
        socket.value?.on(event, handler);
    };

    const off = (event: string, handler?: EventHandler) => {
        if (handler) {
            const index = eventHandlers[event]?.indexOf(handler) ?? -1;
            if (index > -1) {
                eventHandlers[event].splice(index, 1);
                socket.value?.off(event, handler);
            }
        } else {
            delete eventHandlers[event];
            socket.value?.off(event);
        }
    };

    const emit = (event: string, data?: any) => {
        if (socket.value?.connected) {
            socket.value.emit(event, data);
        } else {
            console.error("Public WebSocket not connected");
        }
    };

    const disconnect = () => {
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
            isConnected.value = false;
        }
    };

    const joinStream = (streamId: string) => {
        console.log("emitting joinStream", streamId);
        emit("joinStream", streamId)
    };
    const leaveStream = (streamId: string) => emit("leaveStream", streamId);

    // Metody do nasłuchiwania zdarzeń publicznych


    // Dołączanie do chatu publicznego
    const joinChatRoom = (streamId: string) => {
        console.log("emitting joinChatRoom", streamId);
        emit("joinChatRoom", streamId);
    };

    const leaveChatRoom = (streamId: string) => {
        console.log("emitting leaveChatRoom", streamId);
        emit("leaveChatRoom", streamId);
    };

    // // Dodaję metodę do wysyłania wiadomości na czacie publicznym
    // const sendChatMessage = (streamId: string, message: string) => {
    //     emit('sendChatMessage', { streamId: streamId, message: message });
    // };

    // Stream event handlers
    const onViewerUpdate = (handler: (viewerCount: number) => void) => {
        // Upewniamy się, że callback przyjmuje liczbową wartość viewerCount
        const wrappedHandler = (data: any) => {
            // Jeśli otrzymamy liczbę bezpośrednio, przekazujemy ją dalej
            if (typeof data === 'number') {
                handler(data);
            }
            // Jeśli otrzymamy obiekt zawierający viewerCount, wyciągamy wartość
            else if (data && typeof data.viewerCount === 'number') {
                handler(data.viewerCount);
            }
            // W innych przypadkach logujemy błąd, ale nie rzucamy wyjątku
            else {
                console.error('Invalid viewerUpdate data format:', data);
                // Możemy przekazać 0 lub inną wartość domyślną
                handler(0);
            }
        };

        on('viewerUpdate', wrappedHandler);
    };

    const onStreamStarted = (handler: (data: Stream) => void) => {
        on('streamStarted', handler);
    };

    const onStreamEnded = (handler: (data: {
        streamId: string,
        streamer: string,
        finalViewerCount: number
        streamerId: string | number
    }) => void) => {
        on('streamEnded', handler);
    };

    const onFollowerCountUpdate = (handler: (data: {
        streamerId: string,
        count: number
    }) => void) => {
        on('followerCountUpdate', handler);
    };

    const onChatMessageBeta = (streamId: string, handler: (data: {
        userId: string,
        username: string,
        message: string,
        timestamp: string
    }) => void) => {
        console.log('onChatMessageBeta', streamId);

        socket.value?.on(`chat:${streamId}`, (data) => {
            console.log('chat message', data);
            handler(data);
        });
    }

    const onChatMessage = (handler: (data: {
        userId: string;
        username: string;
        text: string;
        timestamp: string;
      }) => void) => {
        on("chatMessage", handler);
      };
    

    // Automatyczne połączenie przy montowaniu komponentu
    onMounted(() => {
        connect();
    });

    return {
        connect,
        disconnect,
        on,
        off,
        emit,
        socket,
        isConnected,
        // Stream management
        joinStream,
        leaveStream,
        // Public room management
        joinChatRoom,
        leaveChatRoom,
        // Dodaję funkcję wysyłania wiadomości
        // sendChatMessage,
        // Stream event handlers
        onViewerUpdate,
        onStreamStarted,
        onStreamEnded,
        onFollowerCountUpdate,
        onChatMessage,
        onChatMessageBeta,
    };
};