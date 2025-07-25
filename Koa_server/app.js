// 服务器入口文件
// 1. 创建KOA实例对象
const Koa = require("koa")
const app = new Koa()
// 2. 绑定中间件
// 绑定第一层中间件
const responseDuration = require("./middleware/koa_response_duration")
app.use(responseDuration)
// 绑定第二层中间件
const responseHeader = require("./middleware/koa_response_header")
app.use(responseHeader)
// 绑定第三层中间件
const responseData = require("./middleware/koa_response_data")
app.use(responseData)
// 3.设置端口号8888
app.listen(8888)


const webSocketService = require('./service/web_socket_service')
// 开启服务端监听
webSocketService.listen()