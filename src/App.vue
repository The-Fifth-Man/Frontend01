<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-wrapper">
    <RouterView />
  </div>
</template>

<style>
/* 全局样式可以在这里添加 */
.app-wrapper {
  background-color: #FFFFFF !important;
  min-height: 100vh;
  width: 100%;
}
</style>
