<script setup lang="ts">
const streamStore = useStreamsStore();
const router = useRouter();
const searchQuery = ref("");

// Funkcja przetwarzająca wyszukiwanie (dummy)
const handleSearch = () => {
  console.log("Wyszukiwanie:", searchQuery.value);
  // Funkcja fikcyjna - nie wykonuje faktycznego wyszukiwania
};

// Przekierowanie do strony streamu
const goToStream = (streamer: string) => {
  router.push(`/user/${streamer}`);
};

// Formatowanie liczby widzów
const formatViewCount = (count: number) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count.toString();
};
</script>
<template>
  <v-container class="py-8">
    <h1 class="text-h4 mb-6 font-weight-bold">Popularne streamy</h1>

    <!-- Pasek wyszukiwania -->
    <v-sheet class="mb-6 search-container">
      <v-text-field
        v-model="searchQuery"
        label="Szukaj streamów..."
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        @keyup.enter="handleSearch"
        prepend-inner-icon="mdi-magnify"
      >
        <template v-slot:append>
          <v-btn
            color="primary"
            @click="handleSearch"
            variant="text"
          >
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </v-sheet>

    <!-- Brak streamów -->
    <v-sheet
      v-if="!streamStore.streams || streamStore.streams.length === 0"
      class="py-12 rounded d-flex flex-column align-center justify-center"
      color="grey-darken-4"
    >
      <v-icon
        size="64"
        color="grey-lighten-1"
        class="mb-4"
        >mdi-television-off</v-icon
      >
      <h3 class="text-h5 text-grey-lighten-1 mb-2">Brak dostępnych streamów</h3>
      <p class="text-body-2 text-grey-lighten-1 text-center">
        Aktualnie nie ma żadnych dostępnych streamów.<br />
        Sprawdź ponownie później.
      </p>
    </v-sheet>

    <v-row>
      <v-col
        v-for="stream in streamStore.streams"
        :key="stream.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          @click="goToStream(stream.username)"
          class="stream-card"
          :class="{ 'live-border': stream.isLive }"
          hover
        >
          <!-- Thumbnail z indykatorem live -->
          <div class="thumbnail-container">
            <v-img
              :src="stream.thumbnailUrl || '/Buddyshare.svg'"
              height="160px"
              cover
              class="stream-thumbnail"
            />
            <v-chip
              v-if="stream.isLive"
              color="red"
              size="small"
              label
              class="live-chip"
            >
              LIVE
            </v-chip>
            <v-chip
              v-else
              color="grey"
              size="small"
              label
              class="live-chip"
            >
              OFFLINE
            </v-chip>

            <!-- Liczba widzów -->
            <div class="viewer-count">
              <v-icon
                size="small"
                color="white"
                >mdi-account</v-icon
              >
              <span>{{ formatViewCount(stream.viewer_count || 0) }}</span>
            </div>
          </div>

          <!-- Informacje o streamie -->
          <v-card-item>
            <div class="d-flex align-center">
              <!-- Avatar streamera -->
              <v-avatar
                class="me-3"
                size="36"
              >
                <v-img :src="stream.user?.avatarUrl || '/Buddyshare.svg'" />
              </v-avatar>

              <!-- Tytuł i autor -->
              <div>
                <v-card-title
                  class="pa-0 text-truncate text-body-1 font-weight-bold"
                >
                  {{ stream.title || "Untitled Stream" }}
                </v-card-title>
                <v-card-subtitle class="pa-0 text-truncate">
                  {{ stream.user?.username || "Unknown User" }}
                </v-card-subtitle>
              </div>
            </div>

            <v-card-text class="pa-0 mt-2 text-caption">
              <div class="d-flex justify-space-between text-disabled">
                <span>{{ stream.category || "No Category" }}</span>
                <!-- Dodaj datę dla nieaktywnych streamów -->
                <span v-if="!stream.isLive && stream.startTime">
                  {{ new Date(stream.startTime).toLocaleDateString() }}
                </span>
              </div>
            </v-card-text>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.stream-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.stream-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.live-border {
  border: 2px solid rgb(var(--v-theme-error));
}

.thumbnail-container {
  position: relative;
}

.stream-thumbnail {
  transition: filter 0.3s;
}

.stream-card:hover .stream-thumbnail {
  filter: brightness(1.1);
}

.live-chip {
  position: absolute;
  top: 10px;
  left: 10px;
  font-weight: bold;
  opacity: 0.9;
}

.viewer-count {
  position: absolute;
  right: 10px;
  bottom: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: white;
}
</style>
