import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export function useEcharts(theme: Ref<string>) {
  const chartRef = ref<HTMLElement | null>(null)
  let chartInstance: import('echarts').ECharts | null = null

  function initChart() {
    const echarts = (window as any).echarts as typeof import('echarts') | undefined
    if (!echarts || !chartRef.value) return
    chartInstance?.dispose()
    chartInstance = echarts.init(chartRef.value, theme.value as any)
  }

  function setOption(option: any) {
    chartInstance?.setOption(option)
  }

  function resize() {
    chartInstance?.resize()
  }

  function dispose() {
    chartInstance?.dispose()
  }

  watch(theme, () => {
    dispose()
    initChart()
  })

  onUnmounted(() => {
    dispose()
  })

  return { chartRef, chartInstance, initChart, setOption, resize, dispose }
} 