<template>
  <div class="titlebar" :class="[ctrls, osCtrls]">
    <div class="resize-handle top" v-if="isWin32 && !isMaximized"/>
    <div class="resize-handle left" v-if="isWin32 && !isMaximized"/>

    <div class="window-menu">
      <router-link to="/" v-if="$route.name !== 'repos'" title="Back to Repos">
        <window-menu-font
          name="repos"
          path="gh-angle-left">
          Repos
        </window-menu-font>
      </router-link>
      <router-link to="/settings" v-if="$route.name !== 'settings'" class="no-outline" title="Settings">
        <window-menu-font
          name="settings"
          path="gh-sliders">
          Settings
        </window-menu-font>
      </router-link>
      <a id="scrollToTop" @click="scrollToTop" v-if="showScrollToTop" class="no-outline" title="Scroll to Top">
        <window-menu-font
          name="scrollToTop"
          path="gh-up-1">
          To Top
        </window-menu-font>
      </a>
    </div>

    <div class="window-title">
      <span class="window-ctrl" v-if="$route.name !== 'repos'">{{$route.meta.title}}</span>
    </div>

    <div class="window-controls" v-if="!isDarwin">
        <window-controls
          v-if="window.minimizable"
          name="minimize"
          title="Minimize"
          :onClick="onMinimize"
          :path="minimizePath">
        </window-controls>

        <window-controls
          v-if="window.maximizable && isMaximized"
          name="restore"
          title="Restore"
          :onClick="onRestore"
          :path="restorePath">
        </window-controls>

        <window-controls
          v-if="window.maximizable && !isMaximized"
          name="maximize"
          title="Maximize"
          :onClick="onMaximize"
          :path="maximizePath">
        </window-controls>

        <window-controls
          name="close"
          title="Close"
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
      isLinux: process.platform === 'linux',
      scrollTop: 0
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
  mounted () {
    this.scrollPane?.addEventListener('scroll', (event) => {
      this.scrollTop = event.target.scrollTop
    })
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
    },
    scrollPane () {
      return document.querySelector('.home > div')
    },
    showScrollToTop () {
      return this.$route.name !== 'settings' && this.scrollTop > 0
    }
  },
  methods: {
    openSettings () {
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
    },
    scrollToTop () {
      document.querySelector('.home > div').scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      })
    },
  },
  components: {
    WindowControls,
    WindowMenuFont
  }
};
</script>
