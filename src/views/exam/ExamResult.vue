<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>考试结果详情</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-arrow-left"
          :to="{ name: 'exams' }"
          class="mr-2"
        >
          返回列表
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text v-if="loading">
        <div class="d-flex justify-center py-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>
      
      <template v-else-if="resultData">
        <!-- 考试基本信息和成绩 -->
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <div class="text-h5 mb-2">{{ examTitle }}</div>
              <div class="d-flex flex-wrap mb-4">
                <v-chip class="ma-1" color="primary" variant="outlined">
                  <v-icon start>mdi-calendar</v-icon>
                  {{ formatDate(resultData.submittedAt) }}
                </v-chip>
                <v-chip class="ma-1" color="info" variant="outlined">
                  <v-icon start>mdi-clock-outline</v-icon>
                  用时: {{ formatTime(resultData.usedTime) }}
                </v-chip>
                <v-chip class="ma-1" color="success" variant="outlined">
                  <v-icon start>mdi-check-circle</v-icon>
                  正确: {{ resultData.correctCount }}/{{ resultData.totalCount }}
                </v-chip>
              </div>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="pa-4 text-center">
                <div class="text-h6 mb-2">最终成绩</div>
                <div class="text-h3 font-weight-bold" :class="getScoreColorClass(resultData.score, resultData.totalScore)">
                  {{ resultData.score }}
                </div>
                <div class="text-body-1 mb-2">总分: {{ resultData.totalScore }}</div>
                <v-progress-linear
                  :model-value="(resultData.score / resultData.totalScore) * 100"
                  :color="getScoreColor(resultData.score, resultData.totalScore)"
                  height="10"
                  rounded
                  class="mb-2"
                ></v-progress-linear>
                <div class="text-body-2">
                  正确率: {{ ((resultData.correctCount / resultData.totalCount) * 100).toFixed(2) }}%
                </div>
              </v-card>
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <!-- 答题情况分析 -->
          <div class="text-h6 mb-4">答题详情</div>
          
          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(detail, questionId) in resultData.answers"
              :key="questionId"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon
                    :icon="detail.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle'"
                    :color="detail.isCorrect ? 'success' : 'error'"
                    class="mr-2"
                  ></v-icon>
                  <div class="text-truncate">问题 #{{ questionId.substring(0, 8) }}</div>
                  <v-spacer></v-spacer>
                  <v-chip
                    size="small"
                    :color="detail.isCorrect ? 'success' : 'error'"
                    class="ml-2"
                  >
                    {{ detail.score }} 分
                  </v-chip>
                </div>
              </v-expansion-panel-title>
              
              <v-expansion-panel-text>
                <v-card variant="outlined" class="mb-3">
                  <v-card-text>
                    <div class="text-subtitle-1 mb-2">您的答案:</div>
                    <div 
                      v-if="Array.isArray(detail.userAnswer)" 
                      class="d-flex flex-wrap"
                    >
                      <v-chip
                        v-for="option in detail.userAnswer"
                        :key="option"
                        class="ma-1"
                        :color="isOptionCorrect(detail, option) ? 'success' : 'error'"
                      >
                        {{ option }}
                      </v-chip>
                    </div>
                    <div v-else-if="typeof detail.userAnswer === 'string'">
                      {{ detail.userAnswer }}
                    </div>
                    <div v-else class="text-grey">未作答</div>
                  </v-card-text>
                </v-card>
                
                <v-card variant="outlined" color="light-green-lighten-5">
                  <v-card-text>
                    <div class="text-subtitle-1 mb-2">正确答案:</div>
                    <div 
                      v-if="Array.isArray(detail.correctAnswer)" 
                      class="d-flex flex-wrap"
                    >
                      <v-chip
                        v-for="option in detail.correctAnswer"
                        :key="option"
                        class="ma-1"
                        color="success"
                      >
                        {{ option }}
                      </v-chip>
                    </div>
                    <div v-else>
                      {{ detail.correctAnswer }}
                    </div>
                  </v-card-text>
                </v-card>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            color="primary"
            variant="text"
            prepend-icon="mdi-file-document"
            :to="{ name: 'exam-detail', params: { id: resultData.examId } }"
          >
            查看试卷
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="success"
            prepend-icon="mdi-share-variant"
            @click="shareResult"
          >
            分享结果
          </v-btn>
          <v-btn
            color="info"
            prepend-icon="mdi-printer"
            @click="printResult"
          >
            打印结果
          </v-btn>
        </v-card-actions>
      </template>
      
      <v-card-text v-else>
        <v-alert type="error" title="加载失败" text="考试结果不存在或已被删除"></v-alert>
        <v-btn
          color="primary"
          variant="text"
          :to="{ name: 'exams' }"
          class="mt-3"
        >
          返回试卷列表
        </v-btn>
      </v-card-text>
    </v-card>
    
    <!-- 分享对话框 -->
    <v-dialog v-model="shareDialog" max-width="500">
      <v-card>
        <v-card-title>分享我的考试成绩</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item prepend-icon="mdi-wechat" title="微信" @click="shareToApp('wechat')"></v-list-item>
            <v-list-item prepend-icon="mdi-qqchat" title="QQ" @click="shareToApp('qq')"></v-list-item>
            <v-list-item prepend-icon="mdi-link" title="复制链接" @click="copyLink"></v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="shareDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 提示消息 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { examTakingApi } from '../../api'
