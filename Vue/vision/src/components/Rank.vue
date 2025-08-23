<template>
  <div class="com-container" :style="containerStyle">
    <div class="com-chart" ref="rank_ref"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, inject, defineProps } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useResize } from '@/utils/useResize'
// 适配模式：screen（大屏） normal（普通页面）
const props = defineProps({
  mode: {
    type: String,
    default: 'normal',
    validator: (v: string) => ['screen', 'normal'].includes(v),
  },
})

const rank_ref = ref<HTMLElement | null>(null)
const containerFontSize = ref(16)
const containerStyle = computed(() => ({
  fontSize: containerFontSize.value + 'px',
  color: 'inherit',
}))

const { handleResize } = useResize(rank_ref)

// ================= 类型声明 =================
interface RankItem {
  name: string
  value: number
}
interface SocketType {
  registerCallBack: (key: string, cb: (data: any) => void) => void
  unRegisterCallBack: (key: string) => void
  send: (data: any) => void
}

// ================= inject全局依赖 =================
const echarts = inject('echarts') as typeof import('echarts') | undefined
const socket = inject('socket') as SocketType | undefined

// ================= 响应式变量 =================
let chartInstance: import('echarts').ECharts | null = null
const allData = ref<RankItem[]>([])
let startValue = 0
let endValue = startValue + 9
let timerId: ReturnType<typeof setInterval> | null = null

const theme = computed(() => useThemeStore().theme)
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 监听主题theme
watch(theme, () => {
  chartInstance?.dispose()
  initChart()
})

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'rank',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  socket?.registerCallBack(fileName, getData)
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  if (timerId) clearInterval(timerId)
  socket?.unRegisterCallBack(fileName)
})

// ================= 图表初始化 =================
function initChart() {
  if (!echarts || !rank_ref.value) return
  chartInstance = echarts.init(rank_ref.value, theme.value as any)
  const initOption = {
    title: {
      text: '地区销售排行',
      top: 20,
      left: 20,
    },
    // 只在直角坐标系中有效
    grid: {
      top: '35%',
      left: '8%',
      bottom: '5%',
      right: '8%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      name: '销售额/万元',
      nameTextStyle: {
        color: '#aaaaaa',
      },
      type: 'value',
      interval: 80,
      min: 0,
      max: 320,
    },
    series: [
      {
        type: 'bar',
      },
    ],
  }
  chartInstance.setOption(initOption)
  chartInstance.on('mouseover', () => {
    if (timerId) clearInterval(timerId)
  })
  chartInstance.on('mouseout', startInterval)
  screenAdapter()
}

// ================= 数据获取回调 =================
async function getData(ret: RankItem[]) {
  // const { data: ret } = await proxy.$http.get('rank')

  // 对数据进行排序,从大到小
  allData.value = ret.sort((a, b) => b.value - a.value)
  updateChart()
  startInterval()
}

// ================= 图表数据更新 =================
function updateChart() {
  if (!chartInstance || !allData.value.length) return
  const nameArr = allData.value.map((item) => item.name)
  const valueArr = allData.value.map((item) => item.value)
  const dataOption = {
    xAxis: {
      data: nameArr,
    },
    dataZoom: {
      // 隐藏拉动条
      show: false,
      startValue: startValue,
      endValue: endValue,
    },
    series: {
      data: valueArr,
      itemStyle: {
        // color支持回调函数
        color: (arg: any) => {
          if (!echarts) return '#e098c7'
          if (arg.dataIndex < 5) {
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#e098c7' },
              { offset: 1, color: '#8fd3e8' },
            ])
          } else {
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#7bd9a5' },
              { offset: 1, color: '#8fd3e8' },
            ])
          }
        },
      },
    },
  }
  chartInstance.setOption(dataOption)
}

// ================= 响应式适配 =================
function screenAdapter() {
  containerFontSize.value = handleResize(chartInstance, props.mode)
  chartInstance?.setOption({
    title: { textStyle: { fontSize: 1.2 + 'em' } },
    xAxis: { axisLabel: { fontSize: 0.8 + 'em' } },
    yAxis: { axisLabel: { fontSize: 0.8 + 'em' }, nameTextStyle: { fontSize: 0.8 + 'em' } },
    legend: { textStyle: { fontSize: 1 + 'em' }, itemGap: containerFontSize.value * 1.2 },
    series: [{ barWidth: containerFontSize.value, label: { fontSize: 1 + 'em' } }],
  })
  chartInstance?.resize()
}

// ================= 自动轮播 =================
function startInterval() {
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    startValue++
    endValue++
    if (endValue >= allData.value.length) {
      startValue = 0
      endValue = startValue + 9
    }
    updateChart()
  }, 2000)
}

defineExpose({ screenAdapter })
</script>

<style lang="less" scoped>
.com-chart {
  width: 100%;
  height: 100%;
}
</style>
