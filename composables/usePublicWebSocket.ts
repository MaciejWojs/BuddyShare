import type { Socket } from "socket.io-client";
import type { Stream } from "~/types/Streams";

type EventHandler = (data: any) => void;

export const usePublicWebSocket = () => {
    const nuxtApp = useNuxtApp();
    // Pobierz instancję socketu bezpośrednio z wtyczki
    const socket = nuxtApp.$publicSocket as Socket;

    const isConnected = computed(() => socket?.connected ?? false);

    const on = (event: string, handler: EventHandler) => {
        if (socket) {
            socket.on(event, handler);
        } else {
            console.warn("Public WebSocket not available during 'on'");
        }
    };

    const off = (event: string, handler?: EventHandler) => {
        if (socket) {
            socket.off(event, handler);
        } else {
            console.warn("Public WebSocket not available during 'off'");
        }
    };

    const emit = (event: string, data?: any) => {
        if (socket?.connected) {
            socket.emit(event, data);
        } else {
            console.error("Public WebSocket not connected during 'emit'");
        }
    };

    const joinStream = (streamId: string) => {
        console.log("emitting joinStream", streamId);
        emit("joinStream", streamId)
    };
    const leaveStream = (streamId: string) => emit("leaveStream", streamId);

    // Dołączanie do chatu publicznego
    const joinChatRoom = (streamId: string) => {
        console.log("emitting joinChatRoom", streamId);
        emit("joinChatRoom", streamId);
    };

    const leaveChatRoom = (streamId: string) => {
        console.log("emitting leaveChatRoom", streamId);
        emit("leaveChatRoom", streamId);
    };

    // Stream event handlers
    const onViewerUpdate = (handler: (viewerCount: number) => void) => {
        const wrappedHandler = (data: any) => {
            if (typeof data === 'number') {
                handler(data);
            } else if (data && typeof data.viewerCount === 'number') {
                handler(data.viewerCount);
            } else {
                console.error('Invalid viewerUpdate data format:', data);
                handler(0);
            }
        };
        on('viewerUpdate', wrappedHandler);
    };

    const onStreamStarted = (handler: (data: Stream) => void) => {
        on('streamStarted', handler);
    };

    const onPatchStream = (handler: (data: Stream) => void) => {
        on('patchStream', handler);
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
        // Nasłuchuj na dynamiczny event specyficzny dla pokoju
        on(`chat:${streamId}`, (data) => {
            console.log('chat message', data);
            handler(data);
        });
    }

    const onChatMessage = (handler: (data: {
        userId: string;
        username: string;
        text: string; // Zmieniono z 'message' na 'text' zgodnie z poprzednim kodem
        timestamp: string;
      }) => void) => {
        // Nasłuchuj na ogólny event 'chatMessage'
        on("chatMessage", handler);
      };


    return {
        // Nie zwracamy już connect/disconnect
        on,
        off,
        emit,
        socket, // Zwracamy instancję socketu, jeśli jest potrzebna bezpośrednio
        isConnected,
        // Stream management
        joinStream,
        leaveStream,
        // Public room management
        joinChatRoom,
        leaveChatRoom,
        // Stream event handlers
        onViewerUpdate,
        onStreamStarted,
        onStreamEnded,
        onFollowerCountUpdate,
        onChatMessage,
        onChatMessageBeta,
        onPatchStream,
    };
};