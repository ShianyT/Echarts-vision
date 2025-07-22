<template>
  <div class="com-container">
    <div class="com-chart" ref="rank_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted, computed, watch } from 'vue'
// 获取theme的数据
import { useThemeStore } from '@/stores/theme'
const theme = computed(() => useThemeStore().theme)
// 监听主题theme
watch(theme, () => {
  chartInstance.dispose() // 销毁当前图表
  initChart() // 重新初始化图表
  screenAdapter() // 重新适配屏幕
  updateChart() // 更新图表
})
const { proxy } = getCurrentInstance()

const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '')
// 注册回调函数
proxy.$socket.registerCallBack(fileName, getData)

let chartInstance = null
let allData = null
// 区域缩放的起点和终点值
let startValue = 0
let endValue = startValue + 9
let timerId = null

const rank_ref = ref(null)

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'rank',
    value: '',
  })
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  clearInterval(timerId)
  // 取消回调函数
  proxy.$socket.unRegisterCallBack(fileName)
})

function initChart() {
  chartInstance = proxy.$echarts.init(rank_ref.value, theme.value)
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
    clearInterval(timerId)
  })
  chartInstance.on('mouseout', startInterval)
}

async function getData(ret) {
  // const { data: ret } = await proxy.$http.get('rank')
  allData = ret
  allData.sort((a, b) => {
    return b.value - a.value
  })
  updateChart()
  startInterval()
}

function updateChart() {
  const nameArr = allData.map((item) => item.name)
  const valueArr = allData.map((item) => item.value)
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
        color: (arg) => {
          if (arg.dataIndex < 5) {
            return new proxy.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#e098c7',
              },
              {
                offset: 1,
                color: '#8fd3e8',
              },
            ])
          } else {
            return new proxy.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: '#7bd9a5',
              },
              {
                offset: 1,
                color: '#8fd3e8',
              },
            ])
          }
        },
      },
    },
  }
  chartInstance.setOption(dataOption)
}

function screenAdapter() {
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

function startInterval() {
  if (!timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    startValue++
    endValue++
    if (endValue >= allData.length) {
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
