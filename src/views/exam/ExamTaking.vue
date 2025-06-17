<template>
  <v-container fluid>
    <v-card v-if="loading" class="d-flex justify-center align-center" height="400">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card>

    <template v-else-if="!examData">
      <v-alert type="error" title="加载失败" text="试卷不存在或已被删除"></v-alert>
      <v-btn color="primary" :to="{ name: 'exams' }">返回试卷列表</v-btn>
    </template>

    <template v-else>
      <!-- 考试信息和计时器 -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>{{ examData.title }}</span>
              <v-chip color="error" size="large" v-if="timeLeft">
                <v-icon start icon="mdi-clock-outline"></v-icon>
                {{ formatTime(timeLeft) }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle>
              <div class="d-flex flex-wrap gap-2">
                <v-chip size="small" color="info">{{ examData.subject }}</v-chip>
                <v-chip size="small">总分: {{ examData.totalScore }}分</v-chip>
                <v-chip size="small">题目数: {{ examData.questions.length }}</v-chip>
                <v-chip size="small">时长: {{ examData.duration }}分钟</v-chip>
              </div>
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- 答题区域 -->
      <v-row class="mt-4">
        <v-col cols="12" md="8">
          <!-- 题目内容 -->
          <v-card>
            <v-card-title class="d-flex align-center">
              <span class="text-subtitle-1 font-weight-bold">
                {{ currentIndex + 1 }}. [{{ getQuestionTypeName(currentQuestion.type) }}]
                {{ currentQuestion.content }}
              </span>
              <v-spacer></v-spacer>
              <v-chip color="primary" size="small">{{ currentQuestion.score }}分</v-chip>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
              <!-- 选择题 -->
              <div v-if="currentQuestion.type === 'single' || currentQuestion.type === 'multiple'">
                <v-radio-group
                  v-if="currentQuestion.type === 'single'"
                  v-model="answers[currentQuestion.id]"
                  :disabled="submitted"
                >
                  <v-radio
                    v-for="option in currentQuestion.options"
                    :key="option.value"
                    :label="option.label + '. ' + option.text"
                    :value="option.value"
                  ></v-radio>
                </v-radio-group>

                <v-checkbox-group
                  v-else
                  v-model="answers[currentQuestion.id]"
                  :disabled="submitted"
                >
                  <v-checkbox
                    v-for="option in currentQuestion.options"
                    :key="option.value"
                    :label="option.label + '. ' + option.text"
                    :value="option.value"
                  ></v-checkbox>
                </v-checkbox-group>
              </div>

              <!-- 判断题 -->
              <div v-else-if="currentQuestion.type === 'boolean'">
                <v-radio-group
                  v-model="answers[currentQuestion.id]"
                  :disabled="submitted"
                  inline
                >
                  <v-radio label="正确" :value="true"></v-radio>
                  <v-radio label="错误" :value="false"></v-radio>
                </v-radio-group>
              </div>

              <!-- 问答题 -->
              <div v-else-if="currentQuestion.type === 'essay'">
                <v-textarea
                  v-model="answers[currentQuestion.id]"
                  :disabled="submitted"
                  auto-grow
                  rows="5"
                  counter
                  placeholder="请在此输入答案..."
                ></v-textarea>
              </div>

              <!-- 结果显示 -->
              <div v-if="submitted" class="mt-4 pt-2 border-t">
                <div class="text-h6 mb-2">参考答案</div>
                <div v-if="currentQuestion.type === 'single' || currentQuestion.type === 'multiple'">
                  {{ formatMultipleChoiceAnswer(currentQuestion.answer) }}
                </div>
                <div v-else-if="currentQuestion.type === 'boolean'">
                  {{ currentQuestion.answer ? '正确' : '错误' }}
                </div>
                <div v-else>
                  {{ currentQuestion.answer }}
                </div>

                <div class="text-h6 mt-4 mb-2">解析</div>
                <div>{{ currentQuestion.explanation || '暂无解析' }}</div>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn
                color="primary"
                variant="text"
                :disabled="currentIndex === 0"
                @click="prevQuestion"
              >
                上一题
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="text"
                :disabled="currentIndex === examData.questions.length - 1"
                @click="nextQuestion"
              >
                下一题
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- 答题导航 -->
          <v-card>
            <v-card-title>答题卡</v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-btn
                  v-for="(question, index) in examData.questions"
                  :key="question.id"
                  size="small"
                  :variant="currentIndex === index ? 'elevated' : 'outlined'"
                  :color="getButtonColor(question.id)"
                  @click="goToQuestion(index)"
                >
                  {{ index + 1 }}
                </v-btn>
              </div>
              <div class="d-flex flex-wrap gap-2 mt-4">
                <div class="d-flex align-center">
                  <v-btn size="small" color="success" disabled variant="tonal"></v-btn>
                  <span class="ml-2">已答</span>
                </div>
                <div class="d-flex align-center">
                  <v-btn size="small" color="error" disabled variant="tonal"></v-btn>
                  <span class="ml-2">未答</span>
                </div>
                <div class="d-flex align-center">
                  <v-btn size="small" disabled variant="elevated"></v-btn>
                  <span class="ml-2">当前题</span>
                </div>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="justify-center">
              <v-btn
                color="primary"
                block
                :disabled="submitted || !canSubmit || submitting"
                @click="submitExam"
                :loading="submitting"
              >
                {{ submitted ? '已交卷' : '交卷' }}
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- 成绩卡 -->
          <v-card v-if="submitted && examResult" class="mt-4">
            <v-card-title>考试结果</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-check-circle" color="success"></v-icon>
                  </template>
                  <v-list-item-title>得分: {{ examResult.score }} / {{ examResult.totalScore }}</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-clock-outline" color="info"></v-icon>
                  </template>
                  <v-list-item-title>用时: {{ formatTime(examResult.usedTime) }}</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-percent" color="warning"></v-icon>
                  </template>
                  <v-list-item-title>
                    正确率: {{ ((examResult.correctCount / examResult.totalCount) * 100).toFixed(1) }}%
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="primary"
                block
                :to="{ name: 'exams' }"
              >
                返回试卷列表
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- 提交确认对话框 -->
      <v-dialog v-model="confirmDialog" max-width="500">
        <v-card>
          <v-card-title>确认提交</v-card-title>
          <v-card-text>
            <p>您确定要提交试卷吗？</p>
            <v-alert v-if="unansweredQuestions.length > 0" type="warning" density="compact">
              您还有 {{ unansweredQuestions.length }} 道题目未作答。
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="confirmDialog = false">取消</v-btn>
            <v-btn color="primary" @click="confirmSubmit" :loading="submitting">确认提交</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      
      <!-- 提交结果弹窗 -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        location="top"
      >
        {{ snackbar.text }}
        
        <template v-slot:actions>
          <v-btn
            variant="text"
            @click="snackbar.show = false"
          >
            关闭
          </v-btn>
        </template>
      </v-snackbar>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useUserStore } from '@/stores/user'
