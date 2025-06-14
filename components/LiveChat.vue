<!--components/LiveChat.vue-->
<template>
  <v-card class="d-flex flex-column h-100" :color="background" flat>
    <!-- Nagłówek czatu -->
    <v-card-title class="chat-header py-2 px-4">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="text-subtitle-1">{{ title }}</span>
        <!-- <v-chip v-if="showOnlineCount" variant="tonal" color="primary" size="small">
          {{ onlineCount }} Online
        </v-chip> -->
        <slot name="header-actions"></slot>
      </div>
    </v-card-title>

    <!-- Wiadomości czatu -->
    <v-card-text class="chat-messages pa-2 flex-grow-1" ref="chatContainer">
      <!-- Komunikaty o problemach z połączeniem -->
      <v-alert
        v-if="!publicConnected && !authConnected"
        type="error"
        variant="tonal"
        class="mb-2"
        density="compact"
      >
        <template #prepend>
          <v-icon>mdi-wifi-off</v-icon>
        </template>
        <div class="text-caption">
          Brak połączenia z serwerem czatu. Nie można wysyłać ani odbierać wiadomości.
        </div>
      </v-alert>

      <v-alert
        v-else-if="!publicConnected"
        type="warning"
        variant="tonal"
        class="mb-2"
        density="compact"
      >
        <template #prepend>
          <v-icon>mdi-account-multiple-remove</v-icon>
        </template>
        <div class="text-caption">
          Problemy z odbiorem wiadomości. Możesz wysyłać wiadomości, ale mogą nie docierać nowe.
        </div>
      </v-alert>

      <v-alert
        v-else-if="!authConnected && authStore.authenticated"
        type="warning"
        variant="tonal"
        class="mb-2"
        density="compact"
      >
        <template #prepend>
          <v-icon>mdi-send-lock</v-icon>
        </template>
        <div class="text-caption">
          Problemy z wysyłaniem wiadomości. Możesz odbierać wiadomości, ale nie możesz pisać.
        </div>
      </v-alert>

      <v-list lines="two" density="compact" class="bg-transparent messages-list">
        <!-- Skeleton loading wiadomości -->
        <template v-if="isLoading">
          <v-list-item v-for="i in 8" :key="'skeleton-' + i">
            <!-- Avatar placeholder -->
            <template #prepend>
              <v-avatar size="32" class="mr-2 skeleton-bg"></v-avatar>
            </template>

            <!-- Username placeholder -->
            <v-list-item-subtitle class="d-flex justify-space-between mb-1">
              <div class="skeleton-text skeleton-bg" style="width: 80px; height: 16px;"></div>
            </v-list-item-subtitle>

            <!-- Message text placeholder -->
            <v-list-item-title class="text-caption">
              <div class="skeleton-text skeleton-bg mb-1" style="width: 95%; height: 14px;"></div>
              <div class="skeleton-text skeleton-bg" style="width: 70%; height: 14px;"></div>
            </v-list-item-title>
          </v-list-item>
        </template>

        <template v-else v-for="(msg, index) in messages" :key="index">
          <!-- Wiadomości użytkownika -->
          <v-list-item v-if="msg.type !== 'system'" :class="{ 'message-highlight': msg.highlight }"
            @click="onMessageClick(msg, index)" @mouseover="onMessageHover(msg, index, true)"
            @mouseleave="onMessageHover(msg, index, false)">
            <!-- Avatar użytkownika -->
            <template #prepend>
              <v-avatar size="32" class="mr-2">
                <v-img :src="msg.avatar || defaultAvatar" />
              </v-avatar>
            </template>

            <!-- Nagłówek wiadomości z nazwą użytkownika i czasem -->
            <v-list-item-subtitle class="d-flex justify-space-between">
              <span class="font-weight-medium" :class="getRoleClass(msg.role)">
                {{ msg.username }}
              </span>
              <!-- <span class="text-caption text-medium-emphasis">
                {{ formatTime(msg.createdAt) }}
              </span> -->
            </v-list-item-subtitle>

            <!-- Treść wiadomości -->
            <v-list-item-title class="text-caption">
              {{ msg.message }}
            </v-list-item-title>

            <!-- Akcje do wiadomości widoczne w trybie moderacji -->
            <template v-if="isUserModerator && isHovered === index" #append>
              <div class="d-flex">
                <ClientOnly>
                  <v-tooltip location="top" text="Usuń wiadomość">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-delete" density="compact" variant="text" color="error"
                        size="small" @click.stop="onMessageAction(ChatAction.DELETE, msg, index)" />
                    </template>
                  </v-tooltip>

                  <v-tooltip location="top" text="Timeout użytkownika">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-timer-off" density="compact" variant="text" color="warning"
                        size="small" @click.stop="onMessageAction('timeout', msg, index)" />
                    </template>
                  </v-tooltip>

                  <!-- Przycisk Ban/Unban w zależności od statusu użytkownika -->
                  <v-tooltip v-if="!isUserBanned(msg.userId)" location="top" text="Zbanuj użytkownika">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-account-cancel" density="compact" variant="text" color="error"
                        size="small" @click.stop="onMessageAction('ban', msg, index)" />
                    </template>
                  </v-tooltip>

                  <v-tooltip v-else location="top" text="Odbanuj użytkownika">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-account-check" density="compact" variant="text" color="success"
                        size="small" @click.stop="onMessageAction('unban', msg, index)" />
                    </template>
                  </v-tooltip>

                  <!-- Fallback dla ClientOnly -->
                  <template #fallback>
                    <div class="d-flex">
                      <v-btn icon="mdi-delete" density="compact" variant="text" color="error" size="small"
                        @click.stop="onMessageAction(ChatAction.DELETE, msg, index)" />
                      <v-btn icon="mdi-timer-off" density="compact" variant="text" color="warning" size="small"
                        @click.stop="onMessageAction('timeout', msg, index)" />
                      <v-btn v-if="!isUserBanned(msg.userId)" icon="mdi-account-cancel" density="compact" variant="text" color="error" size="small"
                        @click.stop="onMessageAction('ban', msg, index)" />
                      <v-btn v-else icon="mdi-account-check" density="compact" variant="text" color="success" size="small"
                        @click.stop="onMessageAction('unban', msg, index)" />
                    </div>
                  </template>
                </ClientOnly>
              </div>
            </template>
          </v-list-item>

          <!-- Wiadomości systemowe -->
          <v-list-item v-else class="justify-center text-center">
            <span class="text-caption text-medium-emphasis">
              {{ msg.message }}
            </span>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>

    <!-- Pole wprowadzania wiadomości -->
    <v-card-actions v-if="!readOnly" class="chat-input pa-2 px-4">
      <v-text-field 
        v-model="newMessage" 
        :placeholder="inputPlaceholder" 
        variant="outlined" 
        density="compact"
        hide-details 
        rounded 
        bg-color="grey-darken-3" 
        class="mt-2" 
        :disabled="(!authConnected && authStore.authenticated) || !publicConnected"
        @keyup.enter="sendMessage"
      >
        <template #append-inner>
          <v-btn 
            :icon="sendIcon" 
            variant="text" 
            color="primary" 
            size="small" 
            :disabled="(!authConnected && authStore.authenticated) || !publicConnected || !newMessage.trim()"
            @click="sendMessage" 
          />
        </template>
        <slot name="input-actions"></slot>
      </v-text-field>
    </v-card-actions>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="snackbarTimeout" location="bottom right">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, warn } from "vue";
