import { type Ref } from 'vue'

export function useResize(ref: Ref<HTMLElement | null, HTMLElement | null>) {
  let fontSize: number
  function handleResize(chartInstance: import('echarts').ECharts | null, mode: String) {
    if (chartInstance && ref.value) {
      const width = ref.value.offsetWidth
      const height = ref.value.offsetHeight
      if (mode === 'screen') {
        fontSize = Math.max(4, Math.min(32, Math.min(width / 20, height / 20)))
      } else {
        fontSize = Math.max(8, Math.min(32, width / 50))
      }
    }
    return fontSize
  }

  return { handleResize }
}
