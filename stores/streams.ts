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

  const fetchStreams = async () => {
    console.log('Fetching streams...');
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
  }

  onMounted(async () => {
    if (!import.meta.client) return;

    try {
      await fetchStreams();

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

      ws.onPatchStream((data: Stream) => {
        const patchList = Array.isArray(data) ? data : [data];

        patchList.forEach((stream) => {
          const existing = streams.value.find(s => s.id === stream.id);
          if (existing) {
            updateStream(stream);
          } else {
            console.log('🆕 Stream not found, adding instead');
            addStream(stream);
          }
        });
      });


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
      // Splice jest reakcją, która Vue "widzi"
      streams.value.splice(index, 1, {
        ...streams.value[index],
        ...updatedStream
      });
    }
  }


  function removeStream(streamerId: number) {
    const index = streams.value.findIndex(s => s.streamer_id === streamerId);
    if (index !== -1) {
      streams.value.splice(index, 1);
    }
  }

  function getStreamByStreamerName(streamerName: string) {
    const stream = streams.value.find(stream => stream.username === streamerName);
    if (!stream) return undefined;

    if (stream.isPublic) {
      console.log('getStreamByStreamerName - public stream found');
      return stream;
    } else {
      const authStore = useAuthStore();
      if (stream.username === authStore.userName) {
        console.log('getStreamByStreamerName - private stream found but user is streamer');
        return stream;
      }
      console.log('getStreamByStreamerName - private stream found but user is not streamer');
      return undefined;
    }
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
    removeStream,
    fetchStreams
  }
})
