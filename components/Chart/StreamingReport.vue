<template>
  <v-card elevation="1">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-chart-timeline</v-icon>
      Raport streamowania
    </v-card-title>
    
    <v-card-text>
      <div v-if="pending" class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate color="primary" />
      </div>
      
      <div v-else-if="error" class="text-center pa-4">
        <v-alert type="error" variant="tonal">
          Błąd podczas ładowania raportu: {{ error }}
        </v-alert>
      </div>
      
      <div v-else-if="reportData && reportData.length > 0">
        <!-- Podsumowanie -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="primary">
              <v-card-text class="text-center">
                <div class="text-h6 text-primary">{{ reportData.length }}</div>
                <div class="text-caption">Łączna liczba streamów</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-h6 text-success">{{ totalStreamingTime }}</div>
                <div class="text-caption">Łączny czas streamowania</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="info">
              <v-card-text class="text-center">
                <div class="text-h6 text-info">{{ averageStreamTime }}</div>
                <div class="text-caption">Średni czas streama</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="tonal" color="warning">
              <v-card-text class="text-center">
                <div class="text-h6 text-warning">{{ longestStreamTime }}</div>
                <div class="text-caption">Najdłuższy stream</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Tabela z ostatnimi streamami -->
        <v-data-table
          :headers="headers"
          :items="formattedReportData"
          :items-per-page="10"
          class="elevation-1"
          item-value="stream_id"
        >
          <template v-slot:item.duration="{ item }">
            <v-chip
              :color="getDurationColor(item.durationMinutes)"
              size="small"
              variant="tonal"
            >
              {{ item.duration }}
            </v-chip>
          </template>
          
          <template v-slot:item.started_at="{ item }">
            {{ formatDate(item.started_at) }}
          </template>
          
          <template v-slot:item.ended_at="{ item }">
            {{ formatDate(item.ended_at) }}
          </template>
        </v-data-table>

        <!-- Wykres aktywności streamowania -->
        <div class="mt-6">
          <h3 class="text-h6 mb-3">Aktywność streamowania w czasie</h3>
          <v-card variant="outlined">
            <v-card-text>
              <canvas ref="chartCanvas" width="400" height="200"></canvas>
            </v-card-text>
          </v-card>
        </div>
      </div>
      
      <div v-else class="text-center pa-4">
        <v-icon size="64" color="grey-lighten-1">mdi-chart-timeline</v-icon>
        <div class="text-h6 mt-2 text-grey-lighten-1">Brak danych o streamach</div>
        <div class="text-caption text-grey-lighten-1">Rozpocznij streamowanie, aby zobaczyć raport</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface StreamReport {
  stream_id: number;
  started_at: string;
  ended_at: string;
}

interface ApiResponse {
  message: string;
  raport: StreamReport[];
}

const props = defineProps<{
  streamerName: string;
}>();

const { streamers } = useApi();
const chartCanvas = ref<HTMLCanvasElement>();

// Stan komponentu
const reportData = ref<StreamReport[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

// Nagłówki tabeli
const headers = [
  { title: 'ID Streama', key: 'stream_id', align: 'start' as const },
  { title: 'Data rozpoczęcia', key: 'started_at', align: 'start' as const },
  { title: 'Data zakończenia', key: 'ended_at', align: 'start' as const },
  { title: 'Czas trwania', key: 'duration', align: 'center' as const },
];

// Funkcje pomocnicze
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

const calculateDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // w minutach
};

const getDurationColor = (minutes: number) => {
  if (minutes < 30) return 'error';
  if (minutes < 60) return 'warning';
  if (minutes < 120) return 'success';
  return 'primary';
};

// Computed properties
const formattedReportData = computed(() => {
  return reportData.value.map(stream => {
    const durationMinutes = calculateDuration(stream.started_at, stream.ended_at);
    return {
      ...stream,
      duration: formatDuration(durationMinutes),
      durationMinutes
    };
  });
});

const totalStreamingTime = computed(() => {
  const totalMinutes = formattedReportData.value.reduce((sum, stream) => sum + stream.durationMinutes, 0);
  return formatDuration(totalMinutes);
});

const averageStreamTime = computed(() => {
  if (reportData.value.length === 0) return '0min';
  const totalMinutes = formattedReportData.value.reduce((sum, stream) => sum + stream.durationMinutes, 0);
  const average = Math.round(totalMinutes / reportData.value.length);
  return formatDuration(average);
});

const longestStreamTime = computed(() => {
  if (formattedReportData.value.length === 0) return '0min';
  const longest = Math.max(...formattedReportData.value.map(stream => stream.durationMinutes));
  return formatDuration(longest);
});

// Funkcja do tworzenia wykresu
const createChart = () => {
  if (!chartCanvas.value || !reportData.value.length) return;

  const ctx = chartCanvas.value.getContext('2d');
  if (!ctx) return;

  // Grupuj streamy po dniach
  const dailyData = new Map<string, number>();
  
  reportData.value.forEach(stream => {
    const date = new Date(stream.started_at).toISOString().split('T')[0];
    const duration = calculateDuration(stream.started_at, stream.ended_at);
    dailyData.set(date, (dailyData.get(date) || 0) + duration);
  });

  // Sortuj daty
  const sortedDates = Array.from(dailyData.keys()).sort();
  const durations = sortedDates.map(date => dailyData.get(date) || 0);

  // Prosty wykres słupkowy
  const canvas = chartCanvas.value;
  const width = canvas.width;
  const height = canvas.height;
  const maxDuration = Math.max(...durations);
  const barWidth = width / sortedDates.length;

  ctx.clearRect(0, 0, width, height);
  
  // Rysuj słupki
  durations.forEach((duration, index) => {
    const barHeight = (duration / maxDuration) * (height - 40);
    const x = index * barWidth;
    const y = height - barHeight - 20;
    
    ctx.fillStyle = duration > 60 ? '#4CAF50' : duration > 30 ? '#FF9800' : '#F44336';
    ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    
    // Etykiety dat (co trzecia)
    if (index % 3 === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const shortDate = new Date(sortedDates[index]).toLocaleDateString('pl-PL', { 
        month: 'short', 
        day: 'numeric' 
      });
      ctx.fillText(shortDate, x + barWidth / 2, height - 5);
    }
  });
};

// Pobierz dane
const fetchReport = async () => {
  try {
    pending.value = true;
    error.value = null;
    
    const { data, error: apiError } = await streamers.getStreamingRaport(props.streamerName);
    
    if (apiError.value) {
      throw new Error(apiError.value.message || 'Błąd podczas pobierania raportu');
    }
    
    if (data.value?.raport) {
      reportData.value = data.value.raport;
      
      // Utworz wykres po następnym tick-u DOM
      nextTick(() => {
        createChart();
      });
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Nieznany błąd';
  } finally {
    pending.value = false;
  }
};

// Pobierz dane przy montowaniu
onMounted(fetchReport);

// Obserwuj zmiany streamerName
watch(() => props.streamerName, fetchReport);
</script>

<style scoped>
.v-data-table {
  background: transparent;
}
</style>
