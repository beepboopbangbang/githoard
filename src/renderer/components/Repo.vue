<template>
  <div class="com-repo col-12 sm-col-6 md-col-6 lg-col-4">
    <div class="progress-objects-container" :class="{ done: bothDone() }" :style="{width: progressObjectsPercent}"></div>
    <div class="progress-deltas-container" :class="{ done: bothDone() }" :style="{width: progressDeltasPercent}"></div>
    <header class="h1 mb1 pt1">
      <div class="flex align-middle">
        <span class="icon pr2">
          <i class="gh" :class="[sourceClass]" aria-hidden="true"></i>
        </span>
        <span class="com-repo-title align-middle">
          <a :href="repo.url" @click.stop.prevent="openUrl(ownerUrl)" :title="`${ownerUrl}`" class="com-repo-link">
            {{ repo.owner }}
          </a>
          /
          <a :href="repo.url" @click.stop.prevent="openUrl(repoUrl)" :title="`${repoUrl}`" class="com-repo-link">
            {{ repo.name }}
          </a>
        </span>
      </div>
    </header>
    <div class="com-repo-body mb1" :class="{ 'is-hidden': !repoExpanded }">
      <div class="flex align-middle">
        <a @click.stop.prevent="openDir(repo)" :title="repo.folder" class="h3 m0 com-repo-folder">
          <span class="icon pr1">
            <i class="gh gh-folder-o" aria-hidden="true"></i>
          </span>
          {{ repo.folder }}
        </a>
      </div>
      <div class="flex" :class="{ 'is-hidden': !repoExpanded }">
        <small class="p1">Branch: {{repo.branch}}</small>
        <small class="p1">Ahead: {{repo.branchAheadBehind ? repo.branchAheadBehind.ahead : 0}}</small>
        <small class="p1">Behind: {{repo.branchAheadBehind ? repo.branchAheadBehind.behind : 0}}</small>
      </div>
    </div>
    <footer class="flex flex-wrap justify-center" :class="{ 'is-hidden': !repoExpanded }">
      <button class="btn btn-big" @click="gitPillage(repo)">Pillage</button>
      <button class="btn btn-big" @click="removeFromDb(repo)" title="Remove from Database" v-if="allowRemove">RFDB</button>
      <button class="btn btn-big" @click="openReadme(repo)" v-if="hasReadme">Open Readme</button>
      <button class="btn btn-big" @click="gitFetchStatus(repo, 'status')">Status</button>
      <!-- <button class="btn btn-big" @click="gitFetch(repo, 'fetch')" v-if="repo.branchAheadBehind ? repo.branchAheadBehind.behind === 0 : false">Fetch</button> -->
      <button class="btn btn-big" @click="gitCmd(repo, 'pull')" v-if="repo.branchAheadBehind ? repo.branchAheadBehind.behind !== 0 : false">Pull</button>
    </footer>
  </div>
</template>

<script>
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';

export default {
  data () {
    return {
      allowRemove: false,
      hasReadme: false,
      receivingObjectsPercent: 0,
      resolvingDeltasPercent: 0,
      repoExpanded: true
    };
  },
  created () {
    this.$electron.ipcRenderer.on(`repo-fetch-status-${this.repo._id}`, (event, status) => {
      const fetchUpdate = {
        _id: this.repo._id,
        branch: status.currentBranch,
        branchAheadBehind: status.branchAheadBehind
      };
      this.$store.commit('updateRepo', fetchUpdate);
    });
    this.$electron.ipcRenderer.on(`repo-pull-status-${this.repo._id}`, (event, status) => {
      console.warn('pull-status', event, status);
    });
    this.$electron.ipcRenderer.on(`repo-pull-${this.repo._id}`, (event, status) => {
      console.warn('pull', event, status);
      const pullUpdate = {
        _id: this.repo._id,
        branchAheadBehind: { ahead: 0, behind: 0 }
      };
      this.$store.commit('updateRepo', pullUpdate);
    });
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners(`repo-fetch-status-${this.repo._id}`);
    this.$electron.ipcRenderer.removeAllListeners(`repo-pull-status-${this.repo._id}`);
    this.$electron.ipcRenderer.removeAllListeners(`repo-pull-${this.repo._id}`);
  },
  props: [
    'repo'
  ],
  computed: {
    formattedDate: function () {
      return distanceInWordsToNow(
        this.repo.createdAt || this.repo.created_at
      );
    },
    ownerUrl: function () {
      return this.repo.url.split(`${this.repo.slug}`)[0] + this.repo.owner;
    },
    repoUrl: function () {
      return this.repo.url.split('.git')[0];
    },
    sourceClassPath: function () {
      if (!this.repo.source) {
        return '';
      }
      return 'path-' + this.repo.source.split('.')[0];
    },
    sourceClass: function () {
      if (!this.repo.source) {
        return '';
      }
      if (['github', 'bitbucket', 'gitlab'].indexOf(this.repo.source.split('.')[0]) === -1) {
        return 'gh-git';
      }
      return 'gh-' + this.repo.source.split('.')[0];
    },
    progressObjectsPercent: function () {
      if (!this.repo.receivingObjectsPercent) {
        return 0;
      }
      return this.repo.receivingObjectsPercent + '%';
    },
    progressDeltasPercent: function () {
      if (!this.repo.resolvingDeltasPercent) {
        return 0;
      }
      return this.repo.resolvingDeltasPercent + '%';
    }
  },
  methods: {
    isDone (progressPercent) {
      return progressPercent === '100%' || progressPercent === 100;
    },
    bothDone () {
      const { resolvingDeltasPercent, receivingObjectsPercent } = this.repo;
      return this.isDone(resolvingDeltasPercent) && this.isDone(receivingObjectsPercent);
    },
    gitPillage(opts) {
      this.$electron.ipcRenderer.send('git-pillage', opts);
    },
    gitFetch (opts) {
      this.$electron.ipcRenderer.send('git-cmd', 'fetch', opts);
    },
    gitFetchStatus (opts) {
      this.$electron.ipcRenderer.send('git-fetch-status', opts);
    },
    gitCmd (opts, cmd) {
      this.$electron.ipcRenderer.send('git-cmd', cmd, opts);
    },
    removeFromDb (opts) {
      this.$electron.ipcRenderer.send('remove-entry', opts);
    },
    openReadme (opts) {
      this.$electron.ipcRenderer.send('open-readme', opts.folder);
    },
    openDir (opts) {
      this.$electron.ipcRenderer.send('open-folder', opts.folder);
    },
    openUrl (opts) {
      this.$electron.ipcRenderer.send('open-url', opts);
    }
  }
};
</script>
