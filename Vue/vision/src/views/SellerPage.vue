<!-- 
针对 /sellerpage 这个路径而显示出来的
在这个组件中，通过子组件注册的方式，显示出Seller.vue这个组件 
-->
<template>
  <div class="com-page">
    <Seller />
  </div>
</template>

<script setup lang="ts">
import Seller from '@/components/Seller.vue'
</script>

<style lang="less" scoped></style>
