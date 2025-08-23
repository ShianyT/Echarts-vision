<template>
  <div class="com-container" :style="containerStyle" @dblclick="revertMap">
    <div class="com-chart" ref="map_ref"></div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted, onUnmounted, computed, watch, inject } from 'vue'
import { getProvinceMapInfo } from '@/utils/map_utils.js'
import { useThemeStore } from '@/stores/theme'
import { defineProps } from 'vue'
import { useResize } from '@/utils/useResize'
// ================= 类型声明 =================
interface MapChild {
  name: string
  value: number
  [key: string]: any
}
interface MapDataType {
  name: string
  children: MapChild[]
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
// 适配模式：screen（大屏） normal（普通页面）
const props = defineProps({
  mode: {
    type: String,
    default: 'normal',
    validator: (v: string) => ['screen', 'normal'].includes(v),
  },
})

const map_ref = ref<HTMLElement | null>(null)
let chartInstance: import('echarts').ECharts | null = null
const allData = ref<MapDataType[]>([])
// 对已点击的省份进行缓存
const mapData: Record<string, boolean> = {}
const containerFontSize = ref(16)
const containerStyle = computed(() => ({
  fontSize: containerFontSize.value + 'px',
  color: '#222',
}))

const { handleResize } = useResize(map_ref)

const theme = computed(() => useThemeStore().theme)
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '') || ''

// 监听主题theme

watch(theme, () => {
  chartInstance?.dispose()
  initChart()
  screenAdapter()
  updateChart()
})

// ================= 生命周期钩子 =================
onMounted(() => {
  initChart()
  // 发送数据给服务器
  socket?.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'map',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  socket?.registerCallBack(fileName, getData)
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  socket?.unRegisterCallBack(fileName)
})

// ================= 图表初始化 =================
async function initChart() {
  if (!echarts || !map_ref.value) return
  chartInstance = echarts.init(map_ref.value, theme.value as any)
  // 获取中国地图的矢量数据
  // http://localhost:8999/static/map/china.json
  // 由于proxy.$http配置的是koa后台路径，故这里无法使用proxy.$http来获取
  const { data: ret } = await axios.get('http://localhost:8999/static/map/china.json')
  // 这里不是使用echarts实例对象，而是直接使用echarts来注册
  echarts.registerMap('chinaMap', ret)
  const initOption = {
    title: {
      text: '商家分布地图',
      left: 20,
      top: 20,
    },
    geo: {
      type: 'map',
      map: 'chinaMap',
      top: '10%',
      bottom: '5%',
      itemStyle: {
        // 地图区域的颜色
        areaColor: '#8fd3e8',
        // 图形的描边颜色
        borderColor: '#001852',
      },
      emphasis: {
        itemStyle: {
          areaColor: '#f1f29c',
          borderColor: '#f7c5a0',
          shadowcolor: 'rgba(0, 0, 0)',
          shadowBlur: 5,
          shadowOffsetY: 5,
        },
        label: {
          color: '#222733',
        },
      },
    },
    legend: {
      bottom: '10%',
      left: '5%',
      // 图例列表的布局朝向。'horizontal'横向排列  'vertical'竖向排列
      orient: 'vertical',
    },
  }
  chartInstance.setOption(initOption)

  // 监听中国地图的点击事件
  // 没有类型声明的警告（TypeScript 的提示，不影响运行），如需彻底消除，可写一个 d.ts 类型声明文件
  chartInstance.on('click', handleMapClick)
  screenAdapter()
}

// ================= 地图点击事件处理 =================
async function handleMapClick(arg: { name: string }) {
  // 为getProvinceMapInfo添加类型声明
  const provinceInfo: { key: string; path: string } = getProvinceMapInfo(arg.name)
  // 若已经在省份地图中再次点击将直接返回
  if (!provinceInfo.key) {
    return
  }
  // 判断缓存列表中是否有该数据，若没有则获取并进行缓存和注册
  else if (!mapData[provinceInfo.key]) {
    const { data: ret } = await axios.get('http://localhost:8999' + provinceInfo.path)
    mapData[provinceInfo.key] = true
    echarts?.registerMap(provinceInfo.key, ret)
  }
  const provinceOption = {
    geo: {
      map: provinceInfo.key,
    },
  }
  chartInstance?.setOption(provinceOption)
}

// ================= 数据获取回调 =================
async function getData(ret: MapDataType[]) {
  // const { data: ret } = await proxy.$http.get('map')
  allData.value = ret
  updateChart()
}

// ================= 图表数据更新 =================
function updateChart() {
  if (!chartInstance || !allData.value.length) return
  // 处理数据
  // 散点图数据
  const seriesArr = allData.value.map((item) => {
    // 返回的是一个类别的所有散点数据
    // 如果要在地图中显示散点数据，需要给散点图增加一个配置，coordinateSystem:'geo'，表示散点图将在地图的基础上使用
    return {
      type: 'effectScatter',
      rippleEffect: {
        scale: 5,
        brushType: 'stroke',
      },
      name: item.name,
      data: item.children,
      coordinateSystem: 'geo',
    }
  })
  // 图例数据
  const legendArr = allData.value.map((item) => item.name)
  const dataOption = {
    legend: {
      data: legendArr,
    },
    series: seriesArr,
  }
  chartInstance.setOption(dataOption)
}

// ================= 响应式适配 =================
function screenAdapter() {
  containerFontSize.value = handleResize(chartInstance, props.mode)
  chartInstance?.setOption({
    title: { textStyle: { fontSize: 1.2 + 'em' } },
    legend: { textStyle: { fontSize: 0.8 + 'em' }, itemGap: containerFontSize.value * 1.2 },
    geo: { emphasis: { label: { fontSize: 0.8 + 'em' } } },
  })
  chartInstance?.resize()
}

// 暴露自适应方法给父组件（全屏切换时调用）
defineExpose({ screenAdapter })

// ================= 返回中国地图 =================
function revertMap() {
  if (!chartInstance) return
  const revertOption = {
    geo: {
      map: 'chinaMap',
    },
  }
  chartInstance.setOption(revertOption)
}
</script>

<style lang="less" scoped>
.com-chart {
  width: 100%;
  height: 100%;
}
</style>
