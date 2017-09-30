<template>
  <div id="settings" class="com-settings">
    <tabs animation="fade-horizontal-rtl" :only-fade="true">
      <tab-pane label="App">
        <fieldset>
          <div class="form-control form-control--padded">
            <label class="label" for="theme-selector">Theme</label>
            <select id="theme-selector" class="select" v-model="selectedTheme">
              <option v-for="(theme, index) in themes" :key="index" :value="theme.name">
                {{ theme.label }}
              </option>
            </select>
          </div>
          <label class="label" for="clone_dir_txt">Clone Directory</label>
          <div class="form-control form-control--padded file-selector">
            <input type="text" class="input file-input" id="clone_dir_txt" name="clone_dir_txt" placeholder="Select a directory" v-model="selectedDir" readonly @click.stop.prevent="onFileSelect($event.target, $event)" />
            <button class="btn btn--super-compact" @click.stop.prevent="onFileSelect($event.target, $event)"><i class="gh gh-folder-open" aria-hidden="true"></i></button>
          </div>
        </fieldset>
      </tab-pane>
      <tab-pane label="Window">
        <fieldset v-if="isDarwin">
          <h2>Dock</h2>
          <div class="form-control form-control--padded">
            <label class="inline checkbox">
              <input type="checkbox" class="" name="show_dock" v-model="showDock" />
              Show dock icon
            </label>
          </div>
        </fieldset>
        <fieldset>
          <h2>Tray</h2>
          <div class="form-control form-control--padded">
            <label class="inline checkbox">
              <input type="checkbox" class="" name="show_tray" v-model="showTray" />
              Show tray icon
            </label>
            <div class="ml3" v-if="showTray">
              <label class="inline checkbox">
                <input type="checkbox" class="" name="min_to_tray" v-model="minToTray" />
                Minimize to tray
              </label>
              <label class="inline checkbox">
                <input type="checkbox" class="" name="close_to_tray" v-model="closeToTray" />
                Close to tray
              </label>
            </div>
          </div>
        </fieldset>
      </tab-pane>
      <tab-pane label="Repository">
        <fieldset>
          <h2>After Clone</h2>
          <div class="form-control form-control--padded">
            <label class="inline checkbox">
              <input type="checkbox" class="" name="auto_open_dir" v-model="autoOpenDir" />
              Open folder of repository
            </label>
            <!-- <label class="inline checkbox">
              <input type="checkbox" class="" name="auto_sync" />
              Keep repositories automatically synced
            </label>
            <label class="inline checkbox">
              <input type="checkbox" class="" name="auto_fetch" />
              Fetch changes automatically
            </label>
            <label class="inline checkbox">
              <input type="checkbox" class="" name="auto_pull" />
              Pull changes automatically
            </label> -->
          </div>
        </fieldset>
      </tab-pane>
      <tab-pane label="Pillage">
        <fieldset>
          <div class="form-control form-control--padded">
            <label class="inline checkbox">
              <input type="checkbox" class="" name="pillage" v-model="pillage" />
              Enable Pillage
            </label>
            <div class="ml3" v-if="pillage">
              <label class="inline checkbox">
                <input type="checkbox" class="" name="pillage_member" v-model="pillageMember" />
                Clone member repos
              </label>
              <label class="inline checkbox">
                <input type="checkbox" class="" name="pillage_forked" v-model="pillageForked" />
                Clone forked repos
              </label>
            </div>
            <p class="notice text-left">
              <strong>Ummm, whats Pillage?</strong><br/>
              Pillage allows you to quickly clone all repositories under the specific account / organization
            </p>
          </div>
        </fieldset>
      </tab-pane>
      <tab-pane label="About">
        <fieldset>
          <div class="col-3 mx-auto">
            <img class="fit center" src="../assets/icon.png" />
          </div>
          <h1 class="about-githoard center h1 mb1">GitHoard</h1>
          <p class="center mt0 mb1">Version: {{currentVersion}}</p>
          <div class="form-control form-control--padded mt3">
            <button @click.stop.prevent="checkForUpdate" class="btn btn--clicky mx-auto">Check for Update</button>
            <!-- <label class="label" for="theme-selector">Updates</label>
            <label class="inline checkbox">
              <input type="checkbox" class="" name="app_update" />
              Check for updates automatically
            </label> -->
          </div>
        </fieldset>
      </tab-pane>
    </tabs>
  </div>
</template>

<script>
import { Tabs, TabPane } from './tabs';
import pkg from '../../../package.json';

export default {
  data () {
    return {
      themes: [
        {
          name: 'dark',
          label: 'Simple Dark'
        },
        {
          name: 'light',
          label: 'Simple Light'
        },
        {
          name: 'solarized-dark',
          label: 'Solarized Dark'
        },
        {
          name: 'solarized-light',
          label: 'Solarized Light'
        },
        {
          name: 'material',
          label: 'Material'
        },
        {
          name: 'railscasts',
          label: 'Railscasts'
        },
      ],
      isWin32: process.platform === 'win32',
      isDarwin: process.platform === 'darwin',
      isLinux: process.platform === 'linux',
    };
  },
  computed: {
    updateLink () {
      return `https://github.com/${pkg.repository}/releases/latest`;
    },
    currentVersion () {
      const flag = process.env.NODE_ENV === 'development' ? '-dev' : '';
      const channel = pkg.channel ? `-${pkg.channel}` : '';
      return `${pkg.version}${channel}${flag}`;
    },
    selectedTheme: {
      get () {
        return this.$store.state.Settings.config.theme;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'theme', value });
      }
    },
    selectedDir: {
      get () {
        return this.$store.state.Settings.config.baseCloneDir;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'baseCloneDir', value });
      }
    },
    minToTray: {
      get () {
        return this.$store.state.Settings.config.win.minimizeToTray;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'win.minimizeToTray', value });
      }
    },
    closeToTray: {
      get () {
        return this.$store.state.Settings.config.win.closeToTray;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'win.closeToTray', value });
      }
    },
    showTray: {
      get () {
        return this.$store.state.Settings.config.win.showTray;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'win.showTray', value });
      }
    },
    showDock: {
      get () {
        return this.$store.state.Settings.config.win.showDock;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'win.showDock', value });
      }
    },
    autoOpenDir: {
      get () {
        return this.$store.state.Settings.config.repo.openDir;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'repo.openDir', value });
      }
    },
    pillage: {
      get () {
        return this.$store.state.Settings.config.pillage.owned;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'pillage.owned', value });
      }
    },
    pillageMember: {
      get () {
        return this.$store.state.Settings.config.pillage.member;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'pillage.member', value });
      }
    },
    pillageForked: {
      get () {
        return this.$store.state.Settings.config.pillage.forked;
      },
      set (value) {
        this.$store.commit('setStore', { key: 'pillage.forked', value });
      }
    },
  },
  created () {
    this.$electron.ipcRenderer.on(`selected-folder`, (event, status) => {
      if (status) {
        this.$store.commit('setStore', { key: 'baseCloneDir', value: status });
      }
    });
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners(`selected-folder`);
  },
  methods: {
    checkForUpdate () {
      this.$electron.ipcRenderer.send('open-url', this.updateLink);
    },
    onFileSelect (val, event) {
      this.$electron.ipcRenderer.send('select-dir');
    }
  },
  components: {
    Tabs,
    TabPane,
  },
};
</script>

