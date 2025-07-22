export default class SocketService {
  // 单例
  // 需要声明类型，否则无法在if中赋值
  private static instance: SocketService | null = null

  private ws: WebSocket | null = null
  // Record<>: TypeScript 中的一种 ​​复合类型注解​​，用于定义一个对象结构
  // 用来存储不同的回调函数
  private callBackMapping: Record<string, any | null> = {}
  // 发送重试次数
  private sendRetryCount: number = 0
  // 重连次数
  private connectRetryCount: number = 0

  // getter方法
  public static get Instance(): SocketService {
    if (!this.instance) {
      this.instance = new SocketService()
    }
    return this.instance
  }

  // 连接服务器
  public connect(): void {
    if (!window.WebSocket) {
      return console.log('浏览器不支持WebSocket')
    }
    this.ws = new WebSocket('ws://localhost:9998')

    //连接成功
    this.ws.onopen = () => {
      console.log('服务器连接成功')
      this.connectRetryCount = 0
    }
    // 连接失败
    // 两种情况：
    // 1. 连接服务器失败
    // 2. 当连接成功后，服务器关闭情况
    this.ws.onclose = () => {
      console.log('服务器连接失败')
      this.connectRetryCount++
      if (this.connectRetryCount < 20) {
        setTimeout(() => {
          this.connect()
        }, this.connectRetryCount * 500)
      }
    }
    // 接受数据
    this.ws.onmessage = (msg) => {
      // console.log(msg.data)

      const recvData = JSON.parse(msg.data)
      const socketType = recvData.socketType
      if (this.callBackMapping[socketType]) {
        const action = recvData.action
        if (action === 'getData') {
          const realData = JSON.parse(recvData.data)
          this.callBackMapping[socketType].call(this, realData)
        } else if (action === 'fullScreen') {
          this.callBackMapping[socketType].call(this, recvData)
        } else if (action === 'themeChange') {
        }
      }
    }
  }

  // 回调函数的注册
  public registerCallBack(socketType: string, callBack: any): void {
    this.callBackMapping[socketType] = callBack
  }

  // 取消回调函数
  public unRegisterCallBack(socketType: string): void {
    this.callBackMapping[socketType] = null
  }

  //发送数据
  send(data: JSON): void {
    try {
      // 当发送成功后，重试次数重置
      this.sendRetryCount = 0
      this.ws?.send(JSON.stringify(data))
      
    } catch (error) {
      // 每次重试都加一次次数，再次重试的事件依次递增，减少开销
      this.sendRetryCount++
      setTimeout(() => {
        this.send(data)
      }, this.sendRetryCount * 500)
    }
  }
}
