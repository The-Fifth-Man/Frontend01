<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>试卷详情</span>
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
        <v-btn
          v-if="userStore.isAdmin"
          variant="outlined"
          color="warning"
          size="small"
          prepend-icon="mdi-pencil"
          :to="{ name: 'exam-edit', params: { id: examId } }"
        >
          编辑试卷
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text v-if="examStore.isLoading">
        <div class="d-flex justify-center py-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>
      
      <template v-else-if="examStore.currentExam">
        <v-card-text>
          <div class="text-h5 mb-4">{{ examStore.currentExam.title }}</div>
          
          <div class="d-flex flex-wrap mb-4">
            <v-chip class="ma-1" color="primary" variant="outlined">
              <v-icon start>mdi-clock-outline</v-icon>
              {{ examStore.currentExam.duration }} 分钟
            </v-chip>
            
            <v-chip class="ma-1" color="success" variant="outlined">
              <v-icon start>mdi-checkbox-marked-circle-outline</v-icon>
              总分: {{ examStore.currentExam.totalScore }} 分
            </v-chip>
            
            <v-chip class="ma-1" color="info" variant="outlined">
              <v-icon start>mdi-counter</v-icon>
              题目: {{ getQuestionCount() }} 题
            </v-chip>
            
            <v-chip class="ma-1" color="grey" variant="outlined">
              <v-icon start>mdi-calendar</v-icon>
              {{ formatDate(examStore.currentExam.createdAt) }}
            </v-chip>
          </div>
          
          <v-divider class="mb-4"></v-divider>
          
          <!-- 试卷分析图表 -->
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">试卷分析</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-subtitle-2 mb-3">题型分布</div>
                  <v-sheet height="200">
                    <!-- 这里可以使用图表库，比如Chart.js，这里用简单的条形图代替 -->
                    <div class="d-flex flex-column h-100">
                      <div
                        v-for="(count, type) in getQuestionTypeDistribution()"
                        :key="type"
                        class="d-flex align-center mb-2"
                      >
                        <div class="text-body-2 mr-2" style="width: 80px;">{{ type }}</div>
                        <v-progress-linear
                          :model-value="(count / getQuestionCount()) * 100"
                          :color="getTypeColor(type)"
                          height="20"
                          class="flex-grow-1"
                        >
                          <template v-slot:default>{{ count }}题</template>
                        </v-progress-linear>
                      </div>
                    </div>
                  </v-sheet>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-3">
                  <div class="text-subtitle-2 mb-3">难度分布</div>
                  <v-sheet height="200">
                    <!-- 简单的难度条形图 -->
                    <div class="d-flex flex-column h-100">
                      <div
                        v-for="level in 5"
                        :key="level"
                        class="d-flex align-center mb-2"
                      >
                        <div class="text-body-2 mr-2" style="width: 80px;">
                          <v-rating
                            :model-value="level"
                            color="amber"
                            density="compact"
                            size="small"
                            readonly
                          ></v-rating>
                        </div>
                        <v-progress-linear
                          :model-value="(getDifficultyCount(level) / getQuestionCount()) * 100"
                          :color="getDifficultyColor(level)"
                          height="20"
                          class="flex-grow-1"
                        >
                          <template v-slot:default>{{ getDifficultyCount(level) }}题</template>
                        </v-progress-linear>
                      </div>
                    </div>
                  </v-sheet>
                </v-card>
              </v-col>
            </v-row>
          </div>
          
          <v-divider class="mb-4"></v-divider>
          
          <!-- 题目列表 -->
          <div>
            <div class="text-subtitle-1 mb-3">试题列表 ({{ getQuestionCount() }}题)</div>
            
            <div v-if="getQuestionCount() === 0" class="text-center pa-5 grey--text">
              <v-icon
                icon="mdi-help-circle-outline"
                size="large"
                color="grey"
                class="mb-2"
              ></v-icon>
              <div>暂无题目</div>
            </div>
            
            <div v-else>
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  v-for="(question, index) in examStore.currentExam.questions"
                  :key="question.id"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <div class="text-body-2 mr-2">第{{ index + 1 }}题</div>
                      <v-chip
                        size="small"
                        :color="getTypeColor(question.type)"
                        variant="outlined"
                        class="mr-2"
                      >
                        {{ question.type }}
                      </v-chip>
                      <v-rating
                        :model-value="question.difficulty"
                        color="amber"
                        density="compact"
                        size="x-small"
                        readonly
                        class="mr-2"
                      ></v-rating>
                      <div class="text-truncate">{{ question.content }}</div>
                      <v-spacer></v-spacer>
                      <div class="text-body-2 font-weight-bold">{{ question.score }}分</div>
                    </div>
                  </v-expansion-panel-title>
                  
                  <v-expansion-panel-text>
                    <div class="text-body-1 mb-3">{{ question.content }}</div>
                    
                    <!-- 选择题选项 -->
                    <div v-if="question.options && question.options.length > 0">
                      <v-list density="compact">
                        <v-list-item
                          v-for="option in question.options"
                          :key="option.key"
                          :class="isCorrectAnswer(question, option.key) ? 'bg-light-green-lighten-5' : ''"
                        >
                          <template v-slot:prepend>
                            <div class="font-weight-bold mr-2">{{ option.key }}.</div>
                          </template>
                          
                          <v-list-item-title>{{ option.value }}</v-list-item-title>
                          
                          <template v-slot:append v-if="isCorrectAnswer(question, option.key)">
                            <v-icon color="success">mdi-check-circle</v-icon>
                          </template>
                        </v-list-item>
                      </v-list>
                    </div>
                    
                    <!-- 问答题答案 -->
                    <div v-else>
                      <div class="text-subtitle-2 mb-2">参考答案:</div>
                      <div class="text-body-2 pa-3 bg-grey-lighten-4 rounded">
                        {{ question.answer }}
                      </div>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            color="primary"
            prepend-icon="mdi-pencil"
            :to="{ name: 'exam-taking', params: { id: examId } }"
          >
            开始答题
          </v-btn>
          <v-btn
            color="info"
            prepend-icon="mdi-printer"
            @click="printExam"
          >
            打印试卷
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="userStore.isAdmin"
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete"
          >
            删除试卷
          </v-btn>
        </v-card-actions>
      </template>
      
      <v-card-text v-else-if="examStore.error">
        <v-alert type="error" variant="tonal">
          {{ examStore.error }}
        </v-alert>
      </v-card-text>
    </v-card>
    
    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除"{{ examStore.currentExam?.title }}"吗？此操作不可恢复。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="deleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            @click="deleteExam"
            :loading="examStore.isLoading"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '../../stores/exam'