import { examTakingApi } from '@/api'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const userStore = useUserStore()

// 状态变量
const loading = ref(true)
const submitting = ref(false)
const examData = ref<any>(null)
const currentIndex = ref(0)
const answers = ref<Record<string, any>>({})
const submitted = ref(false)
const confirmDialog = ref(false)
const timeLeft = ref(0)
const usedTime = ref(0)
const timer = ref<number | null>(null)
const examResult = ref<any>(null)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// 当前题目
const currentQuestion = computed(() => {
  if (!examData.value || !examData.value.questions.length) return null
  return examData.value.questions[currentIndex.value]
})

// 未答题目
const unansweredQuestions = computed(() => {
  if (!examData.value) return []
  return examData.value.questions.filter((q: any) => {
    // 检查是否已作答
    if (answers.value[q.id] === undefined) return true
    if (q.type === 'multiple' && answers.value[q.id].length === 0) return true
    if (q.type === 'essay' && answers.value[q.id].trim() === '') return true
    return false
  })
})

// 是否可以提交
const canSubmit = computed(() => {
  return examData.value && examData.value.questions.length > 0
})

// 初始化考试数据
onMounted(async () => {
  try {
    const examId = route.params.id as string
    const exam = await examStore.getExamById(examId)
    
    if (!exam) {
      loading.value = false
      return
    }
    
    // 初始化考试数据
    examData.value = exam
    
    // 初始化答案对象
    exam.questions.forEach((q: any) => {
      if (q.type === 'multiple') {
        answers.value[q.id] = []
      } else {
        answers.value[q.id] = undefined
      }
    })
    
    // 设置计时器
    if (exam.duration > 0) {
      timeLeft.value = exam.duration * 60
      startTimer()
    }
    
    loading.value = false
  } catch (error) {
    console.error('加载试卷失败', error)
    loading.value = false
    showMessage('加载试卷失败', 'error')
  }
})

