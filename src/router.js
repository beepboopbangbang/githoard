import Vue from 'vue'
import Router from 'vue-router'
// import Home from './views/Home.vue'
import Scroller from './views/Scroller.vue'
import Settings from './views/Settings.vue'

Vue.use(Router)

export default new Router({
  // mode: 'history',
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'repos',
      component: Scroller,
      meta: {
        title: 'Repositories'
      }
    },
    {
      path: '/settings/:tab?',
      name: 'settings',
      component: Settings,
      // component: require('@/components/SettingsPage'),
      // component: () => import(/* webpackChunkName: "settings" */ './views/Settings.vue'),
      meta: {
        title: 'Settings'
      },
    },
    {
      path: '*',
      redirect: '/'
    },
    // {
    //   path: '/home',
    //   name: 'home',
    //   component: () => import(/* webpackChunkName: "home" */ './views/Home.vue')
    // },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    // }
  ]
})
