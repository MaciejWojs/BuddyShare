import { io, Socket } from "socket.io-client";
import { useAuthStore } from "~/stores/auth";

type EventHandler = (data: any) => void;
type StreamData = {
    title: string;
    description: string;
    category: string;
};

// Singleton dla WebSocketów - zapewnia pojedynczą instancję socketu dla całej aplikacji
let globalSocket: Socket | null = null;
let isInitializing = false;

// Mapa do śledzenia zarejestrowanych handlerów
const registeredHandlers = new Map<string, Set<EventHandler>>();

// Pomocnicza struktura do deduplikacji wydarzeń
const eventDeduplicationCache = new Map<string, Set<string>>();

export const useAuthWebSocket = () => {
    const authStore = useAuthStore();
    const socket = ref<Socket | null>(null);
    const isConnected = useState<boolean>("auth-ws-connected", () => false);
    const config = useRuntimeConfig();
    const BACK_HOST = config.public.BACK_HOST;
    const BACK_PORT = config.public.BACK_PORT;
    const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;
    const socketUrl = `ws://${BACK_URL}/auth`;

    if (import.meta.client) {
        console.log("Socket URL:", socketUrl);
    }

    const connect = () => {
        if (!import.meta.client) return;
        if (isInitializing) {
            console.log("Socket już w trakcie inicjalizacji, pomijam");
            return;
        }

        if (globalSocket?.connected) {
            console.log("Używam istniejącego połączonego socketu (globalnego)");
            socket.value = globalSocket;
            isConnected.value = true;
            return;
        }

        if (!authStore.authenticated) {
            console.log("Użytkownik nie jest zalogowany, nie nawiązuję połączenia WebSocket");
            return;
        }

        isInitializing = true;
        console.log("Inicjalizacja nowego połączenia WebSocket...");

        const newSocket = io(socketUrl, {
            withCredentials: true,
            reconnection: true,
        });

        newSocket.on("connect", () => {
            console.log("Connected to Auth WebSocket");
            isConnected.value = true;
            // Przypisujemy do globalnego socketu
            globalSocket = newSocket;

            // Aktualizujemy lokalne referencje
            socket.value = newSocket;

            // Konfigurujemy wszystkie istniejące handlery (przeniesione z innych instancji)
            setupEventListeners(newSocket);

            isInitializing = false;
        });

        newSocket.on("disconnect", () => {
            console.log("Disconnected from Auth WebSocket");
            isConnected.value = false;
        });

        newSocket.on("exception", (error) => {
            console.error("Auth WebSocket error:", error);
            isInitializing = false;
        });

        socket.value = newSocket;
    };

    const setupEventListeners = (s: Socket) => {
        for (const [eventName, handlers] of registeredHandlers.entries()) {
            handlers.forEach(handler => {
                s.off(eventName, handler); // Upewniamy się, że nie ma duplikatów
                s.on(eventName, (eventData) => {
                    // Deduplikacja wydarzeń dla tego samego typu eventu
                    const eventDataStr = JSON.stringify(eventData);

                    // Inicjalizujemy cache dla tego typu eventu jeśli nie istnieje
                    if (!eventDeduplicationCache.has(eventName)) {
                        eventDeduplicationCache.set(eventName, new Set());
                    }

                    const eventCache = eventDeduplicationCache.get(eventName)!;

                    // Sprawdzamy czy to samo wydarzenie w krótkim czasie
                    // Używamy hashowania wydarzenia + timestamp aby unikać kolizji
                    const nowMs = Date.now();
                    const eventKey = `${eventDataStr.substring(0, 100)}-${Math.floor(nowMs / 1000)}`;

                    if (eventCache.has(eventKey)) {
                        console.log(`Deduplikacja ${eventName}`);
                        return;
                    }

                    // Zapisujemy w cache na krótki czas
                    eventCache.add(eventKey);

                    // Wywołujemy handler
                    handler(eventData);

                    // Po 10 sekundach usuwamy z cache
                    setTimeout(() => {
                        eventCache.delete(eventKey);
                    }, 10000);

                    // Zarządzanie rozmiarem cache
                    if (eventCache.size > 50) {
                        // Usuwamy najstarsze
                        const entries = Array.from(eventCache);
                        entries.slice(0, 25).forEach(key => eventCache.delete(key));
                    }
                });
            });
        }
    };

    // Usprawniona metoda rejestracji handlerów
    const on = (event: string, handler: EventHandler) => {
        if (!import.meta.client) return;

        // Inicjalizacja struktury danych jeśli nie istnieje
        if (!registeredHandlers.has(event)) {
            registeredHandlers.set(event, new Set());
        }

        // Sprawdzamy czy handler nie jest już zarejestrowany
        const handlersSet = registeredHandlers.get(event)!;

        // Hash funkcji do porównania
        const handlerStr = handler.toString();
        const existingHandlers = Array.from(handlersSet);
        const isDuplicate = existingHandlers.some(h => h.toString() === handlerStr);

        if (!isDuplicate) {
            // Dodajemy do naszej mapy śledzenia
            handlersSet.add(handler);

            // Dodajemy do socketu, jeśli jest aktywny
            if (socket.value?.connected) {
                socket.value.off(event, handler); // Upewniamy się, że nie ma duplikatów
                socket.value.on(event, (data) => {
                    // Deduplikacja wydarzeń jak w setupEventListeners
                    const dataStr = JSON.stringify(data);

                    if (!eventDeduplicationCache.has(event)) {
                        eventDeduplicationCache.set(event, new Set());
                    }

                    const eventCache = eventDeduplicationCache.get(event)!;
                    const nowMs = Date.now();
                    const eventKey = `${dataStr.substring(0, 100)}-${Math.floor(nowMs / 1000)}`;

                    if (eventCache.has(eventKey)) {
                        console.log(`Deduplikacja ${event}`);
                        return;
                    }

                    eventCache.add(eventKey);
                    handler(data);

                    setTimeout(() => {
                        eventCache.delete(eventKey);
                    }, 10000);

                    if (eventCache.size > 50) {
                        const entries = Array.from(eventCache);
                        entries.slice(0, 25).forEach(key => eventCache.delete(key));
                    }
                });
            }

            console.log(`Zarejestrowano handler: ${event}`);
        } else {
            console.log(`Pominięto duplikat handlera: ${event}`);
        }
    };

    const off = (event: string, handler?: EventHandler) => {
        if (!import.meta.client) return;

        if (handler) {
            // Usuwamy konkretny handler
            const handlersSet = registeredHandlers.get(event);
            if (handlersSet) {
                // Znajdujemy handler po zawartości funkcji (toString)
                const handlerStr = handler.toString();
                const existingHandlers = Array.from(handlersSet);
                const matchingHandler = existingHandlers.find(h => h.toString() === handlerStr);

                if (matchingHandler) {
                    handlersSet.delete(matchingHandler);
                    socket.value?.off(event, matchingHandler);
                    console.log(`Usunięto handler dla wydarzenia ${event}`);
                }
            }
        } else {
            // Usuwamy wszystkie handlery dla danego wydarzenia
            registeredHandlers.delete(event);
            socket.value?.off(event);
            console.log(`Usunięto wszystkie handlery dla wydarzenia ${event}`);
        }
    };

    const emit = (event: string, ...data: any[]) => {
        if (!import.meta.client) return;
        
        if (socket.value?.connected) {
            socket.value.emit(event, ...data);
        } else {
            console.error("Auth WebSocket not connected");
        }
    };

    const disconnect = () => {
        if (!import.meta.client) return;
        
        if (socket.value) {
            socket.value.disconnect();
            socket.value = null;
            isConnected.value = false;
        }
    };

    // Stream management
    // const joinStream = (streamId: string) => emit("joinStream", streamId);
    // const leaveStream = (streamId: string) => emit("leaveStream", streamId);
    const startStream = (streamId: string, streamData: StreamData) => {
        if (!import.meta.client) return;
        emit("startStream", streamId, streamData);
    };
    
    const endStream = (streamId: string) => {
        if (!import.meta.client) return;
        emit("endStream", streamId);
    };

    // Follower management
    const followStreamer = (streamerId: string) => {
        if (!import.meta.client) return;
        emit("followStreamer", streamerId);
    };
    
    const unfollowStreamer = (streamerId: string) => {
        if (!import.meta.client) return;
        emit("unfollowStreamer", streamerId);
    };

    // Subscription management
    const subscribeToStreamer = (streamerId: string) => {
        if (!import.meta.client) return;
        emit("subscribeToStreamer", streamerId);
    };
    
    const unsubscribeFromStreamer = (streamerId: string) => {
        if (!import.meta.client) return;
        emit("unsubscribeFromStreamer", streamerId);
    };

    // Chat functionality
    const sendChatMessage = (streamId: string, message: string) => {
        if (!import.meta.client) return;
        
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

    // Stream Events
    const onNewFollower = (handler: (data: { followerId: string; followerName: string }) => void) => {
        if (!import.meta.client) return;
        on("newFollower", handler);
    };
    
    const onNewSubscriber = (handler: (data: { subscriberId: string; subscriberName: string }) => void) => {
        if (!import.meta.client) return;
        on("newSubscriber", handler);
    };
    
    const onStreamNotification = (handler: (data: {
        type: string;
        streamId: string;
        streamer: string;
        streamerName: string;
        title: string;
    }) => void) => {
        if (!import.meta.client) return;
        on("streamNotification", handler);
    };
    
    const onChatMessage = (handler: (data: {
        userId: string;
        username: string;
        message: string;
        timestamp: string;
    }) => void) => {
        if (!import.meta.client) return;
        on("chatMessage", handler);
    };

    if (import.meta.client) {
        onMounted(() => {
            if (authStore.authenticated) {
                connect();
            }
        });

        watch(() => authStore.authenticated, (isAuthenticated) => {
            if (isAuthenticated) {
                connect();
            } else {
                disconnect();
            }
        });
    }

    return {
        connect,
        disconnect,
        on,
        off,
        emit,
        socket,
        isConnected,
        // Stream management
        // joinStream,
        // leaveStream,
        startStream,
        endStream,
        // Follower management
        followStreamer,
        unfollowStreamer,
        // Subscription management
        subscribeToStreamer,
        unsubscribeFromStreamer,
        // Chat functionality
        sendChatMessage,
        // Stream event handlers
        onNewFollower,
        onNewSubscriber,
        onStreamNotification,
        onChatMessage,
    };
};
