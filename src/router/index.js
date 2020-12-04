import Vue from 'vue'
import VueRouter from 'vue-router'
import graphqlDemo from '../views/graphql/index.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/graphql-demo',
    name: 'graphql-demo',
    component: graphqlDemo
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
