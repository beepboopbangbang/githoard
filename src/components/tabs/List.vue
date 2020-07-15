<template>
  <ul :class="classObject" role="tablist">
    <slot></slot>
  </ul>
</template>

<script>
export default {
  props: {
    alignment: {
      type: String,
      default: '',
    }
  },

  computed: {
    classObject () {
      return {
        'flex': true,
        'justify-center': true,
      };
    }
  }
};
</script>