import { useState } from "#app"; // Import useState z Nuxt
import { useEventListener } from '@vueuse/core';

import type { Moderator } from "@/types/moderator"; // Import typu Moderator
import type { ChatMessage } from "~/types/ChatMessage";
import { ChatAction } from "~/types/ChatAction";

const publicWS = usePublicWebSocket();
const streamStore = useStreamsStore();
const authStore = useAuthStore();
const authWS = useAuthWebSocket();
const api = useApi();

const isLoading = ref(true);

// Dodawanie statusów połączenia WebSocket
const publicConnected = computed(() => publicWS.isConnected.value);
const authConnected = computed(() => authWS.isConnected.value);

interface ChatMessageNew extends ChatMessage {
  role?: "user" | "moderator" | "admin" | "streamer";
  highlight?: boolean;
  [key: string]: any; // Dla dodatkowych pól
}

const moderatorStatus = useState<Moderator | null>(
  "moderatorStatus",
  () => null
);
const administratorStatus = useState<any | null>(
  "administratorStatus",
  () => null
);
// const streamerStatus = useState<any | null>("streamerStatus", () => null);

console.log("Moderator status:", moderatorStatus.value?.moderatorId);

const streamerAndStreamingStatus = useState<Boolean>(
  "streamerAndStreamingStatus",
  () => false
);

