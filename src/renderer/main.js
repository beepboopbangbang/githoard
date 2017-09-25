import Vue from 'vue';
import axios from 'axios';
import { sync } from 'vuex-router-sync';

import App from './App';
import router from './router';
import store from './store';

import './assets/styles/index.less';

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

sync(store, router);

/* eslint-disable no-new */
const app = new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app');

export { app, router, store };
