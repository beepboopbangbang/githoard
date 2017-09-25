<template>
  <div class="titlebar" :class="[ctrls, osCtrls]">
    <div class="resize-handle top" v-if="isWin32 && !isMaximized"/>
    <div class="resize-handle left" v-if="isWin32 && !isMaximized"/>

    <div class="window-menu">
      <router-link to="/" v-if="$route.name !== 'repo-page'">
        <window-menu-font
          name="repos"
          path="gh-angle-left">
          Repos
        </window-menu-font>
      </router-link>
      <router-link to="/settings" v-if="$route.name !== 'settings-page'">
        <window-menu-font
          name="settings"
          path="gh-sliders">
          Settings
        </window-menu-font>
      </router-link>
    </div>

    <div class="window-title">
      <span class="window-ctrl" v-if="$route.name !== 'repo-page'">{{$route.meta.title}}</span>
    </div>

    <div class="window-controls" v-if="isWin32">
        <window-controls
          v-if="window.isMinimizable()"
          name="minimize"
          :onClick="onMinimize"
          :path="minimizePath">
        </window-controls>

        <window-controls
          v-if="window.isMaximizable() && isMaximized"
          name="restore"
          :onClick="onRestore"
          :path="restorePath">
        </window-controls>

        <window-controls
          v-if="window.isMaximizable() && !isMaximized"
          name="maximize"
          :onClick="onMaximize"
          :path="maximizePath">
        </window-controls>

        <window-controls
          name="close"
          className="close"
          :onClick="onClose"
          :path="closePath">
        </window-controls>
    </div>
  </div>
</template>

<script>
import { remote } from 'electron';
import WindowControls from './WindowControls';
import WindowMenuFont from './WindowMenuFont';

export default {
  data () {
    return {
      closePath: 'M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z',
      restorePath: 'm 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z',
      maximizePath: 'M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z',
      minimizePath: 'M 0,5 10,5 10,6 0,6 Z',
      isMaximized: false,
      isWin32: process.platform === 'win32',
      isDarwin: process.platform === 'darwin',
      isLinux: process.platform === 'linux'
    };
  },
  created () {
    this.isMaximized = this.window.isMaximized();

    this.window
      .on('maximize', () => {
        this.isMaximized = true;
      })
      .on('unmaximize', () => {
        this.isMaximized = false;
      });
  },
  beforeDestroy () {
    this.window.removeAllListeners('maximize');
    this.window.removeAllListeners('unmaximize');
  },
  props: [
    'hideBar'
  ],
  computed: {
    ctrls () {
      return this.hideBar ? 'just-controls' : '';
    },
    osCtrls () {
      let osClass = '';
      if (this.isWin32) {
        osClass = 'win32';
      } else if (this.isDarwin) {
        osClass = 'darwin';
      } else if (this.isLinux) {
        osClass = 'linux';
      }
      return osClass;
    },
    window () {
      return remote.getCurrentWindow();
    }
  },
  methods: {
    openSettings (opts) {
      this.$electron.ipcRenderer.send('open-settings-window');
    },
    onMinimize () {
      this.window.minimize();
    },
    onMaximize () {
      this.window.maximize();
    },
    onRestore () {
      this.window.unmaximize();
    },
    onClose () {
      this.window.close();
    }
  },
  components: {
    WindowControls,
    WindowMenuFont
  }
};
</script>
