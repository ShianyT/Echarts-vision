import { createRouter, createWebHistory } from 'vue-router'
import SellerPage from '@/views/SellerPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sellerpage',
      component: SellerPage
    },
  ],
})

export default router
