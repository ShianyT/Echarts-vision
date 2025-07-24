<template>
  <div class="com-container">
    <div class="com-chart" ref="hot_ref"></div>
    <span class="iconfont switch-icon switch-left" @click="switchLeft()" :style="comStyle"
      >&#xe6ef;
    </span>
    <span class="iconfont switch-icon switch-right" @click="switchRight()" :style="comStyle"
      >&#xe6ed;</span
    >
    <div class="second-title" :style="comStyle">{{ secondTitleName }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { getThemeValue } from '@/utils/theme_utils'
import { useThemeStore } from '@/stores/theme'

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
const size = ref<number>(0)

// 获取theme的数据
const theme = computed(() => useThemeStore().theme)
// 获取文件名，注册回调函数
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 显示的二级标题
const secondTitleName = computed(() => {
  if (!allData.value.length) return ''
  return allData.value[typeIndex.value].name
})

// 动态绑定样式
const comStyle = computed(() => {
  return {
    fontSize: size.value + 'px',
    color: getThemeValue(theme.value as 'chalk' | 'vintage').titleColor,
  }
})

// 监听主题theme
watch(theme, () => {
  if (chartInstance) {
    chartInstance?.dispose() // 销毁当前图表
    chartInstance = null
  }
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
    chartName: 'hotproduct',
    value: '',
  })
  screenAdapter()
  window.addEventListener('resize', screenAdapter)
  // 注册回调函数
  socket?.registerCallBack(fileName, getData)
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  socket?.unRegisterCallBack(fileName)
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

// ================= 屏幕自适应 =================
function screenAdapter() {
  if (!chartInstance || !hot_ref.value) return
  size.value = (hot_ref.value.offsetWidth / 100) * 3.6
  const adapterOption = {
    title: {
      textStyle: {
        fontSize: size.value,
      },
    },
    legend: {
      textStyle: {
        fontSize: size.value / 1.6,
      },
      itemWidth: size.value / 1.6,
      itemHeight: size.value,
      itemGap: size.value / 1.2,
    },
    series: [
      {
        type: 'pie',
        radius: size.value * 3.5,
        emphasis: {
          label: {
            textStyle: {
              fontSize: size.value / 2,
            },
          },
          labelLine: {
            show: false,
          },
        },
      },
    ],
  }
  chartInstance.setOption(adapterOption)
  chartInstance.resize()
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

defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped>
.switch-icon {
  position: absolute;
  z-index: 10;
  top: 55%;
  color: white;
  font-size: 26px;
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
  font-size: 20px;
}
</style>
