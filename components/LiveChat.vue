<!--components/LiveChat.vue-->
<template>
  <v-card
    class="d-flex flex-column h-100"
    :color="background"
    flat
  >
    <!-- Nagłówek czatu -->
    <v-card-title class="chat-header py-2 px-4">
      <div class="d-flex align-center justify-space-between w-100">
        <span class="text-subtitle-1">{{ title }}</span>
        <v-chip
          v-if="showOnlineCount"
          variant="tonal"
          color="primary"
          size="small"
        >
          {{ onlineCount }} Online
        </v-chip>
        <slot name="header-actions"></slot>
      </div>
    </v-card-title>

    <!-- Wiadomości czatu -->
    <v-card-text
      class="chat-messages pa-2 flex-grow-1"
      ref="chatContainer"
    >
      <v-list
        lines="two"
        density="compact"
        class="bg-transparent messages-list"
      >
        <template
          v-for="(msg, index) in messages"
          :key="index"
        >
          <!-- Wiadomości użytkownika -->
          <v-list-item
            v-if="msg.type !== 'system'"
            :class="{ 'message-highlight': msg.highlight }"
            @click="onMessageClick(msg, index)"
            @mouseover="onMessageHover(msg, index, true)"
            @mouseleave="onMessageHover(msg, index, false)"
          >
            <!-- Avatar użytkownika -->
            <template #prepend>
              <v-avatar
                size="32"
                class="mr-2"
              >
                <v-img :src="msg.avatar || defaultAvatar" />
              </v-avatar>
            </template>

            <!-- Nagłówek wiadomości z nazwą użytkownika i czasem -->
            <v-list-item-subtitle class="d-flex justify-space-between">
              <span
                class="font-weight-medium"
                :class="getRoleClass(msg.role)"
              >
                {{ msg.user }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ formatTime(msg.time) }}
              </span>
            </v-list-item-subtitle>

            <!-- Treść wiadomości -->
            <v-list-item-title class="text-caption">
              {{ msg.text }}
            </v-list-item-title>

            <!-- Akcje do wiadomości widoczne w trybie moderacji -->
            <template
              v-if="isUserModerator && isHovered === index"
              #append
            >
              <div class="d-flex">
                <v-tooltip
                  location="top"
                  text="Usuń wiadomość"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-delete"
                      density="compact"
                      variant="text"
                      color="error"
                      size="small"
                      @click.stop="onMessageAction('delete', msg, index)"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip
                  location="top"
                  text="Timeout użytkownika"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-timer-off"
                      density="compact"
                      variant="text"
                      color="warning"
                      size="small"
                      @click.stop="onMessageAction('timeout', msg, index)"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip
                  location="top"
                  text="Zbanuj użytkownika"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-account-cancel"
                      density="compact"
                      variant="text"
                      color="error"
                      size="small"
                      @click.stop="onMessageAction('ban', msg, index)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-list-item>

          <!-- Wiadomości systemowe -->
          <v-list-item
            v-else
            class="justify-center text-center"
          >
            <span class="text-caption text-medium-emphasis">
              {{ msg.text }}
            </span>
          </v-list-item>
        </template>
      </v-list>
    </v-card-text>

    <!-- Pole wprowadzania wiadomości -->
    <v-card-actions
      v-if="!readOnly"
      class="chat-input pa-2 px-4"
    >
      <v-text-field
        v-model="newMessage"
        :placeholder="inputPlaceholder"
        variant="outlined"
        density="compact"
        hide-details
        rounded
        bg-color="grey-darken-3"
        class="mt-2"
        @keyup.enter="sendMessage"
      >
        <template #append-inner>
          <v-btn
            :icon="sendIcon"
            variant="text"
            color="primary"
            size="small"
            @click="sendMessage"
          />
        </template>
        <slot name="input-actions"></slot>
      </v-text-field>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  warn,
} from "vue";
import { useState } from "#app"; // Import useState z Nuxt

import type { Moderator } from "@/types/moderator"; // Import typu Moderator

interface ChatMessage {
  user: string;
  text: string;
  time: Date;
  type?: "user" | "system" | "notification";
  role?: "user" | "moderator" | "admin" | "streamer";
  avatar?: string;
  highlight?: boolean;
  id?: string | number;
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
const streamerStatus = useState<any | null>("streamerStatus", () => null);

console.log("Moderator status:", moderatorStatus.value?.moderatorId);

const isUserModerator = !!(
  moderatorStatus.value ||
  administratorStatus.value ||
  streamerStatus.value
);

const props = defineProps({
  messages: {
    type: Array as () => ChatMessage[],
    default: () => [],
  },
  onlineCount: {
    type: [String, Number],
    default: "0",
  },
  title: {
    type: String,
    default: "Live Chat",
  },
  showOnlineCount: {
    type: Boolean,
    default: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
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

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const sendMessage = () => {
  if (newMessage.value.trim()) {
    emit("send-message", {
      text: newMessage.value.trim(),
      time: new Date(),
    });
    newMessage.value = "";
  }
};

const scrollToBottom = async () => {
  if (!chatContainer.value || !props.autoScroll) return;

  await nextTick();
  const container = chatContainer.value;
  container.scrollTop = container.scrollHeight;
};

onMounted(() => {
  scrollToBottom();
});

// Auto-scroll when new messages arrive
watch(
  () => props.messages,
  () => {
    scrollToBottom();
  },
  { deep: true }
);

const onMessageClick = (message: ChatMessage, index: number) => {
  emit("message-click", { message, index });
};

const onMessageHover = (
  message: ChatMessage,
  index: number,
  isHovering: boolean
) => {
  isHovered.value = isHovering ? index : null;
  emit("message-hover", { message, index, isHovering });
};

const onMessageAction = (
  action: string,
  message: ChatMessage,
  index: number
) => {
  // Dodanie informacji o moderatorze do emitowanego zdarzenia
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
</script>

<style lang="scss" scoped>
.chat-messages {
  overflow-y: auto;
  scrollbar-width: thin;
  height: 700px; /* Fixed height to prevent extending */
  max-height: 700px; /* Maximum height */

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
</style>
