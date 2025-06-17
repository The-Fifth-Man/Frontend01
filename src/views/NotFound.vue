<template>
  <v-container fluid class="text-center">
    <v-row justify="center" align="center" style="min-height: 70vh;">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-6">
          <div class="text-h1 font-weight-bold text-primary mb-4">404</div>
          <div class="text-h4 mb-6">页面不存在</div>
          <div class="text-body-1 mb-8">
            您尝试访问的页面不存在或已被移除。
          </div>
          <v-btn
            color="primary"
            size="large"
            :to="{ name: 'home' }"
          >
            返回首页
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// 404 页面
</script> 