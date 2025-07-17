// 处理业务逻辑中间件，读取json文件
const path = require("path")
const fileUtils = require("../utils/file_utils")
module.exports = async (ctx, next) => {
  const url = ctx.request.url
  if (url.endsWith("com.chrome.devtools.json")) {
    ctx.status = 204 // 立即返回空响应
    return
  }
  let filePath = url.replace("/api", "")
  filePath = path.join(__dirname, "../data" + filePath + ".json")
  try {
    const ret = await fileUtils.getFileJsonData(filePath)
    ctx.response.body = ret
  } catch (error) {
    const errorMsg = {
      message: "读取文件失败，文件资源不存在",
      status: 404,
    }
    ctx.response.body = errorMsg
  }
  await next()
}