// 清理计时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 监听路由变化，提示用户未保存的更改
watch(() => route.path, (newPath, oldPath) => {
  if (!submitted.value && examData.value && !confirmDialog.value) {
    if (confirm('您确定要离开考试页面吗？未提交的答案将会丢失。')) {
      // 允许离开
    } else {
      // 阻止离开
      router.push(oldPath)
    }
  }
})

// 开始计时
function startTimer() {
  const startTime = Date.now()
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      usedTime.value = Math.floor((Date.now() - startTime) / 1000)
    } else {
      // 时间到，自动提交
      submitExam()
    }
  }, 1000) as unknown as number
}

// 格式化时间
function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 题目类型名称
function getQuestionTypeName(type: string) {
  const typeMap: Record<string, string> = {
    'single': '单选题',
    'multiple': '多选题',
    'boolean': '判断题',
    'essay': '问答题'
  }
  return typeMap[type] || type
}

// 格式化选择题答案
function formatMultipleChoiceAnswer(answer: string | string[]) {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return answer
}

// 获取按钮颜色
function getButtonColor(questionId: string) {
  if (submitted.value && examResult.value) {
    // 已提交状态下，根据答案正确与否显示颜色
    const questionResult = examResult.value.answers[questionId]
    return questionResult?.isCorrect ? 'success' : 'error'
  } else {
    // 未提交状态下，根据是否已答显示颜色
    const answered = answers.value[questionId] !== undefined
    if (Array.isArray(answers.value[questionId])) {
      return answers.value[questionId].length > 0 ? 'success' : 'error'
    }
    if (answers.value[questionId] === '') {
      return 'error'
    }
    return answered ? 'success' : 'error'
  }
}

// 导航到指定题目
function goToQuestion(index: number) {
  currentIndex.value = index
}

// 上一题
function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一题
function nextQuestion() {
  if (currentIndex.value < examData.value.questions.length - 1) {
    currentIndex.value++
  }
}

// 提交试卷
function submitExam() {
  if (unansweredQuestions.value.length > 0) {
    confirmDialog.value = true
  } else {
    confirmSubmit()
  }
}

// 显示消息
function showMessage(text: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// 确认提交
async function confirmSubmit() {
  confirmDialog.value = false
  submitting.value = true
  
  try {
    // 停止计时器
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    
    // 提交答卷到服务器
    const submission = {
      examId: examData.value.id,
      userId: userStore.currentUser?.id,
      answers: answers.value,
      usedTime: usedTime.value
    }
    
    // 调用API提交答案
    const result = await examTakingApi.submitExam(submission)
    
    // 保存考试结果
    examResult.value = result
    submitted.value = true
    
    // 显示提交成功消息
    showMessage('试卷提交成功')
  } catch (error) {
    console.error('提交试卷失败', error)
    showMessage('提交试卷失败，请重试', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style> 