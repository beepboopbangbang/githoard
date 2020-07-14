<template>
  <form class="omnibar" @submit="onSubmit($event)">
    <div class="form-control form-control--underlined form-control--wide omnibar-search">
      <input
        id="omni-input"
        type="text"
        class="input"
        placeholder="Paste a git url or search for a cloned repository"
        v-model="omnisearch"
        @keydown.alt="showTips"
        @keyup.enter.stop.prevent="onInput($event.target.value, $event)"
        @keyup.exact="onTypeahead($event.target.value, $event)"
        @focus="onFocus"
        @blur="onBlur"
      >
      <button aria-label="Clear" title="Clear" tabIndex="-1" :class="['window-ctrl', 'search-ctrl']" @click="onClear" v-if="isSearch">
        <svg aria-hidden='true' version='1.1' width='10' height='10'>
          <path :d="clearPath"></path>
        </svg>
      </button>
      <window-menu-font
        type="submit"
        name="clone"
        title="Clone"
        path="gh-split"
        className="search-ctrl"
        v-if="isGit">
        Clone
      </window-menu-font>
    </div>
    <transition name="fade">
      <div class="tips" v-if="tipsVisible">
        <p>For more granular searching try:</p>
        <ul class="ul--code">
          <li><a @click="searchTipClick('owner')">owner:</a>gitlab-org</li>
          <li><a @click="searchTipClick('name')">name:</a>gitlab-ce</li>
          <li><a @click="searchTipClick('slug')">slug:</a>gitlab-org/gitlab</li>
          <li><a @click="searchTipClick('source')">source:</a>gitlab.com</li>
          <li><a @click="searchTipClick('branch')">branch:</a>master</li>
          <li><a @click="searchTipClick('url')">url:</a>https://gitlab.com/gitlab-org/gitlab.git</li>
          <li><a @click="searchTipClick('createdAt')">createdAt:</a>2020-02-20T00:00:00</li>
          <li><a @click="searchTipClick('updatedAt')">updatedAt:</a>2020-02-20T00:00:00.000Z</li>
        </ul>
        <p>Exclude from your search with a dash (-)<br/>E.g. <i>Get Sources that are NOT github.com</i></p>
        <ul class="ul--code">
          <li><a @click="searchTipClick('-source')">-source:</a>github.com</li>
        </ul>
      </div>
    </transition>
  </form>
</template>

<script>
import GitUniversal from '../lib/universal/git';
import WindowMenuFont from './WindowMenuFont';

const gituni = GitUniversal();

export default {
  data () {
    return {
      clearPath: 'M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z',
      omnisearch: '',
      hasFocus: false,
      tipsVisible: false,
      delay: "300ms"
    };
  },
  computed: {
    isGit () {
      return gituni.gitUrlRegexTest.test(this.omnisearch) || gituni.githubUrlRegexTest.test(this.omnisearch)
    },
    isSearch () {
      return !this.isGit && this.omnisearch.length > 0;
    },
  },
  methods: {
    onClear () {
      this.omnisearch = '';
      this.$electron.ipcRenderer.send('db-search', '');
      event.preventDefault();
      event.stopPropagation();
    },
    onTypeahead (val, $ev) {
      if ($ev.key === 'Alt') {
        this.tipsVisible = false
      }
      if (!this.isGit) {
        this.$electron.ipcRenderer.send('db-search', val);
      }
    },
    onSubmit (event) {
      this.onInput(this.omnisearch, event);
    },
    onInput (val, event) {
      if (this.isGit) {
        this.$electron.ipcRenderer.send('git-clone', val);
        this.omnisearch = '';
      } else {
        this.$electron.ipcRenderer.send('db-search', val);
      }
      event.preventDefault();
      event.stopPropagation();
    },
    showTips () {
      this.tipsVisible = this.hasFocus
    },
    hideTips () {
      this.tipsVisible = false
    },
    onFocus () {
      this.hasFocus = true
    },
    onBlur () {
      this.hasFocus = this.tipsVisible = false
    },
    searchTipClick (filter) {
        this.omnisearch = `${filter}:`;
        document.getElementById('omni-input').focus();
    },
  },
  components: {
    WindowMenuFont
  }
};
</script>
