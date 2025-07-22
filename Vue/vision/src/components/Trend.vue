<template>
  <div class="com-container">
    <!-- 切换折线图选项 -->
    <div class="title" :style="comStyle">
      <span>{{ title }}</span>
      <!-- 原本采用伪元素选择器来实现下拉箭头，但由于点击事件不好实现，故采用添加一个span来实现
      若采用伪元素选择器来实现，需注意：
      使用伪元素插入unicode字符时，若写成 &#xe6eb 会显示为原始编码，并不会进行渲染，需改成十六进制的形式，即去掉 &#x 前缀，加反斜杠 /  -->
      <span class="iconfont title-icon" @click="showChoice = !showChoice" :style="comStyle"
        >&#xe6eb;</span
      >
      <div class="select-con" v-show="showChoice" >
        <div
          class="select-item"
          v-for="item in selectTypes"
          :key="item.key"
          @click="handleClick(item.key, item.text)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="trend_ref"></div>
  </div>
</template>

<script setup>
import { ref, getCurrentInstance, onMounted, onUnmounted, computed, watch } from 'vue'
import { getThemeValue } from '@/utils/theme_utils'
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

const comStyle = computed(() => {
  return {
    fontSize: fontSize.value + 'px',

    color: getThemeValue(theme.value).titleColor,
  }
})

const comStyle2 = computed(() => {
  return {
    backgroundColor: getThemeValue(theme.value).backgroundColor,
  }
})

onMounted(() => {
  initChart()
  // 发送数据给服务器
  proxy.$socket.send({
    action: 'getData',
    socketType: fileName,
    chartName: 'trend',
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

// 获取选择标题的类型
/*
computed():计算属性
1、自动依赖追踪：自动追踪内部使用的响应式数据，如ref、reactive或其他computed；当这些依赖项发生变化时，会自动重新计算
2、高效缓存：只要依赖项没有发生变化，多次访问计算属性会直接返回缓存值，减少开销 
*/
const selectTypes = computed(() => {
  // 所选项不再展示在下拉框内
  return (
    allData.value?.type.filter((item) => {
      return item.key !== choiceType.value
    }) || []
  )
})

let trend_ref = ref(null)
let chartInstance = null
let allData = ref(null)
// 是否显示下拉内容
let showChoice = ref(false)
// 显示数据类型
let choiceType = ref('')
// 显示的标题
let title = ref('')
// 标题字体大小
let fontSize = ref(40)

function initChart() {
  chartInstance = proxy.$echarts.init(trend_ref.value, theme.value)
  const initOption = {
    grid: {
      top: '30%',
      left: '8%',
      right: '8%',
      bottom: '8%',
      contianLabel: true,
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      right: '10%',
      top: '12%',
    },
    xAxis: {
      type: 'category',
      // 是否需要间隙
      boundaryGap: false,
    },
    yAxis: {
      name: '销量/万件',
      type: 'value',
    },
  }
  chartInstance.setOption(initOption)
}
// ret:服务端发送给客户端的数据
function getData(ret) {
  // const { data: ret } = await proxy.$http.get('trend')
  allData.value = ret
  choiceType.value = allData.value.type[0].key
  title.value = allData.value.type[0].text
  updateChart()
}

function updateChart() {
  //颜色数据
  const colorArr1 = [
    'rgba(252, 151, 175,0.5)',
    'rgba(135, 247, 207,0.5)',
    'rgba(247, 244, 148,0.5)',
    'rgba(114, 204, 255,0.5)',
    'rgba(212, 164, 235,0.5)',
  ]
  const colorArr2 = [
    'rgba(252, 151, 175,0)',
    'rgba(135, 247, 207,0)',
    'rgba(247, 244, 148,0)',
    'rgba(114, 204, 255,0)',
    'rgba(212, 164, 235,0)',
  ]
  // x轴数据
  const timeArr = allData.value.common.month
  // y轴数据
  const valueArr = allData.value[choiceType.value].data
  // series条目数据
  const seriesArr = valueArr.map((item, index) => {
    return {
      name: item.name,
      type: 'line',
      data: item.data,
      stack: choiceType.value,
      // 折线图点的颜色（实际折现因为平滑效果没有点，这里为了同步图例颜色）
      itemStyle: {
        color: colorArr1[index],
      },
      // 折线图线本身的颜色
      lineStyle: {
        color: colorArr1[index],
      },
      areaStyle: {
        color: new proxy.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: colorArr1[index],
          },
          {
            offset: 1,
            color: colorArr2[index],
          },
        ]),
      },
    }
  })
  // 图例数据
  const legendArr = valueArr.map(({ name }) => name)

  const dataOption = {
    // 图例，data值需要与serise数组中的name值一致
    legend: {
      data: legendArr,
    },
    xAxis: {
      data: timeArr,
    },
    series: seriesArr,
  }
  chartInstance.setOption(dataOption)
}

function screenAdapter() {
  // 这里的系数大小自定义
  fontSize.value = (trend_ref.value.offsetWidth / 100) * 3.6
  const adapterOption = {
    xAxis: {
      axisLabel: {
        fontSize: fontSize.value / 2.8,
      },
    },
    yAxis: {
      axisLabel: {
        fontSize: fontSize.value / 2.8,
      },
      nameTextStyle: {
        fontSize: fontSize.value / 2.5,
        color: '#aaaaaa',
      },
    },
    legend: {
      itemWidth: fontSize.value / 1.6,
      itemHeight: fontSize.value / 2,
      itemGap: fontSize.value,
      textStyle: {
        fontSize: fontSize.value / 1.6,
      },
    },
  }
  chartInstance.setOption(adapterOption)
  chartInstance.resize()
}

// 对点击的选项进行更新
function handleClick(currentType, currentTitle) {
  choiceType.value = currentType
  title.value = currentTitle
  updateChart()
  // 点击选项后隐藏下拉框
  showChoice.value = false
}

defineExpose({
  screenAdapter,
})
</script>

<style lang="less" scoped>
.title {
  position: absolute;
  z-index: 10;
  left: 20px;
  top: 20px;
  font-weight: 700;
}

.title-icon {
  margin-left: 10px;
  cursor: pointer;
}


.select-item {
  cursor: pointer;
}
</style>