const isUserModerator = !!(
  moderatorStatus.value ||
  administratorStatus.value ||
  streamerAndStreamingStatus.value
);

const readOnly = computed(() => {
  return !authStore.authenticated;
});

// Funkcja sprawdzająca czy użytkownik jest zbanowany
const isUserBanned = (userID: string) => {
  console.log(`[isUserBanned] Checking if user ${userID} is banned...`);
  const userStringID = String(userID);
  
  return streamStore.isUserBannedFromStream(props.streamId, userStringID);
};

const props = defineProps({
  streamId: {
    type: Number,
    required: true,
  },
  // messages: {
  //   type: Array as () => ChatMessage[],
  //   default: () => [],
  // },
  // onlineCount: {
  //   type: [String, Number],
  //   default: "0",
  // },
  title: {
    type: String,
    default: "Live Chat",
  },
  // showOnlineCount: {
  //   type: Boolean,
  //   default: true,
  // },
  // showModActions: {
  //   type: Boolean,
  //   default: false,
  // },
  background: {
    type: String,
    default: "grey-darken-4",
  },
  inputPlaceholder: {
    type: String,
    default: "Send your message...",
  },
  sendIcon: {
    type: String,
    default: "mdi-send",
  },
  defaultAvatar: {
    type: String,
    default: "/Buddyshare.svg",
  },
  autoScroll: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "send-message",
  "message-action",
  "message-click",
  "message-hover",
]);

const newMessage = ref("");
const isHovered = ref<number | null>(null);
const chatContainer = ref<HTMLElement | null>(null);
const messages = ref<ChatMessageNew[]>([]);

// Snackbar state
const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('error');
const snackbarTimeout = ref(4000);

function showSnackbar(message: string, color = 'error', timeout = 4000) {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbarTimeout.value = timeout;
  snackbar.value = true;
}

const formatTime = (date: Date | string) => {
  try {
    if (typeof date === "string") {
      date = new Date(date);
    }
    // if (!date || isNaN(date.getTime())) {
    //   console.warn("Invalid date provided for formatting:", date);
    //   return "";
    // }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (error) {
    console.warn("Error formatting date:", error);
    return "";
  }
};

const sendMessage = () => {
  if (newMessage.value.trim()) {
    authWS.sendChatMessage(
      String(props.streamId),
      newMessage.value.trim()
    );
    // Dodajemy wiadomość lokalnie
    // messages.value.push({
    //   username: authStore.user?.userInfo?.username || "Me",
    //   text: newMessage.value.trim(),
    //   time: new Date(),
    //   type: "user",
    //   role: moderatorStatus.value ? "moderator" : (administratorStatus.value ? "admin" : (streamerAndStreamingStatus.value ? "streamer" : "user")),
    //   avatar: authStore.user?.userInfo?.profilePicture || props.defaultAvatar,
    // });
    emit("send-message", {
      text: newMessage.value.trim(),
      time: new Date(),
    });
    newMessage.value = "";
    scrollToBottom();
  }
};

