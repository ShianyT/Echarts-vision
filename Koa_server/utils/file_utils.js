const { error } = require("console")
const fs = require("fs")
module.exports.getFileJsonData = (filePath) => {
  // 根据路径读取文件内容
  // 异步读取，采用promise函数
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}
