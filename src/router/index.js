import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: {
      name: 'mermaid'
    }
  },
  {
    path: '/mermaid',
    name: 'mermaid',
    component: () => import('@/views/flowchart/mermaid.vue')
  },
  {
    path: '/graphql',
    name: 'graphql',
    component: () => import('@/views/graphql/index.vue')
  },
  {
    path: '/grid',
    name: 'grid',
    component: () => import('@/views/demo/grid.vue')
  },
  {
    path: '/unit',
    name: 'unit',
    component: () => import('@/views/unit/index.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
