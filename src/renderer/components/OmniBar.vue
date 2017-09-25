<template>
  <form class="omnibar" @submit="onSubmit($event)">
    <div class="form-control form-control--underlined form-control--wide omnibar-search">
      <input
        type="text"
        class="input"
        placeholder="Paste a git url or search for a cloned repository"
        v-model="omnisearch"
        @keyup.enter.stop.prevent="onInput($event.target.value, $event)"
        @keyup="onTypeahead($event.target.value, $event)"
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
  </form>
</template>

<script>
import GitUniversal from '../../universal/git';
import WindowMenuFont from './WindowMenuFont';

const gituni = GitUniversal();

export default {
  data () {
    return {
      clearPath: 'M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z',
      omnisearch: ''
    };
  },
  computed: {
    isSearch () {
      return !gituni.gitUrlRegexTest.test(this.omnisearch) && this.omnisearch.length > 0;
    },
    isGit () {
      return gituni.gitUrlRegexTest.test(this.omnisearch);
    }
  },
  methods: {
    onClear () {
      this.omnisearch = '';
      this.$electron.ipcRenderer.send('db-search', '');
      event.preventDefault();
      event.stopPropagation();
    },
    onTypeahead (val, event) {
      if (!gituni.gitUrlRegexTest.test(val)) {
        this.$electron.ipcRenderer.send('db-search', val);
      }
    },
    onSubmit (event) {
      this.onInput(this.omnisearch, event);
    },
    onInput (val, event) {
      console.warn(val, event);
      if (gituni.gitUrlRegexTest.test(val)) {
        this.$electron.ipcRenderer.send('git-clone', val);
        this.omnisearch = '';
      } else {
        this.$electron.ipcRenderer.send('db-search', val);
      }
      event.preventDefault();
      event.stopPropagation();
    }
  },
  components: {
    WindowMenuFont
  }
};
</script>
