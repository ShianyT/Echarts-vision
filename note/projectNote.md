# Koa

## 一、项目准备

1. 安装包

   npm init -y 创建page.js

   npm install koa

2. 创建文件和目录结构

   app.js

   data/										 存放数据，用json文件存放，正常应使用数据库，这里简化后端操作

   middleware/							 存放中间件

   ​	koa_response_data.js			业务逻辑中间件

   ​	koa_response_duration.js	 总耗时中间件

   ​	koa_response_header.js		响应头中间件

   utils/

   ​	file_utils.js							  快速读取某一个目录下的文件

## 二、总耗时中间件(第一层中间件)

1. 计算执行时间啊

2. 设置响应头

   X-Response-Time:Xms

## 三、响应头中间件(第二层中间件)

1. 获取mime类型

   application/json(简化操作)

2. 设置响应头

   Content-Type:application/json; charset=UTF-8

## 四、业务逻辑中间件(第三层中间件)

1. 读取文件内容

   获取请求路径，拼接文件路径

   读取该路径对应文件内容

2. 设置响应体

   ctx.response.body

3. 数据对应接口

   * 商家销量 /api/seller
   * 预算开销 /api/budget
   * 库存信息 /api/stock
   * 销量趋势 /api/trend
   * 销量排行 /api/rank
   * 商家分布 /api/map
   * 热销商品 /api/hotproduct

## 五、允许跨域

1.  ctx.set("Access-Control-Allow-Origin", "*")

    ctx.set("Access-Control-Allow-Methods", "OPTIONS,GET,PUT,POST,DELETE")



# VUE

一、项目准备

二、图表组件开发

1. 商家销售统计（横向柱状图）
   * 组件结构的设计
   * 布局结构的设计
   * 图表基本功能实现
     * initChart：初始化echartsInstance对象
     * getData：获取数据
     * updateChart：设置option
   * 动态刷新实现
     * 数据处理
       * 从小到大排序
       * 每5个元素显示一页
     * 启动和停止的时机
       * 启动：
         * 获取数据之后启动定时器
         * 鼠标移出图表时启动定时器
       * 停止：
         * 组件卸载前停止定时器
         * 鼠标移入图表时停止定时器
     * 边界值的处理：判断页码是否超过总页数
   * UI调整
     * 主题使用
     * 图表圆角
     * 图表标题
     * 坐标轴位置
     * 柱状图条目
   * 拆分图表option （可以多次设置option，相互融合的关系）
     * 初始化配置initOption
     * 获取数据后的配置dataOption
     * 分辨率适配的配置adapterOption
   * 分辨率适配
     * 监听窗口大小变化事件
       * 获取图表容器的宽度
       * 设置新的option
       * 图表实例对象resize
2. 销量趋势图表（折线图）
   * 切换图表
     * 布局样式
     * 可选项渲染
       * 计算属性的使用
       * filter过滤已点击选项
     * 标题设置
     * 点击箭头
       * v-on：click
       * v-show
     * 点击可选条目
       * choiceType属性的控制
       * 点击后隐藏下拉框
3. 商家分布模块（地图+散点图）
   * 地图点击事件
     * 点击事件监听
     * 获取所有点击省份的矢量数据地图
     * 显示省份
     * 回到中国地图
4. 销量排行模块（柱状图）
   * 平移动画的实现
     * 数据处理：使用dataZoom并结合startValue和endValue两个参数，每隔一段时间更改参数
     * 动画启动：
       * 获取数据后启动
       * 鼠标移出后启动
     * 动画停止：
       * 组件销毁时停止
       * 鼠标移入图表时停止
5. 热销商品图（饼图）

三、WebSocket的引入

四、细节处理