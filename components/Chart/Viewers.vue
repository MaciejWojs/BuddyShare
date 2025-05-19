<template>
  <div class="chart-container">
    <BaseChart
      :title="'Widzowie na żywo'"
      :legend="'Widzowie'"
      :yAxisName="'Widzowie'"
      :color="'#6495ED'"
      :areaColor="areaColor"
      :data="viewerData"
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

const viewerData = computed(() => {
  const history = streamsStore.getHistoryByStreamerName(props.streamerName)
  return history?.viewers?.map((v: any) => [new Date(v.timestamp), v.count]) || [];
})

const areaColor = {
  type: 'linear',
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(65, 105, 225, 0.7)' },
    { offset: 1, color: 'rgba(65, 105, 225, 0.1)' }
  ]
}
</script>

<style scoped>
</style>
