<template>
  <div class="com-container">
    <div class="com-chart" ref="rank_ref"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { useThemeStore } from '@/stores/theme'

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
const rank_ref = ref<HTMLElement | null>(null)
let chartInstance: import('echarts').ECharts | null = null
const allData = ref<RankItem[]>([])
let startValue = 0
let endValue = startValue + 9
let timerId: ReturnType<typeof setInterval> | null = null

const theme = computed(() => useThemeStore().theme)
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 监听主题theme
watch(theme, () => {
  chartInstance?.dispose() // 销毁当前图表
  initChart() // 重新初始化图表
  screenAdapter() // 重新适配屏幕
  updateChart() // 更新图表
})

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  // 发送数据给服务器
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'rank',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
  // 注册回调函数
  socket?.registerCallBack(fileName, getData)
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  if (timerId) clearInterval(timerId)
  // 取消回调函数
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

// ================= 屏幕自适应 =================
function screenAdapter() {
  if (!chartInstance || !rank_ref.value) return
  const size = (rank_ref.value.offsetWidth / 100) * 3.6
  const adapterOption = {
    title: {
      textStyle: {
        fontSize: size,
      },
    },
    xAxis: {
      axisLabel: {
        fontSize: size / 2.5,
      },
    },
    yAxis: {
      axisLabel: {
        fontSize: size / 2.8,
      },
      nameTextStyle: {
        fontSize: size / 2.5,
      },
    },
    series: [
      {
        barWidth: size,
        itemStyle: {
          borderRadius: [size / 2, size / 2, 0, 0],
        },
      },
    ],
  }
  chartInstance.setOption(adapterOption)
  chartInstance.resize()
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

defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped></style>
