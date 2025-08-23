<template>
  <div class="com-container" :style="containerStyle">
    <div class="com-chart" ref="hot_ref"></div>
    <span class="iconfont switch-icon switch-left" @click="switchLeft()">&#xe6ef;</span>
    <span class="iconfont switch-icon switch-right" @click="switchRight()">&#xe6ed;</span>
    <div class="second-title">{{ secondTitleName }}</div>
  </div>
</template>

<script setup lang="ts">
// 暴露自适应方法给父组件（全屏切换时调用）
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { getThemeValue } from '@/utils/theme_utils'
import { useThemeStore } from '@/stores/theme'
import { defineProps } from 'vue'

// ================= 类型声明 =================
// 热销商品子项类型
interface HotChild {
  name: string
  value: number
  children?: HotChild[]
}
// 热销商品类型
interface HotType {
  name: string
  children: HotChild[]
}
// socket 类型
interface SocketType {
  registerCallBack: (key: string, cb: (data: any) => void) => void
  unRegisterCallBack: (key: string) => void
  send: (data: any) => void
}

// ================= inject全局依赖 =================
const echarts = inject('echarts') as typeof import('echarts') | undefined
const socket = inject('socket') as SocketType | undefined

// ================= 响应式变量 =================
const hot_ref = ref<HTMLElement | null>(null)
let chartInstance: import('echarts').ECharts | null = null
const allData = ref<HotType[]>([])
const typeIndex = ref<number>(0)

// 获取theme的数据
const theme = computed(() => useThemeStore().theme)
// 获取文件名，注册回调函数
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 显示的二级标题
const secondTitleName = computed(() => {
  if (!allData.value.length) return ''
  return allData.value[typeIndex.value].name
})

// 适配模式：screen（大屏） normal（普通页面）
const props = defineProps({
  mode: {
    type: String,
    default: 'normal',
    validator: (v: string) => ['screen', 'normal'].includes(v),
  },
})

// 局部rem方案：可根据需要自定义fontSize，默认1em=16px
const containerFontSize = ref(16) // 可根据父容器传参或自适应
const containerStyle = computed(() => ({
  fontSize: containerFontSize.value + 'px',
  color: getThemeValue(theme.value as 'chalk' | 'vintage').titleColor,
}))

import { useResize } from '@/utils/useResize'
const { handleResize } = useResize(hot_ref)

// 监听主题theme
watch(theme, () => {
  if (chartInstance) {
    chartInstance?.dispose() // 销毁当前图表
    chartInstance = null
  }
  initChart() // 重新初始化图表
  // rem自适应已交由全局处理
  updateChart() // 更新图表
})

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  // 发送数据给服务器
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'hotproduct',
    value: '',
  })
  // 注册回调函数
  socket?.registerCallBack(fileName, getData)
  window.addEventListener('resize', screenAdapter)
})

onUnmounted(() => {
  // 取消回调函数
  socket?.unRegisterCallBack(fileName)
  window.removeEventListener('resize', screenAdapter)
})

// ================= 图表初始化 =================
function initChart() {
  if (!echarts || !hot_ref.value) return
  if (!chartInstance) chartInstance = echarts.init(hot_ref.value, theme.value as any)
  const initOption = {
    title: {
      text: '热销商品销售额统计',
      left: 20,
      top: 20,
    },
    legend: {
      top: '17%',
      icon: 'circle',
    },
    series: [
      {
        type: 'pie',
        top: '15%',
        label: {
          show: false,
          formatter: '{b} {d}%',
        },
        emphasis: {
          label: {
            show: true,
          },
        },
      },
    ],
  }
  chartInstance.setOption(initOption)
  screenAdapter()
}

// ================= 数据获取回调 =================
async function getData(ret: HotType[]) {
  // const { data: ret } = await proxy.$http.get('hotproduct')
  allData.value = ret
  updateChart()
}

// ================= 图表数据更新 =================
function updateChart() {
  if (!chartInstance || !allData.value.length) return
  const typeData = allData.value[typeIndex.value].children
  const nameArr = typeData.map((item) => item.name)

  const dataOption = {
    legend: {
      data: nameArr,
    },
    tooltip: {
      formatter: (arg: any) => {
        // 保留原有注释
        const arr = arg.data.children
        let sun = 0
        arr.forEach((item: HotChild) => {
          sun += item.value
        })
        let str = ''
        arr.forEach((item: HotChild) => {
          str += `${item.name} : ${((item.value / sun) * 100).toFixed(2)}%<br/>`
        })
        return str
      },
    },
    series: [
      {
        data: typeData,
      },
    ],
  }
  chartInstance.setOption(dataOption)
}

// ================= 切换事件 =================
function switchLeft() {
  typeIndex.value--
  if (typeIndex.value < 0) typeIndex.value = allData.value.length - 1 // 修正越界
  updateChart()
}

function switchRight() {
  typeIndex.value++
  if (typeIndex.value >= allData.value.length) typeIndex.value = 0
  updateChart()
}

// ================= 响应式适配 =================
function screenAdapter() {
  containerFontSize.value = handleResize(chartInstance, props.mode)
  chartInstance?.setOption({
    title: { textStyle: { fontSize: 1.2 + 'em' } },
    legend: { textStyle: { fontSize: 0.8 + 'em' }, itemGap: containerFontSize.value * 1.2 },
    
  })
  chartInstance?.resize()
}

// 暴露自适应方法给父组件（全屏切换时调用）
defineExpose({ screenAdapter })
</script>

<style lang="less" scoped>
.com-chart {
  width: 100%;
  height: 100%;
}
.switch-icon {
  position: absolute;
  z-index: 10;
  top: 55%;
  color: white;
  font-size: 1.6em;
  cursor: pointer;
}
.switch-left {
  left: 5%;
}
.switch-right {
  right: 5%;
}
.second-title {
  position: absolute;
  bottom: 10%;
  right: 10%;
  color: white;
  font-size: 1.2em;
}
</style>
