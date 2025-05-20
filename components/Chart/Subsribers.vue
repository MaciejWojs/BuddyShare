<template>
  <div class="chart-container">
    <BaseChart
      :title="'Subskrybenci na żywo'"
      :legend="'Subskrybenci'"
      :yAxisName="'Subskrybenci'"
      :color="'#FF7F50'"
      :areaColor="areaColor"
      :data="subscriberData"
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

const subscriberData = computed((): [Date, number][] => {
  const history = streamsStore.getHistoryByStreamerName(props.streamerName)
  return history?.subscribers?.map((v: any) => [new Date(v.timestamp), v.count]) || [];
})

const areaColor: any = {
  type: 'linear',
  x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [
    { offset: 0, color: 'rgba(255, 127, 80, 0.7)' },
    { offset: 1, color: 'rgba(255, 127, 80, 0.1)' }
  ]
}
</script>

<style scoped>
</style>