const scrollToBottom = async () => {
  if (!chatContainer.value || !props.autoScroll) return;
  await nextTick();
  const container = chatContainer.value;
  container.scrollTop = container.scrollHeight;
};

const onMessageClick = (message: ChatMessageNew, index: number) => {
  emit("message-click", { message, index });
};

const onMessageHover = (
  message: ChatMessageNew,
  index: number,
  isHovering: boolean
) => {
  isHovered.value = isHovering ? index : null;
  emit("message-hover", { message, index, isHovering });
};

const onMessageAction = (
  action: string,
  message: ChatMessageNew,
  index: number
) => {

  if (!isUserModerator) {
    warn("User is not a moderator or admin");
    return;
  }

  emit("message-action", {
    action,
    message,
    index,
    moderator: moderatorStatus.value,
  });
};

const getRoleClass = (role?: string) => {
  if (!role) return "";
  const roleClasses = {
    user: "",
    moderator: "text-success",
    admin: "text-error",
    streamer: "text-primary",
  };
  return roleClasses[role as keyof typeof roleClasses] || "";
};

defineExpose({
  onMessageClick,
  onMessageHover,
  onMessageAction,
  getRoleClass
});

// Dodaj funkcję do pobierania awatara
const getAvatarUrl = async (username: string, currentAvatar?: string) => {
  if (currentAvatar && currentAvatar !== props.defaultAvatar) {
    return currentAvatar;
  }
  
  try {
    const avatarUrl = await api.users.getUserAvatar(username);
    return avatarUrl;
  } catch (error) {
    console.warn(`Nie udało się pobrać awatara dla ${username}:`, error);
    return props.defaultAvatar;
  }
};

// Dodaj reactive mapę awatarów
const avatarCache = ref<Map<string, string>>(new Map());

// Funkcja do pobierania i cache'owania awatara
const getCachedAvatar = async (username: string, currentAvatar?: string) => {
  if (avatarCache.value.has(username)) {
    return avatarCache.value.get(username)!;
  }
  
  const avatarUrl = await getAvatarUrl(username, currentAvatar);
  avatarCache.value.set(username, avatarUrl);
  return avatarUrl;
};

