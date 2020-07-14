import Vue from 'vue'
import axios from 'axios';
import { sync } from 'vuex-router-sync';

import App from './App.vue'
import router from './router'
import store from './store'

import './assets/app.css'
import './assets/styles/index.less';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

sync(store, router);

const app = new Vue({
  router,
  store,
  render: h => h(App),
  mounted() {
    // console.warn('app mounted', this.$store)
    // Prevent blank screen in Electron builds
    // this.$router.push('/')
  }
}).$mount('#app')

export { app, router, store };
