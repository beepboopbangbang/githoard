<template>
  <div id="app" :theme="selectedTheme" class="wrapper">
    <title-bar :hide-bar="$route.name === 'settings-page'"></title-bar>
    <div class="app-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<style lang="less">
#app {
  // font-family: 'Avenir', Helvetica, Arial, sans-serif;
  // -webkit-font-smoothing: antialiased;
  // -moz-osx-font-smoothing: grayscale;
  text-align: center;
  // color: #2c3e50;
  // height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  // margin-top: var(--win32-title-bar-height);
  transform: translateZ(0);
  // transform: translate3d(0, 0, 0);
  // backface-visibility: hidden;
  // perspective: 1000;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

<script>
import TitleBar from '@/components/TitleBar.vue'
import icon from '../public/icons/icon.png';

export default {
  name: 'githoard',
  data () {
    return {
    };
  },
  computed: {
    selectedTheme: {
      get () {
        return this.$store.state.Settings.config.theme;
      },
      set (value) {
        this.$store.commit('updateTheme', value);
      }
    }
  },
  created () {
    this.$electron.ipcRenderer.send('store');
    this.$electron.ipcRenderer.on(`store:res`, (event, store) => {
      if (store) {
        this.$store.commit('updateStore', store);
      }
    });

    this.$electron.ipcRenderer.on('log', (event, title, data) => {
      console.log(title, data); // eslint-disable-line
    });

    this.$electron.ipcRenderer.on('notify', (event, title, opts) => {
      const ipcNotify = new Notification(title, Object.assign({}, {
        icon
      }, opts));

      // TODO: Add setting for auto fetch & pull if repo exists

      if (this.$store.state.Settings.config.repo.openDir && opts.folder) {
        this.$electron.ipcRenderer.send('open-folder', opts);
      }

      ipcNotify.onclick = () => {
        if (opts.folder) {
          this.$electron.ipcRenderer.send('open-folder', opts);
        }
      };
    });
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners(`store:res`);
    this.$electron.ipcRenderer.removeAllListeners(`log`);
    this.$electron.ipcRenderer.removeAllListeners(`notify`);
  },
  components: {
    TitleBar
  }
};
</script>
