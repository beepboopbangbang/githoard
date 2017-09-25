<template>
  <div id="repos">
    <omni-bar></omni-bar>
    <div class="columns repositories">
      <div class="column">
        <img :src="loadCylon" v-if="loading" class="loading" alt="Loading..." />
        <h1 class="center" v-if="!repos || repos.length === 0">No repositories found</h1>
        <div class="flex flex-wrap content-stretch">
          <repo
            v-for="(repo, index) in repos"
            :repo="repo"
            :index="index"
            :key="repo._id">
          </repo>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OmniBar from './OmniBar';
import Repo from './Repo';
import LoadCylon from 'loading-svg/loading-cylon-red.svg';

export default {
  data () {
    return {
      loading: false,
    };
  },
  computed: {
    repos: {
      get () {
        return this.$store.state.Repositories.list;
      },
      set (value) {
        this.$store.commit('resetList', value);
      }
    },
    loadCylon () {
      return LoadCylon;
    }
  },
  created () {
    if (this.repos.length === 0) {
      this.$electron.ipcRenderer.send('vue-log', 'initialize');
    }
    this.$electron.ipcRenderer.on('reset-list', (event, opts) => {
      if (opts instanceof Array) {
        this.$store.commit('resetList', opts);
      }
    });
    this.$electron.ipcRenderer.on('local-list', (event, opts) => {
      if (opts instanceof Array) {
        this.repos = this.repos.concat(opts);
      }
    });
    this.$electron.ipcRenderer.on('clone-start', (event, opts) => {
      if (opts.repo) {
        this.$store.commit('addRepo', opts.repo);
      }
    });
    this.$electron.ipcRenderer.on('clone-done', (event, opts) => {
      this.$store.commit('finishProgress', opts.repo);
    });
    this.$electron.ipcRenderer.on('fetch-start', (event, opts) => {
      if (opts.repo) {
        this.$store.commit('removeRepo', opts.repo);
        this.$store.commit('addRepo', opts.repo);
      }
    });
    this.$electron.ipcRenderer.on('clone-progress', (event, opts) => {
      this.$store.commit('updateProgress', opts.repo);
    });
    this.$electron.ipcRenderer.on('clone-api-data', (event, opts) => {
    });
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('reset-list');
    this.$electron.ipcRenderer.removeAllListeners('local-list');
    this.$electron.ipcRenderer.removeAllListeners('fetch-start');
    this.$electron.ipcRenderer.removeAllListeners('clone-start');
    this.$electron.ipcRenderer.removeAllListeners('clone-done');
    this.$electron.ipcRenderer.removeAllListeners('clone-progress');
    this.$electron.ipcRenderer.removeAllListeners('clone-api-data');
  },
  components: {
    OmniBar,
    Repo
  }
};
</script>
