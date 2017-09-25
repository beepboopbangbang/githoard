<template>
  <button :aria-label="name" :title="title" tabIndex="-1" :class="['window-ctrl', className]" @click="onClick || false">
    <svg aria-hidden="true" version="1.1" width="16" height="16">
      <path :d="path"></path>
    </svg>
  </button>
</template>

<script>
export default {
  props: [
    'name',
    'title',
    'className',
    'onClick',
    'path'
  ]
};
</script>
