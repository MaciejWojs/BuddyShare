import { useStreamsStore } from "#imports";
import { io, Socket } from "socket.io-client";
import type { Stream } from "~/types/Streams";
import { useOnline, useEventListener } from '@vueuse/core';

// Definicja interfejsu dla wtyczki, aby zapewnić typowanie dla $io
declare module '#app' {
    interface NuxtApp {
        $publicSocket: Socket;
        $authSocket: Socket | null; // Może być null, jeśli użytkownik nie jest zalogowany
    }
}

type StreamEnded = {
    streamId: number;
    streamerId: number;
    streamerName: string;
    finalViewerCount: number;
}

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();
    const streamsStore = useStreamsStore();

    const BACK_HOST = config.public.BACK_HOST;
    const BACK_PORT = config.public.BACK_PORT;
    const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;

    // Sprawdź czy plugin został już zainicjalizowany
    if (nuxtApp.$publicSocket) {
        console.log("WebSocket plugin already initialized, skipping...");
        return;
    }

    // Dodajemy system notyfikacji o błędach WebSocket
    const websocketErrors = ref({
        public: null as string | null,
        auth: null as string | null
    });

    const socketsOptions = {
        autoConnect: true,
        reconnection: true,
        withCredentials: true,
        reconnectionAttempts: Infinity,   // Nieskończone próby ponownego połączenia
        reconnectionDelay: 1000,          // Początkowe opóźnienie (ms)
        reconnectionDelayMax: 30000,      // Maksymalne opóźnienie (ms)
        randomizationFactor: 0.5,         // Randomizacja opóźnienia (jitter)
        timeout: 20000,                   // Timeout połączenia (ms)
        transports: ['websocket', 'polling'], // Preferuj WebSocket, z fallbackiem na polling
        forceNew: false,                  // Używaj istniejącego połączenia
        upgrade: true                     // Pozwól na upgrade z polling do WebSocket
    }

    // --- Publiczny WebSocket ---
    const publicSocketUrl = `ws://${BACK_URL}/public`;
    const publicSocket = io(publicSocketUrl, socketsOptions);

    // Zmienne dla monitorowania stanu połączenia
    let publicSocketReconnectAttempts = 0;
    const maxReconnectAttempts = 50;

    publicSocket.on("connect", () => {
        console.log("✅ Connected to Public WebSocket (Plugin)");
        publicSocketReconnectAttempts = 0; // Reset licznika po udanym połączeniu
        websocketErrors.value.public = null; // Wyczyść błąd
    });

    publicSocket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from Public WebSocket (Plugin):", reason);
        
        // Sprawdź czy rozłączenie było zamierzone
        if (reason === "io server disconnect") {
            // Serwer zamknął połączenie, spróbuj ponownie połączyć
            console.log("🔄 Server disconnected, attempting to reconnect...");
            publicSocket.connect();
        }
    });

    publicSocket.on("reconnect", (attemptNumber) => {
        console.log(`🔄 Public WebSocket reconnected after ${attemptNumber} attempts`);
        publicSocketReconnectAttempts = 0;
    });

    publicSocket.on("reconnect_attempt", (attemptNumber) => {
        publicSocketReconnectAttempts = attemptNumber;
        console.log(`🔄 Public WebSocket reconnection attempt #${attemptNumber}`);
        
        if (attemptNumber > maxReconnectAttempts) {
            console.error("❌ Max reconnection attempts reached for Public WebSocket");
            // Można dodać logikę dla powiadomienia użytkownika
        }
    });

    publicSocket.on("reconnect_error", (error) => {
        console.error("❌ Public WebSocket reconnection error:", error);
    });

    publicSocket.on("reconnect_failed", () => {
        console.error("❌ Public WebSocket reconnection failed after all attempts");
        // Możliwość pokazania komunikatu użytkownikowi o problemach z połączeniem
    });

    publicSocket.on("connect_error", (error) => {
        console.error("❌ Public WebSocket connection error (Plugin):", error.message);
        websocketErrors.value.public = "Błąd połączenia z serwerem publicznym";
        
        // Logika dodatkowych prób w przypadku błędów połączenia
        if (publicSocketReconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
                console.log("🔄 Attempting manual reconnection for Public WebSocket...");
                publicSocket.connect();
            }, Math.min(1000 * Math.pow(2, publicSocketReconnectAttempts), 30000));
        }
    });

    publicSocket.on("patchStream", (data: Stream) => {
        streamsStore.updateStream(data);
        console.log("Stream updated from Auth WebSocket (Plugin):", data);
    });

    publicSocket.on("streamEnded", (data: StreamEnded) => {
        console.log("Stream ended from Public WebSocket (Plugin):", data);
        streamsStore.removeStream(data.streamId);
    });

    publicSocket.on("streamStarted", (data: Stream) => {
        streamsStore.addStream(data);
        console.log("Stream started from Public WebSocket (Plugin):", data);
    });

    publicSocket.on('streamStats', (data) => {
        // Pobierz istniejący stream z store
        const streamID = parseInt(data.streamId)
        const stream = streamsStore.getStreamById(streamID);
        if (stream) {
            // Zaktualizuj statystyki streama
            const updatedStream = {
                ...stream,
                viewerCount: data.stats.viewers,
                followerCount: data.stats.followers,
                subscriberCount: data.stats.subscribers,
                chatMessages: data.stats.chatMessages,
                topChatters: data.stats.topChatters
            };
            streamsStore.updateStream(updatedStream);
        }

        // Aktualizuj historię streama przez store
        const history = streamsStore.getHistoryByStreamId(streamID);
        if (history) {
            history.viewers = data.history.viewers;
            history.followers = data.history.followers;
            history.subscribers = data.history.subscribers;
            history.chatMessages = data.history.chatMessages;
            history.topChatters = data.history.topChatters;
        }

        console.log('(Plugin) 🔥 Nowa historia widzów dla streamId', data.streamId, data.history.viewers);
        console.log('Stream stats updated:', data.stats.viewers);
        console.log('Stream history updated:', data.history);
    });

    publicSocket.on("bannedUsersUpdated", (data: { streamId: number, bannedUsers: string[] }) => {
        streamsStore.setBannedUsersForStream(data.streamId, data.bannedUsers);
        console.log("Banned users updated from Public WebSocket (Plugin):", data);
    })
    // --- Autoryzowany WebSocket ---
    // Używamy ref, aby umożliwić reaktywne aktualizacje bez redefiniowania provide
    const authSocketRef = ref<Socket | null>(null);
    const authSocketUrl = `ws://${BACK_URL}/auth`;
    let authSocketReconnectAttempts = 0;

    const initializeAuthSocket = () => {
        if (authStore.authenticated && !authSocketRef.value) {
            console.log("🔌 Initializing Auth WebSocket (Plugin)...");
            const socket = io(authSocketUrl, socketsOptions);

            socket.on("connect", () => {
                console.log("✅ Connected to Auth WebSocket (Plugin)");
                authSocketReconnectAttempts = 0; // Reset licznika po udanym połączeniu
                websocketErrors.value.auth = null; // Wyczyść błąd
            });

            socket.on("disconnect", (reason) => {
                console.log("❌ Disconnected from Auth WebSocket (Plugin):", reason);
                
                // Sprawdź czy rozłączenie było zamierzone
                if (reason === "io server disconnect") {
                    console.log("🔄 Auth server disconnected, attempting to reconnect...");
                    socket.connect();
                } else if (reason === "transport close" || reason === "transport error") {
                    // Połączenie zostało przerwane z powodu problemów sieciowych
                    console.log("🔄 Network issue detected, will attempt reconnection...");
                }
                
                // Nie usuwamy referencji natychmiast - pozwalamy na reconnection
            });

            socket.on("reconnect", (attemptNumber) => {
                console.log(`🔄 Auth WebSocket reconnected after ${attemptNumber} attempts`);
                authSocketReconnectAttempts = 0;
            });

            socket.on("reconnect_attempt", (attemptNumber) => {
                authSocketReconnectAttempts = attemptNumber;
                console.log(`🔄 Auth WebSocket reconnection attempt #${attemptNumber}`);
                
                if (attemptNumber > maxReconnectAttempts) {
                    console.error("❌ Max reconnection attempts reached for Auth WebSocket");
                }
            });

            socket.on("reconnect_error", (error) => {
                console.error("❌ Auth WebSocket reconnection error:", error);
            });

            socket.on("reconnect_failed", () => {
                console.error("❌ Auth WebSocket reconnection failed after all attempts");
                // Czyść referencję tylko po nieudanych próbach reconnection
                if (authSocketRef.value) {
                    authSocketRef.value.removeAllListeners();
                    authSocketRef.value = null;
                }
            });

            socket.on("connect_error", (error) => {
                console.error("❌ Auth WebSocket connection error (Plugin):", error.message);
                websocketErrors.value.auth = "Błąd połączenia z serwerem autoryzacji";
                
                // Logika dodatkowych prób w przypadku błędów połączenia
                if (authSocketReconnectAttempts < maxReconnectAttempts) {
                    setTimeout(() => {
                        console.log("🔄 Attempting manual reconnection for Auth WebSocket...");
                        socket.connect();
                    }, Math.min(1000 * Math.pow(2, authSocketReconnectAttempts), 30000));
                } else {
                    // Po przekroczeniu maksymalnej liczby prób, usuń socket
                    socket.disconnect();
                    if (authSocketRef.value) {
                        authSocketRef.value.removeAllListeners();
                        authSocketRef.value = null;
                    }
                }
            });

            // Przypisz socket do ref, co spowoduje reaktywną aktualizację
            authSocketRef.value = socket;
        } else if (!authStore.authenticated && authSocketRef.value) {
            console.log("🔌 Disconnecting Auth WebSocket (Plugin)...");
            authSocketRef.value.disconnect();
            authSocketRef.value.removeAllListeners();
            authSocketRef.value = null;
            authSocketReconnectAttempts = 0;
        }
    };

    // Monitorowanie stanu połączenia sieciowego za pomocą VueUse
    const isOnline = useOnline();
    
    const handleNetworkChange = () => {
        if (isOnline.value) {
            console.log("🌐 Network is back online, attempting to reconnect sockets...");
            
            if (!publicSocket.connected) {
                publicSocket.connect();
            }
            
            if (authStore.authenticated && authSocketRef.value && !authSocketRef.value.connected) {
                authSocketRef.value.connect();
            }
        } else {
            console.log("🌐 Network went offline, sockets will attempt to reconnect when back online");
        }
    };

    // Obserwuj zmiany stanu sieci (tylko w przeglądarce)
    if (import.meta.client) {
        // Używaj VueUse do monitorowania stanu online/offline
        watch(isOnline, (online) => {
            handleNetworkChange();
        });

        // Używaj VueUse event listener dla cleanup przy zamknięciu strony
        useEventListener(window, 'beforeunload', () => {
            if (publicSocket) {
                publicSocket.removeAllListeners();
                publicSocket.disconnect();
            }
            
            if (authSocketRef.value) {
                authSocketRef.value.removeAllListeners();
                authSocketRef.value.disconnect();
            }
        });
    }

    // Obserwuj stan autentykacji
    watch(() => authStore.authenticated, (isAuth) => {
        initializeAuthSocket();
    }, { immediate: true }); // Uruchom od razu przy ładowaniu wtyczki

    // Udostępnij instancje WebSocket w kontekście Nuxt
    nuxtApp.provide('publicSocket', publicSocket);
    nuxtApp.provide('authSocket', computed(() => authSocketRef.value));
    nuxtApp.provide('websocketErrors', websocketErrors);
});