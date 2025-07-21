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
    <div class="second-title" :style="{ fontSize: size / 1.5 + 'px' }">{{ secondTitleName }}</div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted, computed } from 'vue'
const { proxy } = getCurrentInstance()
const fileName = import.meta.url.split('?')[0].split('/').pop()?.replace('.vue', '')
// 注册回调函数
proxy.$socket.registerCallBack(fileName, getData)

const hot_ref = ref(null)
let chartInstance = null
let allData = ref(null)
let typeIndex = ref(0)
let secondTitleName = computed(() => {
  if (!allData.value) return ''
  return allData.value[typeIndex.value].name
})
let size = ref(40)

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'hotproduct',
    value: '',
  })
  // getData()
  window.addEventListener('resize', screenAdapter)
  screenAdapter()
})

onUnmounted(() => {
  window.removeEventListener('resize', screenAdapter)
  // 取消回调函数
  proxy.$socket.unRegisterCallBack(fileName)
})

function initChart() {
  chartInstance = proxy.$echarts.init(hot_ref.value, 'chalk')
  const initOption = {
    title: {
      text: '热销商品销售额统计',
      left: 20,
      top: 20,
    },
    legend: {
      top: '15%',
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
  size.value = (hot_ref.value.offsetWidth / 100) * 2.8
  const adapterOption = {
    title: {
      textStyle: {
        fontSize: size.value,
      },
    },
    legend: {
      textStyle: {
        fontSize: size.value / 2,
      },
      itemWidth: size.value / 2,
      itemHeight: size.value,
      itemGap: size.value,
    },
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
  left: 8%;
}
.switch-right {
  right: 8%;
}

.second-title {
  position: absolute;
  bottom: 10%;
  right: 10%;
  color: white;
  font-size: 20px;
}
</style>
