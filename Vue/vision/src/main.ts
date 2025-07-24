import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import axios from 'axios'
// 引入全局样式
import '@/assets/css/global.less'
// 引入字体文件
import '@/assets/font/iconfont.css'
import SocketService from './utils/socket_service'

declare global {
  interface Window {
    echarts: any
  }
}

const app = createApp(App)
// 获取WebSocket实例并启动连接
SocketService.Instance.connect()
// 全局挂载SocketService实例对象
app.config.globalProperties.$socket = SocketService.Instance
app.provide('socket',SocketService.Instance)
// 全局挂载echarts
app.config.globalProperties.$echarts = window.echarts
app.provide('echarts',window.echarts)
// 请求基准路径的配置
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/'
// 全局挂载axios
app.config.globalProperties.$http = axios
app.provide('axios',axios)


app.use(createPinia())
app.use(router)

app.mount('#app')
