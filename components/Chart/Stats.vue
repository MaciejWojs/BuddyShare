<template>
  <div>
    <v-card elevation="2" class="mb-4">
      <v-card-title class="text-h6 pb-2">
        <v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>
        Ogólne statystyki
      </v-card-title>
      
      <v-card-text v-if="pending">
        <v-skeleton-loader type="article" />
      </v-card-text>
      
      <v-card-text v-else-if="error">
        <v-alert type="error" variant="outlined">
          Nie udało się załadować statystyk
        </v-alert>
      </v-card-text>
      
      <v-card-text v-else-if="stats">
        <v-row dense>
          <!-- Średni czas streamowania -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="text-center pa-4">
              <v-icon size="32" color="blue" class="mb-2">mdi-clock-outline</v-icon>
              <div class="text-h6">{{ stats.averageDuration }}</div>
              <div class="text-caption text-medium-emphasis">Średni czas streama</div>
            </v-card>
          </v-col>
          
          <!-- Liczba moderatorów -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="text-center pa-4">
              <v-icon size="32" color="green" class="mb-2">mdi-shield-account</v-icon>
              <div class="text-h6">{{ stats.moderatorsCount }}</div>
              <div class="text-caption text-medium-emphasis">Moderatorzy</div>
            </v-card>
          </v-col>
          
          <!-- Zbanowani użytkownicy -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="text-center pa-4">
              <v-icon size="32" color="red" class="mb-2">mdi-account-cancel</v-icon>
              <div class="text-h6">{{ stats.bannedUsers }}</div>
              <div class="text-caption text-medium-emphasis">Zbanowani użytkownicy</div>
            </v-card>
          </v-col>
          
          <!-- Top chatterzy -->
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="text-center pa-4">
              <v-icon size="32" color="orange" class="mb-2">mdi-message-text</v-icon>
              <div class="text-h6">{{ stats.topChatUsers?.length || 0 }}</div>
              <div class="text-caption text-medium-emphasis">Aktywni chatterzy</div>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Top chatterzy - szczegóły -->
        <v-divider class="my-4" />
        
        <div v-if="stats.topChatUsers && stats.topChatUsers.length > 0">
          <v-card-subtitle class="text-h6 pa-0 mb-3">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Najbardziej aktywni chatterzy
          </v-card-subtitle>
          
          <v-list density="compact">
            <v-list-item
              v-for="(user, index) in stats.topChatUsers.slice(0, 5)"
              :key="user.user_id"
              class="px-0"
            >
              <template #prepend>
                <v-avatar :color="getRankColor(index)" size="32" class="mr-3">
                  <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ user.username }}</v-list-item-title>
              
              <template #append>
                <v-chip size="small" variant="outlined">
                  {{ user.message_count }} wiadomości
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
interface TopChatUser {
  user_id: number
  username: string
  message_count: number
}

interface Stats {
  averageDuration: string
  bannedUsers: number
  moderatorsCount: number
  topChatUsers: TopChatUser[]
}

interface StatsResponse {
  message: string
  stats: Stats
}

interface Props {
  streamerName: string
}

const props = defineProps<Props>()

const { getAllStats } = useApi().streamers

// Pobierz statystyki
const { data, error, pending } = await getAllStats(props.streamerName)

const stats = computed(() => {
  if (!data.value) return null
  const response = data.value as StatsResponse
  return response.stats
})

// Funkcja do określenia koloru rankingu
const getRankColor = (index: number) => {
  switch (index) {
    case 0: return 'gold'
    case 1: return 'silver' 
    case 2: return 'bronze'
    default: return 'grey'
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>