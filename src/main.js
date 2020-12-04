import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueApollo from 'vue-apollo'
import apolloClient from './utils/apollo-boost'

const apolloProvider = new VueApollo({
  defaultClient: apolloClient
})
Vue.use(VueApollo)

Vue.config.productionTip = false

new Vue({
  router,
  apolloProvider,
  render: h => h(App)
}).$mount('#app')
