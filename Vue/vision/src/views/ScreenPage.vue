<template>
  <div class="screen-container" :style="containerStyle">
    <header class="screen-header">
      <div>
        <img :src="path + theme.headerBorderSrc" alt="" />
      </div>
      <span class="logo">
        <img :src="path + theme.logoSrc" alt="" />
      </span>
      <span class="title">电商平台实时监控系统</span>
      <div class="title-right">
        <img :src="path + theme.themeSrc" class="qiehuan" @click="handleChangeTheme" />
        <span class="datetime">{{ currentDateTime }}</span>
      </div>
    </header>
    <div class="screen-body">
      <section class="screen-left">
        <div id="left-top" :class="[fullScreenStatus.trend ? 'fullscreen' : '']">
          <!-- 销量趋势图 -->
          <Trend
            :ref="(el) => setRef(el, 'trend')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Trend>
          <div class="resize">
            <!-- <span class="iconfont icon-compress-alt"></span> -->
            <span
              @click="changeSize('trend')"
              :class="[
                'iconfont',
                fullScreenStatus.trend ? 'icon-compress-alt' : 'icon-expand-alt',
              ]"
            ></span>
          </div>
        </div>
        <div id="left-bottom" :class="[fullScreenStatus.seller ? 'fullscreen' : '']">
          <!-- 商家销售金额图表 -->
          <Seller
            :ref="(el) => setRef(el, 'seller')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Seller>
          <div class="resize">
            <span
              @click="changeSize('seller')"
              :class="[
                'iconfont',
                fullScreenStatus.seller ? 'icon-compress-alt' : 'icon-expand-alt',
              ]"
            ></span>
          </div>
        </div>
      </section>
      <section class="screen-middle">
        <div id="middle-top" :class="[fullScreenStatus.map ? 'fullscreen' : '']">
          <!-- 商家分布图表 -->
          <!-- 通过 ​​动态绑定 ref 函数​​ 和 ​​响应式对象​​ 自动收集所有普通标签的引用 -->
          <Map
            :ref="(el) => setRef(el, 'map')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Map>
          <div class="resize">
            <span
              @click="changeSize('map')"
              :class="['iconfont', fullScreenStatus.map ? 'icon-compress-alt' : 'icon-expand-alt']"
            ></span>
          </div>
        </div>
        <div id="middle-bottom" :class="[fullScreenStatus.rank ? 'fullscreen' : '']">
          <!-- 地区销量排行图标 -->
          <Rank
            :ref="(el) => setRef(el, 'rank')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Rank>
          <div class="resize">
            <span
              @click="changeSize('rank')"
              :class="['iconfont', fullScreenStatus.rank ? 'icon-compress-alt' : 'icon-expand-alt']"
            ></span>
          </div>
        </div>
      </section>
      <section class="screen-right">
        <div id="right-top" :class="[fullScreenStatus.hot ? 'fullscreen' : '']">
          <!-- 热销商品占比图表 -->
          <Hot
            :ref="(el) => setRef(el, 'hot')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Hot>
          <div class="resize">
            <span
              @click="changeSize('hot')"
              :class="['iconfont', fullScreenStatus.hot ? 'icon-compress-alt' : 'icon-expand-alt']"
            ></span>
          </div>
        </div>
        <div id="right-bottom" :class="[fullScreenStatus.stock ? 'fullscreen' : '']">
          <!-- 库存销量分析图表 -->
          <Stock
            :ref="(el) => setRef(el, 'stock')"
            :mode="fullScreenStatus.hot ? 'normal' : 'screen'"
          ></Stock>
          <div class="resize">
            <span
              @click="changeSize('stock')"
              :class="[
                'iconfont',
                fullScreenStatus.stock ? 'icon-compress-alt' : 'icon-expand-alt',
              ]"
            ></span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import Hot from '@/components/Hot.vue'
