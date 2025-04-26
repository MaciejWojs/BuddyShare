import { defineStore } from 'pinia'
import type { Stream } from '~/types/Streams'

export const useStreamsStore = defineStore('Streams', () => {
  const config = useRuntimeConfig()
  const BACK_HOST = config.public.BACK_HOST
  const BACK_PORT = config.public.BACK_PORT
  const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`
  const endpoint = `http://${BACK_URL}/streams`
  const headers = useRequestHeaders(["cookie"]);
  const ws = usePublicWebSocket()
  const streams = ref<Stream[]>([])

  onMounted(async () => {
if (!import.meta.client) return;
    
    try {
      const data = await $fetch<Stream[]>(endpoint, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
      });

      streams.value = data;
      console.log('Fetched streams:', streams.value);

      // Nasłuchiwanie zdarzeń WebSocket dla aktualizacji streamów
      // ws.subscribe('streams', (payload) => {
      //   const event = payload.event;
      //   const stream = payload.data;

      //   if (event === 'create') {
      //     addStream(stream);
      //   } else if (event === 'update') {
      //     updateStream(stream);
      //   } else if (event === 'delete') {
      //     removeStream(stream.id);
      //   }
      // });

      ws.onStreamStarted((data: Stream) => {
        console.log('Stream started:', data);
        addStream(data);
      })

      ws.onStreamEnded((data) => {
        console.log('Stream ended id:', data.streamerId);
        const streamerId = typeof data.streamerId === "number" ? data.streamerId : parseInt(data.streamerId);
        console.log('Stream ended id:', streamerId);
        const stream = streams.value.find(s => s.streamer_id === streamerId);

        console.log('Stream ended:', stream?.id);

        if (stream) {
          removeStream(streamerId);
        }
      })
    } catch (error) {
      console.error('Error fetching streams:', error);
    }
  });

  // Funkcje pomocnicze do zarządzania streamami
  function addStream(stream: Stream) {
    const exists = streams.value.some(s => s.id === stream.id);
    if (!exists) {
      streams.value.push(stream);
    }
  }

  function updateStream(updatedStream: Stream) {
    const index = streams.value.findIndex(s => s.id === updatedStream.id);
    if (index !== -1) {
      streams.value[index] = { ...streams.value[index], ...updatedStream };
    }
  }

  function removeStream(streamerId: number) {
    streams.value = streams.value.filter(s => s.streamer_id !== streamerId);
  }

  function getStreamByStreamerName(streamerName: string) {
    return streams.value.find(stream => stream.username === streamerName);
  }

  // Funkcja do pobierania pojedynczego streamu
  async function getStream(streamId: string): Promise<Stream | undefined> {
    try {
      const stream = await $fetch<Stream>(`${endpoint}/${streamId}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
      });
      return stream;
    } catch (error) {
      console.error(`Error fetching stream ${streamId}:`, error);
      return undefined;
    }
  }

  // Zwracamy dostępne dane i funkcje ze store'a
  return {
    streams,
    getStream,
    addStream,
    getStreamByStreamerName,
    updateStream,
    removeStream
  }
})
