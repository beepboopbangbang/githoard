<template>
  <button :aria-label="name" :type="type" :title="title" tabIndex="-1" :class="['window-ctrl', 'txt-xl', className]">
    <i class="gh" :class="[path]" aria-hidden="true"></i>
  </button>
</template>

<script>
export default {
  props: [
    'type',
    'name',
    'title',
    'className',
    'path'
  ]
};
</script>

