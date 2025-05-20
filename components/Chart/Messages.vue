<template>
  <div class="chart-container">
    <BaseChart
      :title="'Wiadomości na czacie w czasie'"
      :legend="'Wiadomości'"
      :yAxisName="'Wiadomości'"
      :color="'#C800FF'"
      :areaColor="areaColor"
      :data="messagesData"
      :streamExists="!!stream"
    />
  </div>
</template>

<script setup lang="ts">
import { useStreamsStore } from '@/stores/streams'
import BaseChart from './Base.vue'

const props = defineProps<{ streamerName: string }>()
const streamsStore = useStreamsStore()

const stream = computed(() => streamsStore.getStreamByStreamerName(props.streamerName))

const messagesData = computed((): [Date, number][] => {
  const history = streamsStore.getHistoryByStreamerName(props.streamerName)
  return history?.chatMessages?.map((v: any) => [new Date(v.timestamp), v.count]) || [];
})

const areaColor: any = {
  type: 'linear',
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(200, 0, 255, 0.7)' },
    { offset: 1, color: 'rgba(200, 0, 255, 0.1)' }
  ]
}
</script>

<style scoped>
</style>