import { useExamStore } from '../../stores/exam'

// 路由参数
const route = useRoute()
const resultId = route.params.id as string

// 状态变量
const loading = ref(true)
const resultData = ref<any>(null)
const examTitle = ref('')
const shareDialog = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// 获取store
const examStore = useExamStore()

// 页面加载时获取数据
onMounted(async () => {
  await fetchResult()
})

// 获取考试结果
async function fetchResult() {
  loading.value = true
  
  try {
    // 获取考试结果
    resultData.value = await examTakingApi.getExamResult(resultId)
    
    // 获取试卷信息
    await examStore.fetchExam(resultData.value.examId)
    
    // 设置试卷标题
    if (examStore.currentExam) {
      examTitle.value = examStore.currentExam.title
    } else {
      examTitle.value = '未知试卷'
    }
  } catch (error) {
    console.error('获取考试结果失败', error)
    resultData.value = null
  } finally {
    loading.value = false
  }
}

// 格式化时间
function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分数颜色
function getScoreColor(score: number, totalScore: number) {
  const percentage = (score / totalScore) * 100
  if (percentage >= 90) return 'success'
  if (percentage >= 60) return 'info'
  return 'error'
}

// 获取分数颜色类名
function getScoreColorClass(score: number, totalScore: number) {
  const percentage = (score / totalScore) * 100
  if (percentage >= 90) return 'text-success'
  if (percentage >= 60) return 'text-info'
  return 'text-error'
}

// 判断选项是否正确
function isOptionCorrect(detail: any, option: string) {
  if (Array.isArray(detail.correctAnswer)) {
    return detail.correctAnswer.includes(option)
  }
  return detail.correctAnswer === option
}

// 分享结果
function shareResult() {
  shareDialog.value = true
}

// 分享到指定应用
function shareToApp(app: string) {
  // 实际项目中需要接入真实的分享SDK
  console.log(`分享到${app}`, {
    title: `${examTitle.value}考试成绩`,
    content: `我在${examTitle.value}中获得了${resultData.value.score}分！`,
    url: window.location.href
  })
  
  shareDialog.value = false
  showMessage(`已分享到${app === 'wechat' ? '微信' : 'QQ'}`, 'success')
}

// 复制链接
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      shareDialog.value = false
      showMessage('链接已复制到剪贴板', 'success')
    })
    .catch(err => {
      console.error('复制失败', err)
      showMessage('复制失败，请手动复制', 'error')
    })
}

// 打印结果
function printResult() {
  window.print()
}

// 显示消息
function showMessage(text: string, color: string = 'success') {
  snackbar.value = {
    show: true,
    text,
    color
  }
}
</script>

<style>
@media print {
  .v-app-bar,
  .v-navigation-drawer,
  .v-footer,
  .v-card-actions,
  .v-btn {
    display: none !important;
  }
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 