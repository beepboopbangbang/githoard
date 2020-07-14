<template>
  <div class="com-repo">
    <div class="progress-objects-container" :class="{ done: bothDone() }" :style="{width: progressObjectsPercent}"></div>
    <div class="progress-deltas-container" :class="{ done: bothDone() }" :style="{width: progressDeltasPercent}"></div>
    <svg-btn
      v-if="allowRemove"
      name="removeFromDb"
      title="Remove repository from disk and local database"
      className="btn btn--super-duper-compact remove-btn"
      :onClick="removeFromDb"
      path='M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z' />
    <header class="h1 mb1 pt1">
      <div class="com-repo-hdr-wrap flex align-middle">
        <span class="icon pr2">
          <i class="gh" :class="[sourceClass]" aria-hidden="true"></i>
        </span>
        <span class="com-repo-title align-middle">
          <a :href="item.url" @click.stop.prevent="openUrl(ownerUrl)" :title="`${ownerUrl}`" class="com-repo-link">
            {{ item.owner }}
          </a>
          /
          <a :href="item.url" @click.stop.prevent="openUrl(repoUrl)" :title="`${repoUrl}`" class="com-repo-link">
            {{ item.name }}
          </a>
        </span>
      </div>
    </header>
    <div class="com-repo-body mb1" :class="{ 'is-hidden': !repoExpanded }">
      <div class="com-repo-body-wrap flex align-middle">
        <a @click.stop.prevent="openDir(item)" :title="item.folder" class="h3 m0 com-repo-folder">
          <span class="icon pr1">
            <i class="gh gh-folder-o" aria-hidden="true"></i>
          </span>
          {{ item.folder }}
        </a>
      </div>
      <div class="flex justify-between items-baseline" :class="{ 'is-hidden': !repoExpanded }">
        <small class="p1 left-align"><label>Branch: <select class="select select-inline"><option>{{item.branch}}</option></select></label></small>
        <small class="p1 left-align" v-if="changes">Local Changes: {{changes}}</small>
        <small class="p1 left-align">Ahead: {{item.branchAheadBehind ? item.branchAheadBehind.ahead : 0}}</small>
        <small class="p1 left-align">Behind: {{item.branchAheadBehind ? item.branchAheadBehind.behind : 0}}</small>
      </div>
    </div>
    <footer class="flex flex-wrap justify-center" :class="{ 'is-hidden': !repoExpanded }">
      <button class="btn btn-big" @click="gitPillage(item)" :title="pillageTitle">Pillage</button>
      <button class="btn btn-big" @click="openReadme(item)" v-if="hasReadme">Open Readme</button>
      <button class="btn btn-big" @click="gitFetchStatus(item, 'status')">Status</button>
      <button class="btn btn-big" @click="gitCmd(item, 'pull')" v-if="item.branchAheadBehind ? item.branchAheadBehind.behind !== 0 : false">Pull</button>
      <button class="btn btn-big" @click="gitCmd(item, 'stash')" v-if="changes">Stash</button>
    </footer>
      <!-- <button class="btn btn-big" @click="gitFetch(item, 'fetch')" v-if="item.branchAheadBehind ? item.branchAheadBehind.behind === 0 : false">Fetch</button> -->
  </div>
</template>

<style lang="less" scoped>
&.remove-btn {
  position: absolute;
  top: 2px;
  right: 0;
  z-index: 2;

  &:hover,
  &:active {
    background-color: #e81123 !important;
    color: #fff !important;

    transition: none;
  }
}

