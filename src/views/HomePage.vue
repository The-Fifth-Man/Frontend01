<template>
  <div class="home-page-wrapper">
    <!-- 头部背景图 -->
    <div class="header-background">
      <v-container fluid class="home-container pa-4">
        <v-row class="mb-5">
          <v-col cols="12">
            <v-card class="mx-auto welcome-card" style="width: 100%; max-width: 1200px;">
              <v-card-title class="text-h4">
                欢迎使用考试题库管理系统
              </v-card-title>
              <v-card-text>
                <p class="text-body-1">
                  本系统为教师提供全面的题库管理、组卷和在线考试功能，帮助您更高效地进行教学工作。
                </p>
                <v-divider class="my-4"></v-divider>
                <div class="d-flex flex-wrap">
                  <v-btn
                    class="ma-2"
                    color="primary"
                    prepend-icon="mdi-book-open-variant"
                    variant="tonal"
                    :to="{ name: 'questions' }"
                  >
                    题库管理
                  </v-btn>
                  <v-btn
                    class="ma-2"
                    color="success"
                    prepend-icon="mdi-file-document-multiple"
                    variant="tonal"
                    :to="{ name: 'exams' }"
                  >
                    试卷管理
                  </v-btn>
                  <v-btn
                    v-if="userStore.isAdmin"
                    class="ma-2"
                    color="info"
                    prepend-icon="mdi-file-plus"
                    variant="tonal"
                    :to="{ name: 'exam-create' }"
                  >
                    创建试卷
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
    
    <!-- 功能卡片区域 -->
    <v-container fluid class="home-container pa-4">
      <v-row>
        <v-col cols="12" md="4">
          <v-card height="100%">
            <v-card-title>
              <v-icon class="mr-2" icon="mdi-book-open-variant"></v-icon>
              题库管理
            </v-card-title>
            <v-card-text>
              <p>系统支持多种题型：</p>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-checkbox-marked-circle-outline" color="primary"></v-icon>
                    单选题
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-checkbox-multiple-marked-outline" color="primary"></v-icon>
                    多选题
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-check-circle-outline" color="primary"></v-icon>
                    判断题
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-text-box-outline" color="primary"></v-icon>
                    问答题
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-btn
                block
                color="primary"
                variant="tonal"
                :to="{ name: 'questions' }"
              >
                进入题库
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card height="100%">
            <v-card-title>
              <v-icon class="mr-2" icon="mdi-file-document-multiple"></v-icon>
              试卷管理
            </v-card-title>
            <v-card-text>
              <p>试卷管理功能包括：</p>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-plus-circle-outline" color="success"></v-icon>
                    智能组卷
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-drag-variant" color="success"></v-icon>
                    拖拽排序
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-chart-line" color="success"></v-icon>
                    难度分析
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-file-export" color="success"></v-icon>
                    导出试卷
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-btn
                block
                color="success"
                variant="tonal"
                :to="{ name: 'exams' }"
              >
                管理试卷
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card height="100%">
            <v-card-title>
              <v-icon class="mr-2" icon="mdi-brain"></v-icon>
              AI 助手
            </v-card-title>
            <v-card-text>
              <p>智能助手帮您提高效率：</p>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-robot" color="info"></v-icon>
                    智能出题
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-check-decagram" color="info"></v-icon>
                    自动评分
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-chart-box" color="info"></v-icon>
                    考试分析
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <v-icon class="mr-2" icon="mdi-lightbulb-on" color="info"></v-icon>
                    智能推荐
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-btn
                block
                color="info"
                variant="tonal"
              >
                打开助手
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
</script>

<style scoped>
.home-page-wrapper {
  width: 100%;
}

.home-container {
  width: 100%;
  max-width: 100% !important;
}

.header-background {
  width: 100%;
  background-image: url("https://cdn.vuetifyjs.com/images/cards/sunshine.jpg");
  background-size: cover;
  background-position: center;
  padding: 80px 0;
}

.welcome-card {
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
}
</style> 