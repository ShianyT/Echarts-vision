<template>
  <div class="screen-container">
    <header class="screen-header">
      <div>
        <img src="/Vue/vision/public/static/img/header_border_dark.png" alt="" />
      </div>
      <span class="logo">
        <img src="/Vue/vision/public/static/img/logo_dark.png" alt="" />
      </span>
      <span class="title">电商平台实时监控系统</span>
      <div class="title-right">
        <img src="/Vue/vision/public/static/img/qiehuan_dark.png" class="qiehuan" />
        <span class="datetime">2025-07-21 00:00:00</span>
      </div>
    </header>
    <div class="screen-body">
      <section class="screen-left">
        <div id="left-top">
          <!-- 销量趋势图 -->
        </div>
        <div id="left-bottom">
          <!-- 商家销售金额图表 -->
        </div>
      </section>
      <section class="screen-middle">
        <div id="middle-top">
          <!-- 商家分布图表 -->
        </div>
        <div id="middle-bottom">
          <!-- 地区销量排行图标 -->
        </div>
      </section>
      <section class="screen-right">
        <div id="right-top">
          <!-- 热销商品占比图表 -->
        </div>
        <div id="right-bottom">
          <!-- 库存销量分析图表 -->
        </div>
      </section>
    </div>
  </div>
</template>

<script setup></script>

<style lang="less" scoped></style>