import { useUserStore } from '../../stores/user'
import { QuestionType } from '../../mock'

// 获取路由参数
const route = useRoute()
const router = useRouter()
const examId = route.params.id as string

// 获取store
const examStore = useExamStore()
const userStore = useUserStore()

// 删除对话框控制
const deleteDialog = ref(false)

// 页面加载时获取数据
onMounted(async () => {
  await fetchExam()
})

// 获取试卷详情
async function fetchExam() {
  await examStore.fetchExam(examId)
}

// 确认删除试卷
function confirmDelete() {
  deleteDialog.value = true
}

// 删除试卷
async function deleteExam() {
  try {
    await examStore.deleteExam(examId)
    deleteDialog.value = false
    
    // 返回试卷列表页面
    router.push({ name: 'exams' })
  } catch (error) {
    console.error('删除试卷失败', error)
  }
}

// 打印试卷
function printExam() {
  window.print()
}

// 获取试卷题目数量
function getQuestionCount() {
  return examStore.currentExam?.questions?.length || 0
}

// 获取题型分布
function getQuestionTypeDistribution() {
  const distribution: Record<string, number> = {}
  
  if (!examStore.currentExam?.questions) return distribution
  
  for (const question of examStore.currentExam.questions) {
    if (distribution[question.type]) {
      distribution[question.type]++
    } else {
      distribution[question.type] = 1
    }
  }
  
  return distribution
}

// 获取难度为level的题目数量
function getDifficultyCount(level: number) {
  if (!examStore.currentExam?.questions) return 0
  
  return examStore.currentExam.questions.filter(q => q.difficulty === level).length
}

// 判断选项是否为正确答案
function isCorrectAnswer(question: any, key: string) {
  if (!question) return false
  
  if (question.type === QuestionType.MULTIPLE_CHOICE) {
    return Array.isArray(question.answer) && question.answer.includes(key)
  } else {
    return question.answer === key
  }
}

// 获取题型颜色
function getTypeColor(type: string) {
  switch (type) {
    case QuestionType.SINGLE_CHOICE:
      return 'primary'
    case QuestionType.MULTIPLE_CHOICE:
      return 'secondary'
    case QuestionType.TRUE_FALSE:
      return 'success'
    case QuestionType.SHORT_ANSWER:
      return 'warning'
    default:
      return 'grey'
  }
}

// 获取难度颜色
function getDifficultyColor(difficulty: number) {
  switch (difficulty) {
    case 1: return 'success'
    case 2: return 'light-green'
    case 3: return 'warning'
    case 4: return 'orange'
    case 5: return 'error'
    default: return 'grey'
  }
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  
  .v-expansion-panel-title {
    min-height: auto !important;
  }
  
  .v-expansion-panel-text {
    display: block !important;
  }
}
</style> 