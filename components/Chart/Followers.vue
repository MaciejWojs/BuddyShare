<template>
  <div class="chart-container">
    <BaseChart
      :title="'Obserwujący na żywo'"
      :legend="'Obserwujący'"
      :yAxisName="'Obserwujący'"
      :color="'#FFD700'"
      :areaColor="areaColor"
      :data="followerData"
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

const followerData = computed(() => {
  const history = streamsStore.getHistoryByStreamerName(props.streamerName)
  return history?.followers?.map((v: any) => [new Date(v.timestamp), v.count]) || [];
})

const areaColor = {
  type: 'linear',
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(255, 215, 0, 0.7)' },
    { offset: 1, color: 'rgba(255, 215, 0, 0.1)' }
  ]
}
</script>

<style scoped>
</style>
