<template>
  <div class="com-container">
    <div class="com-chart" ref="hot_ref"></div>
    <span
      class="iconfont switch-icon switch-left"
      @click="switchLeft()"
      :style="{ fontSize: size + 'px' }"
      >&#xe6ef;
    </span>
    <span
      class="iconfont switch-icon switch-right"
      @click="switchRight()"
      :style="{ fontSize: size + 'px' }"
      >&#xe6ed;</span
    >
    <div class="second-title" :style="{ fontSize: size + 'px' }">{{ secondTitleName }}</div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted, computed, watch } from 'vue'
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

const { proxy } = getCurrentInstance()
// 获取文件名，注册回调函数
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '')
proxy.$socket.registerCallBack(fileName, getData)

const hot_ref = ref(null)
let chartInstance = null
let allData = ref(null)
let typeIndex = ref(0)
let secondTitleName = computed(() => {
  if (!allData.value) return ''
  return allData.value[typeIndex.value].name
})

let size = ref(0)

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'hotproduct',
    value: '',
  })
  screenAdapter()
  window.addEventListener('resize', screenAdapter)
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  proxy.$socket.unRegisterCallBack(fileName)
})

function initChart() {
  chartInstance = proxy.$echarts.init(hot_ref.value, theme.value)
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

async function getData(ret) {
  // const { data: ret } = await proxy.$http.get('hotproduct')
  allData.value = ret
  updateChart()
}

function updateChart() {
  const typeData = allData.value[typeIndex.value].children
  const nameArr = typeData.map((item) => item.name)

  const dataOption = {
    legend: {
      data: nameArr,
    },
    tooltip: {
      formatter: (arg) => {
        const arr = arg.data.children
        let sun = 0
        arr.forEach((item) => {
          sun += item.value
        })
        let str = ''
        arr.forEach((item) => {
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

function screenAdapter() {
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

function switchLeft() {
  typeIndex.value--
  if (typeIndex.value < 0) typeIndex.value = allData.value.length
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
