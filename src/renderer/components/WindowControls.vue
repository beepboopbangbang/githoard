<template>
  <button :aria-label="name" :title="title" tabIndex="-1" :class="['window-ctrl', className]" @click="onClick">
    <svg aria-hidden='true' version='1.1' width='10' height='10'>
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
