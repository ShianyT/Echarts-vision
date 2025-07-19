<template>
  <div class="com-container">
    <div class="com-chart" ref="rank_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue'
const { proxy } = getCurrentInstance()
let chartInstance = null
let allData = null
// 区域缩放的起点和终点值
let startValue = 0
let endValue = startValue + 9
let timerId = null

const rank_ref = ref(null)

onMounted(() => {
  initChart()
  getData()
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  clearInterval(timerId)
})

function initChart() {
  chartInstance = proxy.$echarts.init(rank_ref.value, 'chalk')
  const initOption = {
    title: {
      text: '地区销售排行',
      top: 20,
      left: 20,
    },
    // 只在直角坐标系中有效
    grid: {
      top: '23%',
      left: '8%',
      bottom: '12%',
      right: '10%',
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
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

async function getData() {
  const { data: ret } = await proxy.$http.get('rank')
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
</script>

<style lang="less" scoped></style>
