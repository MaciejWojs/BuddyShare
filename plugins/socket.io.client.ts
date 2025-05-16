import { useStreamsStore } from "#imports";
import { io, Socket } from "socket.io-client";
import type { Stream } from "~/types/Streams";

// Definicja interfejsu dla wtyczki, aby zapewnić typowanie dla $io
declare module '#app' {
    interface NuxtApp {
        $publicSocket: Socket;
        $authSocket: Socket | null; // Może być null, jeśli użytkownik nie jest zalogowany
    }
}

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig();
    const authStore = useAuthStore();
    const streamsStore = useStreamsStore();

    const BACK_HOST = config.public.BACK_HOST;
    const BACK_PORT = config.public.BACK_PORT;
    const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;

    const socketsOptions = {
        autoConnect: true,
        reconnection: true,
        withCredentials: true,
        reconnectionAttempts: 10,         // Maksymalna liczba prób ponownego połączenia
        reconnectionDelay: 1000,          // Początkowe opóźnienie (ms)
        reconnectionDelayMax: 10000,      // Maksymalne opóźnienie (ms)
        timeout: 20000,                   // Timeout połączenia (ms)
        transports: ['websocket', 'polling'] // Preferuj WebSocket, z fallbackiem na polling
    }

    // --- Publiczny WebSocket ---
    const publicSocketUrl = `ws://${BACK_URL}/public`;
    const publicSocket = io(publicSocketUrl, socketsOptions);

    publicSocket.on("connect", () => {
        console.log("Connected to Public WebSocket (Plugin)");
    });

    publicSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Public WebSocket (Plugin):", reason);
    });

    publicSocket.on("connect_error", (error) => {
        console.error("Public WebSocket connection error (Plugin):", error);
    });

    publicSocket.on("patchStream", (data: Stream) => {
        streamsStore.updateStream(data);
        console.log("Stream updated from Auth WebSocket (Plugin):", data);
    });

    publicSocket.on("streamEnded", (data: Stream) => {
        streamsStore.removeStream(data.options_id);
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
            };
            streamsStore.updateStream(updatedStream);
        }

        // Aktualizuj historię streama przez store
        const history = streamsStore.getHistoryByStreamId(streamID);
        if (history) {
            history.viewers = data.history.viewers;
            history.followers = data.history.followers;
            history.subscribers = data.history.subscribers;
        }

        console.log('(Plugin) 🔥 Nowa historia widzów dla streamId', data.streamId, data.history.viewers);
        console.log('Stream stats updated:', data.stats.viewers);
        console.log('Stream history updated:', data.history);
    });

    // --- Autoryzowany WebSocket ---
    // Używamy ref, aby umożliwić reaktywne aktualizacje bez redefiniowania provide
    const authSocketRef = ref<Socket | null>(null);
    const authSocketUrl = `ws://${BACK_URL}/auth`;

    const initializeAuthSocket = () => {
        if (authStore.authenticated && !authSocketRef.value) {
            console.log("Initializing Auth WebSocket (Plugin)...");
            const socket = io(authSocketUrl, socketsOptions);

            socket.on("connect", () => {
                console.log("Connected to Auth WebSocket (Plugin)");
            });

            socket.on("disconnect", (reason) => {
                console.log("Disconnected from Auth WebSocket (Plugin):", reason);
                // Usuwamy referencję po rozłączeniu
                if (authSocketRef.value) {
                    authSocketRef.value.removeAllListeners(); // Usuń listenery, aby uniknąć wycieków
                    authSocketRef.value = null;
                }
            });

            socket.on("connect_error", (error) => {
                console.error("Auth WebSocket connection error (Plugin):", error);
                // Rozważ próbę ponownego połączenia lub obsługę błędu
                if (authSocketRef.value) {
                    socket.disconnect(); // Rozłącz, jeśli wystąpił błąd połączenia
                    authSocketRef.value = null;
                }
            });

            // Przypisz socket do ref, co spowoduje reaktywną aktualizację
            authSocketRef.value = socket;
        } else if (!authStore.authenticated && authSocketRef.value) {
            console.log("Disconnecting Auth WebSocket (Plugin)...");
            authSocketRef.value.disconnect();
            authSocketRef.value = null;
        }
    };

    // Obserwuj stan autentykacji
    watch(() => authStore.authenticated, (isAuth) => {
        initializeAuthSocket();
    }, { immediate: true }); // Uruchom od razu przy ładowaniu wtyczki

    // Udostępnij instancje WebSocket w kontekście Nuxt tylko raz
    nuxtApp.provide('publicSocket', publicSocket);

    // Używamy gettera, który zawsze zwraca aktualną wartość z ref
    // zamiast wielokrotnie wywoływać provide
    nuxtApp.provide('authSocket', computed(() => authSocketRef.value));
});