import Map from '@/components/Map.vue'
import Rank from '@/components/Rank.vue'
import Seller from '@/components/Seller.vue'
import Stock from '@/components/Stock.vue'
import Trend from '@/components/Trend.vue'
import { ref, nextTick, reactive, onUnmounted, computed, inject, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { getThemeValue } from '@/utils/theme_utils'
import dayjs from 'dayjs'

// ================= inject全局依赖 =================
const socket = inject('socket') as any // 根据实际情况定义类型

// ================= 计算属性 =================
const theme = computed(() => getThemeValue(useThemeStore().theme as 'chalk' | 'vintage'))
const path = ref('/static/img/')
const containerStyle = computed(() => {
  return {
    backgroundColor: theme.value.backgroundColor,
    color: theme.value.titleColor,
  }
})

// ================= 响应式变量 =================
const currentDateTime = ref('')
let timerId: ReturnType<typeof setInterval> | null = null
const fullScreenStatus = ref<Record<string, boolean>>({
  hot: false,
  map: false,
  rank: false,
  seller: false,
  stock: false,
  trend: false,
})
const refs = reactive<Record<string, any>>({})

// 收集所有子组件
const setRef = (el: any, name: string) => {
  if (el) {
    refs[name] = el
  }
}

// ================= 生命周期钩子 =================
socket.registerCallBack('fullScreen', recvData)
socket.registerCallBack('themeChange', recvThemeChange)

onMounted(() => {
  updateTime() // 初始化时间
  // 设置定时器,每1秒计算一次，减少开销
  timerId = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  socket.unRegisterCallBack('fullScreen')
  socket.unRegisterCallBack('themeChange')

  if (timerId) clearInterval(timerId)
})

// ================= 事件处理 =================
function changeSize(chartName: string) {
  const targetValue = !fullScreenStatus.value[chartName]
  socket.send({
    action: 'fullScreen',
    socketType: 'fullScreen',
    chartName: chartName,
    value: targetValue,
  })
}

async function recvData(ret: { chartName: string; value: boolean }) {
  const chartName = ret.chartName
  // 更换全屏状态
  fullScreenStatus.value[chartName] = ret.value
  // 等待事件完成
  await nextTick()
  // 调用该方法需将该方法显示暴露
  refs[chartName].screenAdapter()
}

// 主题切换
function handleChangeTheme() {
  // 调用store中定义的主题切换函数
  // useThemeStore().changeTheme()
  socket.send({
    action: 'themeChange',
    socketType: 'themeChange',
    chartName: '',
    vlaue: '',
  })
}

function recvThemeChange() {
  useThemeStore().changeTheme()
}

// 更新当前时间
function updateTime() {
  currentDateTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="less" scoped>
// 全屏样式的定义
.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  z-index: 100;
}

.screen-container {
  width: 100%;
  height: 100%;
  padding: 0 20px;
  background-color: #161522;
  color: #fff;
  box-sizing: border-box;
}
.screen-header {
  width: 100%;
  height: 65px;
  font-size: 20px;
  position: relative;
  > div {
    img {
      padding-top: 5px;
      width: 100%;
    }
  }
  .title {
    position: absolute;
    left: 50%;
    top: 50%;
    font-size: 20px;
    transform: translate(-50%, -50%);
  }
  .title-right {
    display: flex;
    align-items: center;
    position: absolute;
    right: 0px;
    top: 50%;
    transform: translateY(-80%);
  }
  .qiehuan {
    width: 28px;
    height: 21px;
    cursor: pointer;
  }
  .datetime {
    font-size: 15px;
    margin-left: 10px;
  }
  .logo {
    position: absolute;
    left: 20px;
    top: 55%;
    transform: translateY(-80%);
    img {
      height: 33px;
    }
  }
}
.screen-body {
  width: 100%;
  height: 100%;
  display: flex;
  margin-top: 10px;
  .screen-left {
    height: 100%;
    width: 30%;
    #left-top {
      height: 48%;
      position: relative;
    }
    #left-bottom {
      height: 35%;
      margin-top: 25px;
      position: relative;
    }
  }
  .screen-middle {
    height: 100%;
    width: 38%;
    margin-left: 1.6%;
    margin-right: 1.6%;
    #middle-top {
      width: 100%;
      height: 53%;
      position: relative;
    }
    #middle-bottom {
      margin-top: 25px;
      width: 100%;
      height: 30%;
      position: relative;
    }
  }
  .screen-right {
    height: 100%;
    width: 30%;
    #right-top {
      height: 48%;
      position: relative;
    }
    #right-bottom {
      height: 35%;
      margin-top: 25px;
      position: relative;
    }
  }
}
.resize {
  position: absolute;
  right: 20px;
  top: 20px;
  cursor: pointer;
}
</style>