.select-inline {
  background: transparent;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%23444" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
  background-repeat: no-repeat;
  background-position-x: 100%;
  background-position-y: center;
  // border: 1px solid #dfdfdf;
  // border-radius: 2px;
  // margin-right: 2rem;
  // padding: 1rem;
  padding-right: 2rem;

  display: inline-flex;
  border-color: transparent;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: auto;

  &:active,
  &:focus,
  &:hover {
    border-color: #ccc;
    background-image: url('data:image/svg+xml;utf8,<svg fill="%23ccc" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
    // appearance: menulist;
  }
  // &::before {
  //   font-family: "githoard-essential";
  //   content: '\e815';
  //   color: #ccc;
  //   display: inline-flex;
  //   // position: absolute;
  //   // top: 0;
  //   // right: 5px;
  // }
}
// .com-repo {
//   box-sizing: border-box;
//   display: flex;
//   align-items: center;
//   flex: 0 0 50%;
// }
.com-repo {
  border-bottom: 1px solid var(--hl-xs);
  position: relative;
  box-sizing: border-box;
  // display: flex;
  // align-items: center;
  // flex: 0 0 100%;
  // flex-wrap: wrap;
  // justify-content: center;
  // flex-direction: column;
  max-width: 100%;
  padding-bottom: 2rem;

  // @media (min-width: 800px) {
  //   flex: 0 0 50%;
  // }

  // @media (min-width: 1200px) {
  //   flex: 0 0 33.33%;
  // }

  // @media (min-width: 1600px) {
  //   flex: 0 0 25%;
  // }

  // @media (min-width: 1900px) {
  //   flex: 0 0 20%;
  // }

  header {
    position: relative;
    // .px3;
    .icon {
      font-size: 1.5em;
    }
    .com-repo-link {
      color: var(--color-font);
      // .text-decoration-none;

      &:hover,
      &:hover .icon {
        color: var(--hl);
      }
    }
    // .com-repo-title {
    //   display: flex;
    //   white-space: nowrap;
    //   text-overflow: ellipsis;
    //   max-width: 100%;
    //   overflow: hidden;
    //   line-height: 1.5;
    // }
    .com-repo-hdr-wrap {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      // max-width: 90%;
    }
  }
  // .com-repo-body {
  //   display: flex;
  //   // align-content: center;
  //   align-items: flex-start;
  //   justify-content: center;
  //   flex-direction: column;
  //   flex-wrap: wrap;
  //   // max-width: 90%;
  //   //   .px3;
  //   .com-repo-body-wrap {
  //     display: flex;
  //     align-content: center;
  //     align-items: center;
  //     justify-content: center;
  //     // flex-wrap: wrap;
  //     // flex-direction: column;
  //     // max-width: 90%;
  //   }
  // }
  .com-repo-folder {
    font-size: 0.9em;
    color: var(--hl-xl);
    // white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
    overflow: hidden;

    &:hover,
    &:hover .icon {
      color: var(--hl);
    }
  }
}
</style>

<script>
import { formatDistanceToNow } from 'date-fns';
import SvgBtn from './SvgBtn';

export default {
  name: 'Repo',
  props: {
    source: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  data () {
    return {
      hasReadme: false,
      receivingObjectsPercent: 0,
      resolvingDeltasPercent: 0,
      repoExpanded: true
    };
  },
  components: {
    SvgBtn,
  },
  async mounted () {
    await this.$nextTick()
    // console.log(this.item.name, this.$el.clientHeight)
    if (this.$store.state.Repositories.blockHeight < this.$el.clientHeight) {
      // this.$parent.$parent.$emit('repo-block-loaded', this.$el.clientHeight)
      this.$store.commit('updateBlockHeight', this.$el.clientHeight)
    }
  },
  // created () {
  //   // console.warn('repo item created', this.item)
  //   this.$electron.ipcRenderer.on(`repo-fetch-status-${this.item._id}`, (event, status) => {
  //     console.warn(`repo-fetch-status-${this.item._id}`, event, status);
  //     const fetchUpdate = {
  //       _id: this.item._id,
  //       branch: status.currentBranch,
  //       branchAheadBehind: status.branchAheadBehind
  //     };
  //     this.$store.commit('updateRepo', fetchUpdate);
  //   });
  //   // this.$electron.ipcRenderer.on(`repo-pull-status-${this.item._id}`, (event, status) => {
  //   //   console.warn('pull-status', event, status);
  //   // });
  //   this.$electron.ipcRenderer.on(`repo-pull-${this.item._id}`, () => {
  //     // console.warn('pull', event, status);
  //     const pullUpdate = {
  //       _id: this.item._id,
  //       branchAheadBehind: { ahead: 0, behind: 0 }
  //     };
  //     this.$store.commit('updateRepo', pullUpdate);
  //   });
  // },
  // beforeDestroy () {
  //   this.$electron.ipcRenderer.removeAllListeners(`repo-fetch-status-${this.item._id}`);
  //   this.$electron.ipcRenderer.removeAllListeners(`repo-pull-status-${this.item._id}`);
  //   this.$electron.ipcRenderer.removeAllListeners(`repo-pull-${this.item._id}`);
  // },
  computed: {
    allowRemove () {
      return this.$store.state.Settings.config.repo.removeRepo
    },
    item () {
      return this.source
    },
    changes () {
      // console.warn('changes', this.source.status?.changes)
      return this.source?.status?.changes?.length
    },
    formattedDate: function () {
      return formatDistanceToNow(
        this.item.createdAt || this.item.created_at
      );
    },
    ownerUrl: function () {
      if(this.item.url.indexOf('gist.github') > -1) {
        return '';
      }
      return this.item.url.split(`${this.item.slug}`)[0] + this.item.owner;
    },
    repoUrl: function () {
      return this.item.url.substr(0, this.item.url.length - 4);
    },
    sourceClassPath: function () {
      if (!this.item.source) {
        return '';
      }
      return 'path-' + this.item.source.split('.')[0];
    },
    sourceClass: function () {
      if (!this.item.source) {
        return '';
      }
      if (['github', 'bitbucket', 'gitlab'].indexOf(this.item.source.split('.')[0]) === -1) {
        return 'gh-git';
      }
      return 'gh-' + this.item.source.split('.')[0];
    },
    progressObjectsPercent: function () {
      if (!this.item.receivingObjectsPercent) {
        return 0;
      }
      return this.item.receivingObjectsPercent + '%';
    },
    progressDeltasPercent: function () {
      if (!this.item.resolvingDeltasPercent) {
        return 0;
      }
      return this.item.resolvingDeltasPercent + '%';
    },
    pillageTitle () { return `Clone all repositories from ${this.source?.owner}` }
  },
  methods: {
    isDone (progressPercent) {
      return progressPercent === '100%' || progressPercent === 100;
    },
    bothDone () {
      const { resolvingDeltasPercent = 0, receivingObjectsPercent = 0 } = this.item;
      return this.isDone(resolvingDeltasPercent) && this.isDone(receivingObjectsPercent);
    },
    gitPillage(opts) {
      this.$electron.ipcRenderer.send('git-pillage', opts);
    },
    gitFetch (opts) {
      this.$electron.ipcRenderer.send('git-cmd', 'fetch', opts);
    },
    gitFetchStatus (opts) {
      // const strOpts = JSON.stringify(opts)
      // console.warn('git fetch electron', strOpts)
      this.$electron.ipcRenderer.send('git-fetch-status', opts);
    },
    gitCmd (opts, cmd) {
      // console.warn('git cmd', opts, cmd)
      this.$electron.ipcRenderer.send('git-cmd', cmd, opts);
    },
    removeFromDb () {
      this.$electron.ipcRenderer.send('remove-entry', this.item);
    },
    openReadme (opts) {
      this.$electron.ipcRenderer.send('open-readme', opts.folder);
    },
    openDir (opts) {
      this.$electron.ipcRenderer.send('open-folder', opts);
    },
    openUrl (opts) {
      if (opts !== '') {
        this.$electron.ipcRenderer.send('open-url', opts);
      }
    }
  }
};
</script>
