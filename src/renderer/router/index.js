import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'repo-page',
      component: require('@/components/RepoPage'),
      meta: {
        title: 'Repositories'
      }
    },
    {
      path: '/settings/:tab?',
      name: 'settings-page',
      component: require('@/components/SettingsPage'),
      meta: {
        title: 'Settings'
      },
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
});
