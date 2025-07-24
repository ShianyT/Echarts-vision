import { inject, onUnmounted } from 'vue'

interface SocketType {
  registerCallBack: (key: string, cb: (data: any) => void) => void
  unRegisterCallBack: (key: string) => void
  send: (data: any) => void
}

export function useSocket(fileName: string, getData: (data: any) => void) {
  const socket = inject('socket') as SocketType | undefined

  function send(data: any) {
    socket?.send(data)
  }

  function register() {
    socket?.registerCallBack(fileName, getData)
  }

  function unregister() {
    socket?.unRegisterCallBack(fileName)
  }

  onUnmounted(() => {
    unregister()
  })

  return { send, register, unregister }
} 