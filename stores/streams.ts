import { defineStore } from "pinia";
import type { Stream } from "~/types/Streams";

export const useStreamsStore = defineStore("Streams", () => {
  const config = useRuntimeConfig();
  const BACK_HOST = config.public.BACK_HOST;
  const BACK_PORT = config.public.BACK_PORT;
  const BACK_URL = `${BACK_HOST}${BACK_PORT ? `:${BACK_PORT}` : ""}`;
  const endpoint = `http://${BACK_URL}/streams`;
  const headers = useRequestHeaders(["cookie"]);
  const ws = usePublicWebSocket();
  const api = useApi(); // Dodaj useApi

  const streams = ref<Stream[]>([]);
  const streamHistory = ref<
    {
      id: number;
      viewers: any[];
      followers: any[];
      subscribers: any[];
      chatMessages?: any[];
      topChatters?: any[];
    }[]
  >([]);
  const authStore = useAuthStore();

  const fetchStreams = async () => {
    console.log("Fetching streams...");
    const data = await $fetch<Stream[]>(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials: "include",
    });

    streams.value = data;
    streamHistory.value = streams.value.map((stream) => ({
      id: stream.options_id,
      viewers: [],
      followers: [],
      subscribers: [],
      chatMessages: [],
      topChatters: [],
    }));

    // Pobierz miniaturki dla wszystkich streamów
    await fetchStreamThumbnails();

    console.log("Fetched streams:", streams.value);
    if (data.length > 0) {
      console.log("Fetched streams:", data[0]);
    }
  };

  // Funkcja do pobierania miniaturek dla wszystkich streamów
  const fetchStreamThumbnails = async () => {
    console.log("Fetching stream thumbnails...");

    const thumbnailPromises = streams.value.map(async (stream) => {
      try {
        if (stream.username && stream.options_id) {
          const thumbnailUrl = await api.streams.getStreamThumbnail(
            stream.username,
            stream.options_id.toString()
          );

          const streamIndex = streams.value.findIndex(s => s.id === stream.id);
          if (streamIndex !== -1) {
            streams.value[streamIndex].thumbnail = thumbnailUrl || "/Buddyshare.svg";
          }

          console.log(`Thumbnail loaded for ${stream.username}:`, thumbnailUrl);
        }
      } catch (error) {
        console.error(`Failed to load thumbnail for stream ${stream.username}:`, error);
        const streamIndex = streams.value.findIndex(s => s.id === stream.id);
        if (streamIndex !== -1) {
          streams.value[streamIndex].thumbnail = "/Buddyshare.svg";
        }
      }
    });

    await Promise.allSettled(thumbnailPromises);
    console.log("All stream thumbnails processed");
  };

  // Uproszczona funkcja do odświeżania miniaturki
  const refreshThumbnail = async (stream: Stream, clearCache = false) => {
    if (!stream.username || !stream.options_id) return;
    
    try {
      console.log(`Refreshing thumbnail for ${stream.username}...`);
      
      if (clearCache) {
        api.streams.getStreamThumbnail.clear();
      }
      
      const thumbnailUrl = await api.streams.getStreamThumbnail(
        stream.username,
        stream.options_id.toString()
      );

      const streamIndex = streams.value.findIndex(s => s.id === stream.id);
      if (streamIndex !== -1) {
        streams.value[streamIndex].thumbnail = thumbnailUrl || "/Buddyshare.svg";
        console.log(`Thumbnail updated for ${stream.username}:`, thumbnailUrl);
      }
    } catch (error) {
      console.error(`Failed to load thumbnail for stream ${stream.username}:`, error);
      const streamIndex = streams.value.findIndex(s => s.id === stream.id);
      if (streamIndex !== -1) {
        streams.value[streamIndex].thumbnail = "/Buddyshare.svg";
      }
    }
  };

  // Funkcje pomocnicze do zarządzania streamami
  function addStream(stream: Stream) {
    const exists = streams.value.some((s) => s.id === stream.id);
    if (!exists) {
      streams.value.push(stream);
      streamHistory.value.push({
        id: stream.id,
        viewers: [],
        followers: [],
        subscribers: [],
        chatMessages: [],
        topChatters: [],
      });

      // Pobierz miniaturkę dla nowego streamu
      refreshThumbnail(stream);
    }
  }

  function updateStream(updatedStream: Stream) {
    const index = streams.value.findIndex((s) => s.id === updatedStream.id);
    if (index !== -1) {
      streams.value.splice(index, 1, {
        ...streams.value[index],
        ...updatedStream,
      });

      // Odśwież miniaturkę po aktualizacji
      if (updatedStream.username && updatedStream.options_id) {
        console.log(`Stream updated, refreshing thumbnail for ${updatedStream.username}...`);
        nextTick(() => {
          refreshThumbnail(updatedStream, true);
        });
      }
    } else {
      addStream(updatedStream);
      console.log("Stream not found, added instead:", updatedStream);
    }
  }

  function removeStream(streamId: number) {
    if (!streamId) {
      throw new Error("Stream ID is required to remove a stream.");
    }
    console.log("Removing stream with ID:", streamId);
    const index = streams.value.findIndex((s) => {
      console.log("Checking stream:", s.options_id, "against", streamId);
      return s.options_id === streamId;
    });
    console.log("Index to remove stream:", index);
    if (index !== -1) {
      streams.value.splice(index, 1);
      const histIdx = streamHistory.value.findIndex((h) => h.id === streamId);
      console.log("Removing stream:", streamId);
      if (histIdx !== -1) streamHistory.value.splice(histIdx, 1);
    }
  }

  function getStreamByStreamerName(streamerName: string) {
    const foundStream = streams.value.find(
      (stream) => stream.username === streamerName
    );
    if (!foundStream) {
      console.log("getStreamByStreamerName - stream not found");
      return undefined;
    }

    if (foundStream.isPublic) {
      console.log("getStreamByStreamerName - public stream found");
      return foundStream;
    } else {
      if (foundStream.username === authStore.userName) {
        console.log(
          "getStreamByStreamerName - private stream found but user is streamer"
        );
        return foundStream;
      }
      console.log(
        "getStreamByStreamerName - private stream found but user is not streamer"
      );
      return undefined;
    }
  }

  function getStreamById(streamId: number) {
    const foundStream = streams.value.find((stream) => stream.id === streamId);
    if (!foundStream) {
      console.log("getStreamById - stream not found");
      return undefined;
    }
    if (foundStream.isPublic) {
      console.log("getStreamById - public stream found");
      return foundStream;
    } else {
      if (foundStream.username === authStore.userName) {
        console.log(
          "getStreamById - private stream found but user is streamer"
        );
        return foundStream;
      }
      console.log(
        "getStreamById - private stream found but user is not streamer"
      );
      return undefined;
    }
  }

  function getHistoryByStreamerName(streamerName: string) {
    const stream = getStreamByStreamerName(streamerName);
    const foundHistory = streamHistory.value.find(
      (history) => history.id === stream?.options_id
    );
    if (!foundHistory) {
      console.log("getHistoryByStreamerName - history not found");
      return undefined;
    }
    return foundHistory;
  }

  function getHistoryByStreamId(streamId: number) {
    const foundHistory = streamHistory.value.find(
      (history) => history.id === streamId
    );
    if (!foundHistory) {
      console.log("getHistoryByStreamId - history not found");
      return undefined;
    }
    return foundHistory;
  }

  // Funkcja do pobierania pojedynczego streamu
  async function getStream(streamId: string): Promise<Stream | undefined> {
    try {
      const stream = await $fetch<Stream>(`${endpoint}/${streamId}`, {
        method: "GET",
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

  const isStreamerLive = (streamerName: string) => {
    const stream = getStreamByStreamerName(streamerName);
    if (!stream) return false;
    if (stream.isPublic) {
      return true;
    } else {
      if (stream.username === authStore.userName) {
        return true;
      }
      return false;
    }
  };

  const isStreamOwner = () => {
    console.log(
      "VALIDATE STREAM: Checking if user is stream owner:",
      authStore.userName,
      "is in streams:",
      streams.value
    );
    return streams.value.some(
      (stream) => stream.username === authStore.userName
    );
  };

  // Dodaj funkcję do wymuszenia odświeżenia miniaturki po aktualizacji przez użytkownika
  const refreshStreamThumbnail = async (username: string, streamId: string) => {
    const stream = streams.value.find(s => s.username === username && s.options_id.toString() === streamId);
    if (stream) {
      console.log(`Force refreshing thumbnail for ${username}...`);
      await refreshThumbnail(stream, true);
    }
  };

  const isUserBannedFromStream = (streamId: number, username: string): boolean => {
    const stream = streams.value.find(s => s.options_id === streamId);
    return stream ? stream.bannedUsers.includes(username) : false;
  };

  const setBannedUsersForStream = (streamId: number, bannedUsers: string[]) => {
    const stream = streams.value.find(s => s.options_id === streamId);
    if (stream) {
      stream.bannedUsers = bannedUsers;
      console.log(`Banned users updated for stream ${streamId}:`, bannedUsers);
    } else {
      console.warn(`Stream with ID ${streamId} not found for setting banned users.`);
    }
  };

  // Zwracamy dostępne dane i funkcje ze store'a
  return {
    streams,
    streamHistory,
    getStream,
    addStream,
    getStreamById,
    getStreamByStreamerName,
    getHistoryByStreamId,
    getHistoryByStreamerName,
    updateStream,
    removeStream,
    fetchStreams,
    fetchStreamThumbnails,
    refreshStreamThumbnail,
    isUserBannedFromStream,
    setBannedUsersForStream,
    isStreamerLive,
    isStreamOwner,
  };
});
