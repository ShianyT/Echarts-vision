<!-- 商家销量统计的横向柱状图 -->
<template>
  <div class="com-container">
    <div class="com-chart" ref="seller_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onBeforeUnmount, computed, watch } from 'vue'
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

// 挂载钩子
onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'seller',
    value: '',
  })
  // 在界面加载完成之后主动进行屏幕大小适配
  screenAdapter()
  window.addEventListener('resize', screenAdapter)
})

// 卸载前钩子
onBeforeUnmount(() => {
  clearInterval(timerId)
  // 在组件销毁时，将监听器取消掉
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  proxy.$socket.unRegisterCallBack(fileName)
})

let seller_ref = ref(null)
let chartInstance = null
let allData = null // 服务器返回的数据
let currentPage = 1 // 当前显示的页数
let totalPage = 0 // 总页数，计算获取
let timerId = null // 定时器id

// 初始化echartInstance对象
function initChart() {
  chartInstance = proxy.$echarts.init(seller_ref.value, theme.value)
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
          // new proxy.$echarts.graphic.LinearGradient(x1, y1, x2, y2, []) 两点确定射线
          color: new proxy.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
            // 根据百分比来设置颜色渐变情况
            // 状态为0时
            {
              offset: 0,
              color: '#8fd3e8',
            },
            {
              offset: 0.7,
              color: '#edafda',
            },
            // 状态为100时
            {
              offset: 1,
              color: '#e098c7',
            },
          ]),
        },
      },
    ],
  }
  chartInstance.setOption(initOption)

  // 对鼠标事件进行监听
  chartInstance.on('mouseover', () => {
    clearInterval(timerId)
  })
  chartInstance.on('mouseout', () => {
    startInterval()
  })
}

// 获取服务器数据
async function getData(ret) {
  // const { data: ret } = await proxy.$http.get('seller')
  allData = ret
  allData.sort((a, b) => {
    return a.value - b.value // 从小到大排序
  })
  totalPage = Math.ceil(allData.length / 5) // 向上取整函数
  updateChart()
  // 启动定时器
  startInterval()
}

// 更新图表
function updateChart() {
  const showData = allData.slice((currentPage - 1) * 5, currentPage * 5)
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

// 启动定时器
function startInterval() {
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    currentPage++
    if (currentPage > totalPage) currentPage = 1
    updateChart()
  }, 3000)
}

// 浏览器发生大小变化适配器
function screenAdapter() {
  const size = (seller_ref.value.offsetWidth / 100) * 3.6
  // 分辨率大小相关配置项
  const adapterOption = {
    title: {
      // 字体大小和位置
      textStyle: {
        fontSize: size,
      },
    },
    xAxis: {
      axisLabel: {
        fontSize: size / 2.8,
      },
      nameTextStyle: {
        fontSize: size / 2.5,
        color: '#aaaaaa',
      },
    },
    yAxis: {
      axisLabel: {
        fontSize: size / 2,
      },
    },
    // 提示框tooltip
    tooltip: {
      axisPointer: {
        lineStyle: {
          width: size,
        },
      },
    },
    series: [
      {
        // 柱状条目的宽度
        barWidth: size,
        itemStyle: {
          // 柱状条目的圆角设置
          borderRadius: [0, size / 2, size / 2, 0],
        },

        label: {
          fontSize: size / 2.8,
        },
      },
    ],
  }
  chartInstance.setOption(adapterOption)
  // 需手动调用实例对象的resize方法才能实时更新
  chartInstance.resize()
}
defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped></style>
