import m from './m'
import Vue from 'vue'
import App from './App.vue'
import router from './router'

m.init({
  username: 'qweriqw',
  vm: Vue
})
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
