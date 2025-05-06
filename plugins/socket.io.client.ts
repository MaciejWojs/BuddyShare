import { io, Socket } from "socket.io-client";

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

    const BACK_HOST = config.public.BACK_HOST;
    const BACK_PORT = config.public.BACK_PORT;
    const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;

    // --- Publiczny WebSocket ---
    const publicSocketUrl = `ws://${BACK_URL}/public`;
    const publicSocket = io(publicSocketUrl, {
        autoConnect: true,
        reconnection: true,
        withCredentials: true,
        reconnectionDelay: 3000,
    });

    publicSocket.on("connect", () => {
        console.log("Connected to Public WebSocket (Plugin)");
    });

    publicSocket.on("disconnect", (reason) => {
        console.log("Disconnected from Public WebSocket (Plugin):", reason);
    });

    publicSocket.on("connect_error", (error) => {
        console.error("Public WebSocket connection error (Plugin):", error);
    });

    // --- Autoryzowany WebSocket ---
    // Używamy ref, aby umożliwić reaktywne aktualizacje bez redefiniowania provide
    const authSocketRef = ref<Socket | null>(null);
    const authSocketUrl = `ws://${BACK_URL}/auth`;

    const initializeAuthSocket = () => {
        if (authStore.authenticated && !authSocketRef.value) {
            console.log("Initializing Auth WebSocket (Plugin)...");
            const socket = io(authSocketUrl, {
                autoConnect: true,
                reconnection: true,
                withCredentials: true,
                reconnectionDelay: 3000,
            });

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