<template>
  <svg-btn
    :name="name"
    :title="title"
    :className="winCls"
    :onClick="onClick"
    :path="path" />
</template>

<script>
import SvgBtn from './SvgBtn';

export default {
  props: [
    'name',
    'title',
    'className',
    'onClick',
    'path'
  ],
  computed: {
    winCls () {
      return ['window-ctrl', this.className].join(' ')
    },
  },
  components: {
    SvgBtn,
  },
};
</script>
