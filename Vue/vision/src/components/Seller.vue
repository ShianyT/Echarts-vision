<!-- 商家销量统计的横向柱状图 -->
<template>
  <div class="com-container">
    <div class="com-chart" ref="seller_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted } from 'vue'
const { proxy } = getCurrentInstance()

let seller_ref = ref(null)

onMounted(() => {
  this.initChart()
  this.getDate()
})

let chartInstance = null
let allData = null
// 初始化echartInstance对象
function initChart() {
  chartInstance = proxy.$echarts.init(seller_ref.value)
}

// 获取服务器数据
async function getDate() {
  const { data: allData } = await proxy.$http.get('seller')
  this.updateChart()
}

// 更新图表
function updateChart() {
  // 绘制图表
  const option = {
    xAxis: {},
    yAxis: {},
    serise: [
      {
        type: 'bar',
      },
    ],
  }
  this.chartInstance.setOption(option)
}
</script>

<style lang="less" scoped></style>
