<template>
  <div class="home" ref="home">
    <omni-bar></omni-bar>
    <virtual-list
      :data-key="'_id'"
      :data-sources="repos"
      :data-component="item"
      :estimate-size="repoBlockSize"
    />
    <!-- <virtual-list
      :size="repoBlockSize"
      :remain="remain"
      :item="item"
      :itemcount="reposCount"
      :itemprops="getItemProps"

      :data-key="'_id'"
      :data-sources="repos"
      :data-component="item"
      :extra-props="{ otherPropValue: otherDataAssginToItemComponet }"
      :estimate-size="repoBlockSize"
      :item-class="'list-item-keep'"
    /> -->
  </div>
</template>

<style lang="less">
.home {
  height: 100%;
  // flex: auto 0 0;
  display: flex;
  flex-direction: column;
}
// .scroller {
//   height: 100%;
//   flex: auto 0 0;
// }
// .home .content {
//   overflow: auto;
// }

// .repo {
//   /* height: 32%; */
//   padding: 0 12px;
//   display: flex;
//   align-items: center;
//   flex-wrap: wrap;
// }
.home > div {
  height: auto !important;
  overflow-x: hidden;
}
div[role=group] {
  // display: flex !important;
  // flex-wrap: wrap;
  position: relative;
  // display: grid !important;
  // grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  // // grid-template-rows: 1fr min-content;
  // grid-gap: 1rem;
  transform: translateZ(0);
}
</style>

<script>
import virtualList from 'vue-virtual-scroll-list'
// @ is an alias to /src
import OmniBar from '@/components/OmniBar.vue'
import Repo from '@/components/Repo.vue'
const pageLimit = 100;
function paginate (array, offset) {
  return array.slice(offset * pageLimit, (offset + 1) * pageLimit);
}
// function debounce(func, wait, immediate) {
//   let timeout;
//   return function() {
//     let context = this, args = arguments,
//     later = function() {
//       timeout = null
//       if (!immediate) func.apply(context, args)
//     },
//     call_now = immediate && !timeout
//     clearTimeout(timeout)
//     timeout = setTimeout(later, wait)
//     if (call_now) func.apply(context, args)
//   }
// }

export default {
  name: 'scroller',
  components: {
    OmniBar,
    // Repo,
    'virtual-list': virtualList
  },
  data () {
    return {
      loading: false,
      item: Repo,
      // size: 217,
      remain: 20,
      // bench: 200,
    };
  },
  computed: {
    limitedRepos () {
      return paginate(this.repos, 0)
    },
    reposCount () {
      return this.repos.length
    },
    repos: {
      get () {
        return this.$store.state.Repositories.list;
      },
      set (value) {
        this.$store.commit('resetList', value);
      }
    },
    repoBlockSize: {
      get () {
        return this.$store.state.Repositories.blockHeight
      },
      set (value) {
        this.$store.commit('updateBlockHeight', value)
      }
    }
    // remain () {
    //   const bleh = (window.innerHeight - 78) / this.size;
    //   return parseInt(bleh, 10);
    // },
  },
  methods: {
    detectRepoBlockSize: async function () {
      let repoEl
      // while (!repoEl) {
      //   await this.$nextTick()
      //   repoEl = document.querySelector('.com-repo', this.$el)
      // }
      await this.$nextTick()
      // await this.$nextTick()
      repoEl = document.querySelector('.com-repo', this.$el)
      return repoEl && repoEl.clientHeight
    },
    detectWindowHeight () {
      this.remain = (window.innerHeight - 66) / this.size;
      // this.remain = parseInt(bleh, 10);
      // console.warn('height', this.$refs, window.innerHeight, bleh, this.remain);
      // var heightString = this.$refs.home.clientHeight + 'px';
      // console.warn('height', heightString);
      // Vue.set(this.leftColStyles, 'height', heightString);
    },
    getItemProps (itemIndex) {
      return {
        key: itemIndex,
        props: {
          index: itemIndex,
          item: this.repos[itemIndex] || {}
        }
      }
    },
    updateList (event, { repo }) {
      if (repo) {
        this.$store.commit('removeRepo', repo);
        this.$store.commit('addRepo', repo);
      }
    }
  },
  // updated () {
  //   // this.detectWindowHeight();
  // },
  // mounted () {
  //   // window.addEventListener('resize', this.detectWindowHeight)
  //   // this.detectWindowHeight();
  // },
  // mounted: async function () {
  //   await this.$nextTick()
  //   const repoEl = document.querySelector('.com-repo', this.$el)
  //   console.log('scroller mounted', this, this.$el, repoEl && repoEl.clientHeight, this.repoBlockSize)
  //   // this.$emit('repo-block-loaded', this.$el.clientHeight)
  // },
  created: function () {
    // this.$on('repo-block-loaded', msg => console.log('repo-block-loaded', msg))
    // this.detectWindowHeight();
    if (this.repos.length === 0) {
      this.$electron.ipcRenderer.send('get-db', 'initialize');
    }
    // this.$electron.ipcRenderer.on('reset-list', (event, opts) => {
    //   if (opts instanceof Array) {
    //     this.$store.commit('resetList', opts);
    //   }
    // });
    this.$electron.ipcRenderer.on('local-list', (event, opts) => {
      // console.warn('local-list', event, opts);
      if (opts instanceof Array) {
        // this.repos = this.repos.concat(opts);
        this.repos = opts;
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
    this.$electron.ipcRenderer.on('clone-progress', (event, opts) => {
      // console.warn('clone-progress', event, opts);
      this.$store.commit('updateProgress', opts.repo);
    });
    // this.$electron.ipcRenderer.on('clone-api-data', (event, opts) => {
    //   console.warn('clone-api-data', event, opts);
    // });

    this.$electron.ipcRenderer.on('update-list', this.updateList);

    this.$electron.ipcRenderer.on('fetch-start', this.updateList);
    this.$electron.ipcRenderer.on('fetch-done', this.updateList);

    this.$electron.ipcRenderer.on('pull-start', this.updateList);
    this.$electron.ipcRenderer.on('pull-done', this.updateList);
  },
  beforeDestroy () {
    this.$electron.ipcRenderer.removeAllListeners('reset-list');
    this.$electron.ipcRenderer.removeAllListeners('local-list');
    this.$electron.ipcRenderer.removeAllListeners('fetch-start');
    this.$electron.ipcRenderer.removeAllListeners('fetch-done');
    this.$electron.ipcRenderer.removeAllListeners('clone-start');
    this.$electron.ipcRenderer.removeAllListeners('clone-done');
    this.$electron.ipcRenderer.removeAllListeners('clone-progress');
    this.$electron.ipcRenderer.removeAllListeners('clone-api-data');
  }
}
</script>