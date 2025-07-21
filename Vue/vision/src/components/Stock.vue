<template>
  <div class="com-container">
    <div class="com-chart" ref="stock_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue'

const { proxy } = getCurrentInstance()
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '')
// 注册回调函数
proxy.$socket.registerCallBack(fileName, getData)

const stock_ref = ref(null)
let chartInstance = null
let allData = null
let index = 0
let timerId = null

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'stock',
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
  chartInstance = proxy.$echarts.init(stock_ref.value, 'chalk')
  const initOption = {
    title: {
      text: '库存销售量',
      left: 20,
      top: 20,
    },
  }
  chartInstance.setOption(initOption)
  chartInstance.on('mouseover', () => {
    clearInterval(timerId)
  })
  chartInstance.on('mouseout', startInterval)
}

async function getData(ret) {
  // const { data: ret } = await proxy.$http.get('stock')
  allData = ret

  updateChart()
  startInterval()
}

function updateChart() {
  const colorArr = [
    ['#dd6b66', '#fc97af'],
    ['#0098d9', '#a5e7f0'],
    ['#ffb248', '#f7f494'],
    ['#22c3aa', '#87f7cf'],
    ['#71669e', '#b6a2de'],
  ]
  const showArr = allData.slice(index * 5, index * 5 + 5)
  const seriesArr = showArr.map((item, index) => {
    let x = 25
    let y = 35
    if (index >= 3) {
      x = 37 - 3 * 25
      y = 70
    }
    return {
      type: 'pie',
      radius: [80, 67],
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
            color: new proxy.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
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
  chartInstance.setOption(dataOption)
}

function screenAdapter() {
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
      radius: [size * 2, size * 1.7],
      label: {
        fontSize: size / 2.5,
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
    if (index >= allData.length / 5) index = 0
    updateChart()
  }, 5000)
}
</script>

<style lang="less" scoped></style>