// Auto-scroll when new messages arrive
watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => props.streamId,
  (newStreamId, oldStreamId) => {
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
    if (oldStreamId) {
      publicWS.leaveChatRoom(String(oldStreamId));
    }
    if (newStreamId) {
      publicWS.joinChatRoom(String(newStreamId));
      publicWS.getAllMessages(String(newStreamId));
      publicWS.onAllMessages(async (data) => {
        try {
          if (!data || !Array.isArray(data)) {
            console.warn("[COMPONENT] Invalid messages data received:", data);
            return;
          }
          
          // Pobierz awatary dla wszystkich wiadomości
          const messagesWithAvatars = await Promise.all(
            data.map(async (msg: any) => {
              if (!msg) return null;
              
              const avatarUrl = await getCachedAvatar(msg.username || 'Unknown', msg.avatar);
              return {
                chatMessageId: msg.chatMessageId || null,
                streamId: msg.streamId || null,
                userId: msg.userId || null,
                message: msg.message || '',
                createdAt: msg.createdAt || new Date().toISOString(),
                isDeleted: msg.isDeleted || false,
                username: msg.username || 'Unknown',
                avatar: avatarUrl,
                type: msg.type || 'user',
              };
            })
          );
          
          // Filtruj null wartości
          messages.value = messagesWithAvatars.filter(msg => msg !== null);
          console.log("[COMPONENT] Received all messages:", data);
          scrollToBottom();
        } catch (error) {
          console.error("[COMPONENT] Error processing all messages:", error);
        }
      });
      publicWS.onChatMessage(async (data) => {
        try {
          if (!data) {
            console.warn("[COMPONENT] Invalid message data received:", data);
            return;
          }
          
          // Pobierz awatar dla nowej wiadomości
          const avatarUrl = await getCachedAvatar(data.username || 'Unknown', data.avatar);
          
          // Mapowanie danych z backendu do lokalnego formatu ChatMessage
          const newMessage = {
            chatMessageId: data.chatMessageId || null,
            streamId: data.streamId || null,
            userId: data.userId || null,
            message: data.message || '',
            createdAt: data.createdAt || new Date().toISOString(),
            isDeleted: data.isDeleted || false,
            username: data.username || 'Unknown',
            avatar: avatarUrl,
            type: data.type || 'user',
          };
          
          messages.value.push(newMessage);
          emit("send-message", data);
          console.log("[COMPONENT] Received message:", data);
          scrollToBottom();
        } catch (error) {
          console.error("[COMPONENT] Error processing message:", error);
        }
      });

      authWS.onChatMessageError((data) => {
        console.error("[COMPONENT] Error receiving message:", data);
        showSnackbar(data?.message || 'Błąd podczas wysyłania wiadomości', 'error', 4000);
      });

      authWS.onBanUserStatus((data) => {
        console.log("[COMPONENT] Ban user status:", data);
        if (data.success) {
          showSnackbar(data.message, "success", 4000);
        } else {
          showSnackbar(data.message, "error", 4000);
        }
      });
      
      authWS.onUnBanUserStatus((data) => {
        console.log("[COMPONENT] Ban user status:", data);
        if (data.success) {
          showSnackbar(data.message, "success", 4000);
        } else {
          showSnackbar(data.message, "error", 4000);
        }
      });



      publicWS.onPatchChatMessage((data) => {
        try {
          if (!data || !data.chatMessageId) {
            console.warn("[COMPONENT] Invalid patch message data received:", data);
            return;
          }
          
          console.log("[COMPONENT] Received patch message:", data);
          const index = messages.value.findIndex(
            (msg) => msg && msg.chatMessageId === data.chatMessageId
          );
          
          if (index !== -1) {
            // Zachowaj istniejące właściwości i zaktualizuj nowe
            messages.value[index] = {
              ...messages.value[index],
              ...data
            };
          }
        } catch (error) {
          console.error("[COMPONENT] Error processing patch message:", error);
        }
      });
    }
  },
  { immediate: true }
);

// Funkcja do odświeżania czatu
const refreshChat = async () => {
  console.log("[COMPONENT] Refreshing chat for stream:", props.streamId);
  
  // Wyczyść obecne wiadomości
  messages.value = [];
  
  // Ustaw loading state
  isLoading.value = true;
  
  // Opuść i dołącz ponownie do czatu
  if (props.streamId) {
    publicWS.leaveChatRoom(String(props.streamId));
    await nextTick();
    publicWS.joinChatRoom(String(props.streamId));
    publicWS.getAllMessages(String(props.streamId));
  }
  
  // Reset loading po krótkim czasie
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
};

// Dodajemy nasłuchiwanie na CustomEvent z window za pomocą VueUse
onMounted(() => {
  scrollToBottom();
  
  // Używamy VueUse useEventListener dla automatycznego cleanup
  useEventListener(window, 'refreshChat', (event: CustomEvent) => {
    console.log("[COMPONENT] Received refresh chat event:", event.detail);
    if (event.detail?.streamId === props.streamId) {
      refreshChat();
    }
  });
});
</script>

<style lang="scss" scoped>
.chat-messages {
  overflow-y: auto;
  scrollbar-width: thin;
  height: 700px;
  /* Fixed height to prevent extending */
  max-height: 700px;
  /* Maximum height */

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .messages-list {
    height: 100%;
    overflow: visible;
  }
}

.message-highlight {
  background: rgba(var(--v-theme-primary), 0.08);
  transition: background-color 0.2s ease;
}

.skeleton-bg {
  position: relative;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.1) !important;

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.1) 20%,
        rgba(255, 255, 255, 0.2) 60%,
        rgba(255, 255, 255, 0));
    animation: shimmer 1.5s infinite;
    content: '';
  }
}

.skeleton-text {
  border-radius: 4px;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
