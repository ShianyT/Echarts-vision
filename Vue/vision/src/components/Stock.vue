<template>
  <div class="com-container">
    <div class="com-chart" ref="stock_ref"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { useThemeStore } from '@/stores/theme'

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

// 响应式变量
const stock_ref = ref<HTMLElement | null>(null)
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

function screenAdapter() {
  if (!chartInstance || !stock_ref.value) return
  let size = (stock_ref.value.offsetWidth / 100) * 3.6
  // map方法中，无法对空数组进行处理，会自动跳过，返回的仍然是空槽数组，改用Array.from函数解决
  // let adapterSeriesArr = new Array(5).map(() => {
  //   return {
  //     radius: [this.size, this.size * 1.5],
  //   }
  // })
  // {length:5}只是一个普通的对象，但在from函数中会将其转换成一个长度为5的数组
  let adapterSeriesArr = Array.from({ length: 5 }, () => {
    return {
      type: 'pie',
      radius: [size * 2.3, size * 2],
      label: {
        fontSize: size / 2,
        lineHeight: size / 1.5,
      },
    }
  })

  const adapterOption = {
    title: {
      textStyle: {
        fontSize: size,
      },
    },
    series: adapterSeriesArr,
  }
  chartInstance.setOption(adapterOption)
  chartInstance.resize()
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
