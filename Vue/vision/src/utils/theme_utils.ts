const theme = {
  chalk: {
    backgroundColor: '#161522',
    titleColor: '#ffffff',
    // 左上角图标路径
    logoSrc: 'logo_dark.png',
    // 切换主题按钮路径
    themeSrc: 'qiehuan_dark.png',
    // 页面顶部的边框图片
    headerBorderSrc: 'header_border_dark.png',
  },
  vintage: {
    backgroundColor: '#eeeeee',
    titleColor: '#333333',
    logoSrc: 'logo_light2.png',
    themeSrc: 'qiehuan_light.png',
    headerBorderSrc: 'header_border_light.png',
  },
} as const // 自动推导theme类型

// keyof typeof 组合类型操作符，动态获取对象的键
export function getThemeValue(themeName: keyof typeof theme) {
  return theme[themeName]
}
