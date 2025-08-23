<template>
  <div class="com-container" :style="containerStyle">
    <div class="com-chart" ref="stock_ref"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
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

// ========类型声明===========
interface StockItem {
  name: string
  stock: number
  sales: number
}

interface SocketType {
  registerCallBack: (key: string, cb: (data: any) => void) => void
  unRegisterCallBack: (key: string) => void
  send: (data: any) => void
}

// ========inject全局依赖=========
const echarts = inject('echarts') as typeof import('echarts') | undefined
const socket = inject('socket') as SocketType | undefined

const stock_ref = ref<HTMLElement | null>(null)
const containerFontSize = ref(16)
const containerStyle = computed(() => ({
  fontSize: containerFontSize.value + 'px',
  color: 'inherit',
}))
const { handleResize } = useResize(stock_ref)

let chartInstance: import('echarts').ECharts | null = null
let allData = ref<StockItem[]>([])
let index = 0
let timerId: ReturnType<typeof setInterval> | null = null // 定时器id

const theme = computed(() => useThemeStore().theme)
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 监听主题theme
watch(theme, () => {
  chartInstance?.dispose() // 销毁当前图表
  initChart() // 重新初始化图表
  screenAdapter() // 重新适配屏幕
  updateChart() // 更新图表
})

// 钩子
onMounted(() => {
  initChart()
  // 发送数据给服务器
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'stock',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
  // 注册回调函数
  socket?.registerCallBack(fileName, getData)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  socket?.unRegisterCallBack(fileName)
})

function initChart() {
  if (!echarts || !stock_ref.value) return
  chartInstance = echarts.init(stock_ref.value, theme.value)
  const initOption = {
    title: {
      text: '库存销售量',
      left: 20,
      top: 20,
    },
  }
  chartInstance.setOption(initOption)

  // 鼠标事件监听
  chartInstance.on('mouseover', () => {
    if (timerId) clearInterval(timerId)
  })
  chartInstance.on('mouseout', startInterval)
}

async function getData(ret: StockItem[]) {
  // const { data: ret } = await proxy.$http.get('stock')
  allData.value = ret
  updateChart()
  startInterval()
}

function updateChart() {
  if (!chartInstance || !echarts) return
  const colorArr = [
    ['#dd6b66', '#fc97af'],
    ['#0098d9', '#a5e7f0'],
    ['#ffb248', '#f7f494'],
    ['#22c3aa', '#87f7cf'],
    ['#71669e', '#b6a2de'],
  ]
  const showArr = allData.value.slice(index * 5, index * 5 + 5)
  const seriesArr = showArr.map((item, index) => {
    let x = 25
    let y = 35
    if (index >= 3) {
      x = 37 - 3 * 25
      y = 75
    }
    return {
      type: 'pie',
      center: [`${index * 25 + x}%`, `${y}%`],
      hoverAnimation: false,
      labelLine: {
        show: false,
      },
      data: [
        {
          name: item.name + '\n' + item.sales,
          value: item.sales,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              {
                offset: 0,
                color: colorArr[index][0],
              },
              {
                offset: 1,
                color: colorArr[index][1],
              },
            ]),
          },
          label: {
            show: true,
            position: 'center',
            align: 'center',
          },
        },
        {
          value: item.stock,
          itemStyle: {
            color: '#333843',
          },
        },
      ],
    }
  })

  const dataOption = {
    series: seriesArr,
  }
  chartInstance?.setOption(dataOption)
}

// ================= 响应式适配 =================
function screenAdapter() {
  containerFontSize.value = handleResize(chartInstance, props.mode)
  chartInstance?.setOption({
    title: {
      textStyle: { fontSize: '1.2em' },
    },
    series: Array.from({ length: 5 }, () => ({
      type: 'pie',
      radius: [containerFontSize.value * 2.3, containerFontSize.value * 2],
      label: {
        fontSize: '0.6em',
        lineHeight: containerFontSize.value / 1.2,
      },
    })),
  })
  chartInstance?.resize()
}

function startInterval() {
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    index++
    if (index >= allData.value.length / 5) index = 0
    updateChart()
  }, 5000)
}

defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped></style>
