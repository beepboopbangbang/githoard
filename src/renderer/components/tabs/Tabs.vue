<template>
  <div :class="{ 'tabs-container': true }">
    <div  :class="{ tabs: true, [`is-${size}`]: size, [`is-${alignment}`]: alignment, [`is-${type}`]: type, 'is-fullwidth': isFullwidth }">
      <slot name="left-tab-list"></slot>
      <tab-list>
        <li v-for="(tab, index) in tabPanes"
          role="tab"
          :class="{ 'is-active': isActived(index), 'is-flex': true, 'inline-block': true, 'align-middle': true }"
          :aria-selected="isActived(index) ? 'true' : 'false'"
          :aria-expanded="isActived(index) ? 'true' : 'false'"
          :selected="isActived(index)"
          :key="index"
          @click="select(index)">
          <button :class="{ 'is-unselectable': true, 'btn': true, 'btn--compact': true, 'align-middle': true }">
            <!-- <span :class="['icon', { 'is-small': size !== 'large' }]" v-if="tab.icon"><i :class="tab.icon"></i></span> -->
            <span :class="{ 'align-middle': true }">{{ tab.label }}</span>
          </button>
        </li>
      </tab-list>
      <slot name="right-tab-list"></slot>
    </div>
    <div class="tab-content is-flex">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import TabList from './List';
import { findIndex } from 'lodash';

export default {
  components: {
    TabList
  },

  props: {
    isFullwidth: Boolean,
    layout: {
      type: String,
      default: 'top',
      validator (val) {
        return ['top', 'bottom', 'left', 'right'].indexOf(val) > -1;
      }
    },
    type: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    },
    alignment: {
      type: String,
      default: ''
    },
    selectedIndex: {
      type: Number,
      default: -1
    },
    animation: {
      type: String,
      default: 'fade'
    },
    onlyFade: {
      type: Boolean,
      default: true
    }
  },

  data () {
    return {
      realSelectedIndex: this.selectedIndex,
      tabPanes: []
    };
  },

  mounted () {
    this.update();
    if (this.$route.params.tab) {
      this.select(findIndex(this.tabPanes, (o) => { return o.label === this.$route.params.tab; }));
    }
    if (this.realSelectedIndex === -1) {
      this.select(0);
    }
  },

  methods: {
    update () {
      for (const tabPane of this.tabPanes) {
        if (tabPane.realSelected) {
          this.select(tabPane.index);
          break;
        }
      }
    },

    isActived (index) {
      return index === this.realSelectedIndex;
    },

    select (index) {
      this.$emit('tab-selected', index);
      this.realSelectedIndex = index;
      this.$router.push({
        name: this.$route.name,
        params: { tab: this.tabPanes[index].label }
      });
    }
  },
  watch: {
    selectedIndex (newIndex) {
      this.select(newIndex);
    }
  }
};
</script>
