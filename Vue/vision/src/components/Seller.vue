<!-- 商家销量统计的横向柱状图 -->
<template>
  <div class="com-container" :style="containerStyle">
    <div class="com-chart" ref="seller_ref"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, inject } from 'vue'
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

// ================= 类型声明 =================
interface SellerItem {
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
const seller_ref = ref<HTMLElement | null>(null)
const containerFontSize = ref(16)
const containerStyle = computed(() => ({
  fontSize: containerFontSize.value + 'px',
  color: 'inherit',
}))
const { handleResize } = useResize(seller_ref)
let chartInstance: import('echarts').ECharts | null = null
const allData = ref<SellerItem[]>([])
let currentPage = 1 // 当前显示的页数
let totalPage = 0 // 总页数，计算获取
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

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  // 发送数据给服务器
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'seller',
    value: '',
  })
  // 在界面加载完成之后主动进行屏幕大小适配
  screenAdapter()
  window.addEventListener('resize', screenAdapter)
  // 注册回调函数
  socket?.registerCallBack(fileName, getData)
})

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
  // 在组件销毁时，将监听器取消掉
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  socket?.unRegisterCallBack(fileName)
})

// ================= 图表初始化 =================
function initChart() {
  if (!echarts || !seller_ref.value) return
  chartInstance = echarts.init(seller_ref.value, theme.value as any)
  // 对图表初始化配置的控制
  const initOption = {
    title: {
      text: '商家销售统计',
      left: 20,
      top: 20,
    },
    // 坐标轴大小 位置
    grid: {
      top: '20%',
      left: '5%',
      right: '12%',
      bottom: '5%',
      containLabel: true, // 是否包含坐标轴上的文字
    },
    xAxis: {
      name: '销售额/万元',
      type: 'value',
      min: 0,
      max: 250,
    },
    yAxis: {
      type: 'category',
    },
    // 提示框tooltip
    tooltip: {
      // 触发类型：item 数据项图形触发 axis 坐标轴触发
      trigger: 'axis',
      // 坐标轴指示器配置项
      axisPointer: {
        type: 'line',
        // 前后层级，过高会遮挡条目
        z: 0,
        // type为line时有效
        lineStyle: {
          // 线的类型，不指定会是虚线
          type: 'solid',
          color: '#2D3440',
        },
      },
    },
    series: [
      {
        type: 'bar',
        // 标签文字的控制
        label: {
          show: true,
          position: 'right',
          textStyle: {
            color: 'white',
          },
        },
        itemStyle: {
          // barBorderRadius: [0, id, id, 0],
          // echarts内置的颜色渐变器
          color: echarts
            ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                // 根据百分比来设置颜色渐变情况
                // 状态为0时
                { offset: 0, color: '#8fd3e8' },
                { offset: 0.7, color: '#edafda' },
                // 状态为100时
                { offset: 1, color: '#e098c7' },
              ])
            : '#8fd3e8',
        },
      },
    ],
  }
  chartInstance.setOption(initOption)

  // 对鼠标事件进行监听
  chartInstance.on('mouseover', () => {
    if (timerId) clearInterval(timerId)
  })
  chartInstance.on('mouseout', startInterval)
}

// ================= 数据获取回调 =================
async function getData(ret: SellerItem[]) {
  // const { data: ret } = await proxy.$http.get('seller')
  allData.value = ret.sort((a, b) => a.value - b.value) // 从小到大排序
  totalPage = Math.ceil(allData.value.length / 5) // 向上取整函数
  updateChart()
  // 启动定时器
  startInterval()
}

// ================= 图表数据更新 =================
function updateChart() {
  if (!chartInstance || !allData.value.length) return
  const showData = allData.value.slice((currentPage - 1) * 5, currentPage * 5)
  // 使用map和解构赋值将其对象数组分离出来
  const sellerNames = showData.map(({ name }) => name)
  const sellerValues = showData.map(({ value }) => value)

  // 对获取的数据进行配置
  const dataOption = {
    yAxis: {
      data: sellerNames,
    },
    series: [
      {
        data: sellerValues,
      },
    ],
  }
  chartInstance.setOption(dataOption)
}

// ================= 启动定时器 =================
function startInterval() {
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    currentPage++
    if (currentPage > totalPage) currentPage = 1
    updateChart()
  }, 3000)
}

// ================= 响应式适配 =================
function screenAdapter() {
  containerFontSize.value = handleResize(chartInstance, props.mode)
  chartInstance?.setOption({
    title: {
      textStyle: { fontSize: '1.2em' },
    },
    xAxis: {
      axisLabel: { fontSize: '1em' },
      nameTextStyle: { fontSize: '1em', color: '#aaaaaa' },
    },
    yAxis: {
      axisLabel: { fontSize: '1em' },
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          width: containerFontSize.value,
        },
      },
    },
    series: [
      {
        barWidth: containerFontSize.value,
        itemStyle: {
          borderRadius: [0, containerFontSize.value / 2, containerFontSize.value / 2, 0],
        },
        label: { fontSize: '1em' },
      },
    ],
  })
  chartInstance?.resize()
}
defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped></style>
