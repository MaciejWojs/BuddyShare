<template>
    <div class="chart-container">
        <client-only>
            <VChart ref="chartRef" class="chart" :option="chartOptions" autoresize style="width: 100%;" />
        </client-only>
    </div>
</template>

<script setup lang="ts">
import { useStreamsStore } from '@/stores/streams'
import { usePublicWebSocket } from '@/composables/usePublicWebSocket'
import { use } from 'echarts/core'
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    LineChart,
    CanvasRenderer
])

const props = defineProps<{ streamerName: string }>()
const streamsStore = useStreamsStore()

const stream = computed(() => {
    const s = streamsStore.getStreamByStreamerName(props.streamerName)
    console.log('⭐ Fetching stream for:', props.streamerName, s)
    return s
})

// 2) Przygotowanie danych widzów
const viewerData = computed(() => {
    const history = streamsStore.getHistoryByStreamerName(props.streamerName)
    console.log('History:', history?.followers)
    console.log('⭐ Fetching history for:', props.streamerName, history)
    return history?.viewers?.map((v: any) => [new Date(v.timestamp), v.count]) || [];
})


// Ref do komponentu wykresu (opcjonalnie do ręcznego update'u)
const chartRef = ref<any>(null)

// 3) Opcje wykresu z użyciem .value
const chartOptions = computed(() => {
    if (!stream.value) {
        return {
            title: {
                text: 'Brak danych',
                left: 'center',
                textStyle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            backgroundColor: 'transparent'
        }
    }

    return {
        backgroundColor: 'transparent',
        title: {
            text: 'Widzowie na żywo',
            left: 'center',
            textStyle: {
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 'bold'
            }
        },
        legend: {
            data: ['Widzowie'],
            bottom: 0,
            textStyle: {
                color: '#ccc'
            },
            itemGap: 30
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(40, 40, 40, 0.95)',
            borderColor: '#555',
            textStyle: { color: '#fff' },
            padding: [8, 12],
            borderRadius: 4,
            formatter: (params: any) => {
                const date = new Date(params[0].data[0]).toLocaleTimeString()
                let result = `<span style="font-weight:bold">${date}</span><br/>`
                params.forEach((param: any) => {
                    const color = '#6495ED'
                    const count = param.data[1]
                    const name = param.seriesName
                    result += `<span style=\"color:${color}\">◉</span> <span style=\"font-size:14px\">${count} ${name.toLowerCase()}</span><br/>`
                })
                return result
            }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'time',
            axisLine: {
                lineStyle: { color: '#666' }
            },
            axisLabel: {
                color: '#ccc',
                formatter: (value: number) => {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                },
                fontSize: 11,
                margin: 16,
                rotate: 90, // Rotacja etykiet o 90 stopni (pionowo)
                align: 'left', // Wyrównanie do lewej
                verticalAlign: 'middle', // Wyśrodkowanie w pionie
            },
            splitLine: { show: false },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            name: 'Widzowie',
            minInterval: 1,
            nameTextStyle: {
                color: '#ccc',
                fontSize: 13,
                padding: [0, 0, 10, 0]
            },
            axisLine: { lineStyle: { color: '#666' } },
            axisLabel: {
                color: '#ccc',
                fontSize: 11,
                margin: 12
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(100, 100, 100, 0.2)',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                data: viewerData.value,
                type: 'line',
                smooth: true,
                name: 'Widzowie',
                areaStyle: {
                    opacity: 0.6,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(65, 105, 225, 0.7)' },
                            { offset: 1, color: 'rgba(65, 105, 225, 0.1)' }
                        ]
                    }
                },
                lineStyle: {
                    color: '#6495ED',
                    width: 3
                },
                itemStyle: {
                    color: '#6495ED',
                    borderWidth: 2,
                    borderColor: '#ffffff'
                },
                showSymbol: false,
                emphasis: {
                    focus: 'series',
                    itemStyle: {
                        color: '#ffffff',
                        borderColor: '#6495ED',
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(100, 149, 237, 0.7)'
                    }
                },
                markPoint: {
                    symbol: 'circle',
                    symbolSize: 8,
                    label: { show: false },
                    data: [
                        { type: 'max', name: 'Maksimum' },
                        { type: 'min', name: 'Minimum' }
                    ],
                    itemStyle: {
                        color: '#ffffff',
                        borderColor: '#6495ED',
                        borderWidth: 2
                    }
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
