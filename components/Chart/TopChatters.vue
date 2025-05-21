<template>
  <div class="chart-container">
    <client-only>
      <v-chart ref="chartRef" class="chart" :option="chartOptions" autoresize style="width: 100%;" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useStreamsStore } from '@/stores/streams'

use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer
])

const props = defineProps<{ streamerName: string; title?: string }>()
const streamsStore = useStreamsStore()

const topChatters = computed(() => {
  const history = streamsStore.getHistoryByStreamerName(props.streamerName)
  
  // Jeśli topChatters to tablica z czasami i użytkownikami, przetwarzamy ją
  if (history?.topChatters && Array.isArray(history.topChatters)) {
    // Sprawdzamy czy dane mają format z timestamp i users
    if (history.topChatters[0]?.timestamp && history.topChatters[0]?.users) {
      // Pobierz najnowszy zapis (ostatni element tablicy)
      const latestData = history.topChatters[history.topChatters.length - 1];
      return latestData?.users || [];
    }
    // Jeśli dane są już w oczekiwanym formacie
    return history.topChatters;
  }
  
  return [];
})

const chartRef = ref<any>(null)

const chartOptions = computed(() => {
  const usernames = topChatters.value.map(u => u.username)
  const counts = topChatters.value.map(u => u.count)
  return {
    backgroundColor: 'transparent',
    title: {
      text: props.title || 'Top Chatters',
      left: 'center',
      textStyle: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(40, 40, 40, 0.95)',
      borderColor: '#555',
      textStyle: { color: '#fff' },
      padding: [8, 12],
      borderRadius: 4,
      formatter: (params: any) => {
        const param = params[0]
        return `<span style='font-weight:bold'>${param.name}</span><br/>Wiadomości: <b>${param.value}</b>`
      }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '12%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: usernames,
      axisLine: { lineStyle: { color: '#666' } },
      axisLabel: { color: '#ccc', fontSize: 12, rotate: 20 },
    },
    yAxis: {
      type: 'value',
      name: 'Wiadomości',
      minInterval: 1,
      nameTextStyle: { color: '#ccc', fontSize: 13, padding: [0, 0, 10, 0] },
      axisLine: { lineStyle: { color: '#666' } },
      axisLabel: { color: '#ccc', fontSize: 12 },
      splitLine: { show: true, lineStyle: { color: 'rgba(100,100,100,0.2)', type: 'dashed' } }
    },
    series: [
      {
        data: counts,
        type: 'bar',
        name: 'Wiadomości',
        itemStyle: {
          color: '#7d5bbe',
          borderRadius: [6, 6, 0, 0]
        },
        barWidth: '40%',
        emphasis: {
          itemStyle: {
            color: '#a084e8'
          }
        },
        label: {
          show: true,
          position: 'top',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 13
        }
      }
    ]
  }
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 350px;
  padding: 20px 10px 10px 10px;
  border-radius: 12px;
  background-color: rgba(30, 30, 30, 0.5);
  margin: 15px 0;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}
.chart {
  width: 100%;
  height: 100%;
  max-width: 100%;
  display: block;
}
</style>
