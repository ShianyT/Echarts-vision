import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import axios from 'axios'
import * as echarts from 'echarts'
import '@/assets/css/global.less'

const app = createApp(App)
// 全局挂载echarts
app.config.globalProperties.$echarts = echarts
// 请求基准路径的配置
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/'
// 全局挂载axios
app.config.globalProperties.$http = axios

app.use(createPinia())
app.use(router)

app.mount('#app')
