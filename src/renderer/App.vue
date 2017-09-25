<template>
  <div id="app" :theme="selectedTheme" class="wrapper">
    <title-bar :hide-bar="$route.name === 'settings-page'"></title-bar>
    <div class="app-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import path from 'path';
import TitleBar from './components/TitleBar';

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
        icon: path.join(__static, './icons/icon.png')
      }, opts));

      if (this.$store.state.Settings.config.repo.openDir && opts.folder) {
        this.$electron.ipcRenderer.send('open-folder', opts.folder);
      }

      ipcNotify.onclick = () => {
        if (opts.folder) {
          this.$electron.ipcRenderer.send('open-folder', opts.folder);
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
