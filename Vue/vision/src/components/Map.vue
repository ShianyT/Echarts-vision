<template>
  <div class="com-container" @dblclick="revertMap">
    <div class="com-chart" ref="map_ref"></div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, getCurrentInstance, onMounted, onUnmounted,computed, watch } from 'vue'
import { getProvinceMapInfo } from '@/utils/map_utils.js'
const { proxy } = getCurrentInstance()

// 获取theme的数据
import { useThemeStore } from '@/stores/theme'
const theme = computed(() => useThemeStore().theme)
// 监听主题theme
watch(theme,() => {
  chartInstance.dispose() // 销毁当前图表
  initChart() // 重新初始化图表
  screenAdapter() // 重新适配屏幕
  updateChart() // 更新图表
})

const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '')
// 注册回调函数
proxy.$socket.registerCallBack(fileName, getData)

let chartInstance = null
let map_ref = ref(null)
let allData = null
// 对已点击的省份进行缓存
let mapData = {}

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'map',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  proxy.$socket.unRegisterCallBack(fileName)
})

async function initChart() {
  chartInstance = proxy.$echarts.init(map_ref.value, theme.value)
  // 获取中国地图的矢量数据
  // http://hocalhost:8999/static/map/china.json
  // 由于proxy.$http配置的是koa后台路径，故这里无法使用proxy.$http来获取
  const { data: ret } = await axios.get('http://localhost:8999/static/map/china.json')
  // 这里不是使用echarts实例对象，而是直接使用echarts来注册
  proxy.$echarts.registerMap('chinaMap', ret)
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
          fontSize: '16',
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

  //监听中国地图的点击事件
  chartInstance.on('click', async (arg) => {
    const provinceInfo = getProvinceMapInfo(arg.name)
    // 若已经在省份地图中再次点击将直接返回
    if (!provinceInfo.key) {
      return
    }
    // 判断缓存列表中是否有该数据，若没有则获取并进行缓存和注册
    else if (!mapData[provinceInfo.key]) {
      const { data: ret } = await axios.get('http://localhost:8999' + provinceInfo.path)
      mapData[provinceInfo.key] = true
      proxy.$echarts.registerMap(provinceInfo.key, ret)
    }

    const provinceOption = {
      geo: {
        map: provinceInfo.key,
      },
    }
    chartInstance.setOption(provinceOption)
  })
}

async function getData(ret) {
  // const { data: ret } = await proxy.$http.get('map')
  allData = ret
  updateChart()
}

function updateChart() {
  // 处理数据
  // 散点图数据
  const seriesArr = allData.map((item) => {
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
  const legendArr = allData.map((item) => {
    return item.name
  })
  const dataOption = {
    legend: {
      data: legendArr,
    },
    series: seriesArr,
  }
  chartInstance.setOption(dataOption)
}

function screenAdapter() {
  const size = (map_ref.value.offsetWidth / 100) * 3.6
  const adapterOption = {
    title: {
      textStyle: {
        fontSize: size,
      },
    },

    legend: {
      itemGap: size / 2,
      itemWidth: size / 2,
      itemHeight: size / 2,
      textStyle: {
        fontSize: size / 2,
      },
    },
  }
  chartInstance.setOption(adapterOption)
  chartInstance.resize()
}

// 返回中国地图
function revertMap() {
  const revertOption = {
    geo: {
      map: 'chinaMap',
    },
  }
  chartInstance.setOption(revertOption)
}

defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped></style>
