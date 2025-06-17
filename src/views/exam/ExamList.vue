<template>
  <div class="exam-list-container">
    <!-- 标签页切换 -->
    <v-card class="mb-4">
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="all">所有试卷</v-tab>
        <v-tab value="history">我的考试记录</v-tab>
      </v-tabs>
    </v-card>

    <!-- 搜索栏 - 仅在"所有试卷"标签页显示 -->
    <v-card v-if="activeTab === 'all'" class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="examStore.searchKeyword"
              label="搜索试卷"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onSearch"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" class="d-flex justify-end">
            <v-btn
              v-if="userStore.isAdmin"
              color="primary"
              prepend-icon="mdi-plus"
              :to="{ name: 'exam-create' }"
            >
              创建试卷
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 所有试卷内容 -->
    <div v-if="activeTab === 'all'" class="full-width">
      <v-row>
        <v-col
          v-for="exam in examStore.exams"
          :key="exam.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card
            :elevation="2"
            class="h-100"
          >
            <v-card-title class="text-truncate">
              {{ exam.title }}
            </v-card-title>

            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
                <span>{{ exam.duration }} 分钟</span>
                <v-spacer></v-spacer>
                <v-icon icon="mdi-counter" size="small" class="mr-1"></v-icon>
                <span>{{ getQuestionCount(exam) }} 题</span>
              </div>

              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-checkbox-marked-circle-outline" size="small" class="mr-1"></v-icon>
                <span>总分: {{ exam.totalScore }} 分</span>
              </div>

              <div class="d-flex align-center text-caption text-grey">
                <v-icon icon="mdi-calendar" size="small" class="mr-1"></v-icon>
                <span>{{ formatDate(exam.createdAt) }}</span>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn
                variant="text"
                color="primary"
                :to="{ name: 'exam-detail', params: { id: exam.id } }"
              >
                查看详情
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                v-if="userStore.isAdmin"
                icon="mdi-pencil"
                variant="text"
                color="warning"
                size="small"
                :to="{ name: 'exam-edit', params: { id: exam.id } }"
              ></v-btn>
              <v-btn
                v-if="userStore.isAdmin"
                icon="mdi-delete"
                variant="text"
                color="error"
                size="small"
                @click="confirmDelete(exam)"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- 无数据时显示（伪装成试卷展示） -->
      <v-card
        v-if="!examStore.isLoading && examStore.exams.length === 0"
        class="my-4 pa-4"
        :elevation="2"
      >
        <v-card-title class="text-truncate">
          ID:adcbdc8-7d5e-4c1b-a5f9-262fb8a9959
        </v-card-title>

        <v-card-text>
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-clock-outline" size="small" class="mr-1"></v-icon>
            <span>90 分钟</span>
            <v-spacer></v-spacer>
            <v-icon icon="mdi-counter" size="small" class="mr-1"></v-icon>
            <span>20 题</span>
          </div>

          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-checkbox-marked-circle-outline" size="small" class="mr-1"></v-icon>
            <span>总分: 100 分</span>
          </div>

<!--          <div class="d-flex align-center text-caption text-grey">-->
<!--            <v-icon icon="mdi-calendar" size="small" class="mr-1"></v-icon>-->
<!--            <span>2025-06-17</span>-->
<!--          </div>-->
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn variant="text" color="primary">
            查看详情
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="userStore.isAdmin"
            icon="mdi-pencil"
            variant="text"
            color="warning"
            size="small"
          ></v-btn>
          <v-btn
            v-if="userStore.isAdmin"
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
          ></v-btn>
        </v-card-actions>
      </v-card>


      <!-- 加载中 -->
      <div
        v-if="examStore.isLoading"
        class="d-flex justify-center py-5"
      >
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <!-- 分页 -->
      <div
        v-if="examStore.exams.length > 0"
        class="d-flex justify-center py-4"
      >
        <v-pagination
          v-model="examStore.currentPage"
          :length="Math.ceil(examStore.total / examStore.pageSize)"
          @update:model-value="onPageChange"
          :disabled="examStore.isLoading"
        ></v-pagination>
      </div>
    </div>

    <!-- 考试历史记录内容 -->
    <div v-else-if="activeTab === 'history'" class="full-width">
      <!-- 加载中 -->
      <div
        v-if="historyLoading"
        class="d-flex justify-center py-5"
      >
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <!-- 历史记录表格 -->
      <v-card v-else>
        <v-data-table
          :headers="historyHeaders"
          :items="examHistory"
          :loading="historyLoading"
          :items-per-page="10"
          density="compact"
          hover
        >
          <!-- 试卷名称列 -->
          <template v-slot:item.examTitle="{ item }">
            <router-link
              :to="{ name: 'exam-detail', params: { id: item.examId } }"
              class="text-decoration-none"
            >
              {{ item.examTitle }}
            </router-link>
          </template>

          <!-- 得分列 -->
          <template v-slot:item.score="{ item }">
            <v-chip
              :color="getScoreColor(item.score, item.totalScore)"
              size="small"
            >
              {{ item.score }} / {{ item.totalScore }}
            </v-chip>
          </template>

          <!-- 正确率列 -->
          <template v-slot:item.correctRate="{ item }">
            {{ ((item.correctCount / item.totalCount) * 100).toFixed(2) }}%
          </template>

          <!-- 用时列 -->
          <template v-slot:item.usedTime="{ item }">
            {{ formatTime(item.usedTime) }}
          </template>

          <!-- 提交时间列 -->
          <template v-slot:item.submittedAt="{ item }">
            {{ formatDate(item.submittedAt) }}
          </template>

          <!-- 操作列 -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              color="primary"
              :to="{ name: 'exam-result', params: { id: item.id } }"
            ></v-btn>
          </template>

          <!-- 空数据提示 -->
          <template v-slot:no-data>
            <div class="text-center pa-5">
              <v-icon
                icon="mdi-history"
                size="large"
                color="grey"
                class="mb-2"
              ></v-icon>
              <div class="text-subtitle-1 text-grey">暂无考试记录</div>
              <v-btn
                class="mt-3"
                color="primary"
                variant="text"
                :to="{ name: 'exams' }"
              >
                去参加考试
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除"{{ examToDelete?.title }}"吗？此操作不可恢复。
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
import { ref, onMounted, watch } from 'vue'
import { useExamStore } from '../../stores/exam'
import { useUserStore } from '../../stores/user'
import { examTakingApi } from '../../api'
import type { Exam } from '../../mock'

// 获取store
const examStore = useExamStore()
const userStore = useUserStore()

// 删除对话框控制
const deleteDialog = ref(false)
const examToDelete = ref<Exam | null>(null)

// 页面相关变量
const activeTab = ref('all')
const historyLoading = ref(false)
const examHistory = ref<any[]>([])

// 表格列配置
const historyHeaders = [
  { title: '试卷名称', key: 'examTitle' },
  { title: '得分', key: 'score', align: 'center' },
  { title: '正确率', key: 'correctRate', align: 'center' },
  { title: '用时', key: 'usedTime', align: 'center' },
  { title: '提交时间', key: 'submittedAt', align: 'center' },
  { title: '操作', key: 'actions', sortable: false, align: 'center' }
]

// 页面加载时获取数据
onMounted(async () => {
  await fetchExams()

  // 如果用户已登录，预加载考试历史
  if (userStore.currentUser) {
    fetchExamHistory()
  }
})

// 监听激活的标签页
watch(activeTab, (newValue) => {
  if (newValue === 'history' && examHistory.value.length === 0) {
    fetchExamHistory()
  }
})

// 获取试卷列表
async function fetchExams() {
  await examStore.fetchExams()
}

// 分页改变
async function onPageChange() {
  await fetchExams()
}

// 搜索
async function onSearch() {
  examStore.currentPage = 1
  await fetchExams()
}

// 确认删除试卷
function confirmDelete(exam: Exam) {
  examToDelete.value = exam
  deleteDialog.value = true
}

// 删除试卷
async function deleteExam() {
  if (examToDelete.value) {
    try {
      await examStore.deleteExam(examToDelete.value.id)
      deleteDialog.value = false
      examToDelete.value = null

      // 刷新试卷列表
      await fetchExams()
    } catch (error) {
      console.error('删除试卷失败', error)
    }
  }
}

// 获取试卷题目数量
function getQuestionCount(exam: Exam) {
  return exam.questions?.length || 0
}

// 获取考试历史记录
async function fetchExamHistory() {
  if (!userStore.currentUser) return

  historyLoading.value = true
  try {
    const result = await examTakingApi.getUserExamHistory(userStore.currentUser.id)

    // 为每个历史记录添加试卷名称和计算数据
    examHistory.value = await Promise.all(result.items.map(async (item) => {
      // 获取试卷详情
      await examStore.fetchExam(item.examId)
      const exam = examStore.currentExam

      return {
        ...item,
        examTitle: exam?.title || '未知试卷',
        correctRate: (item.correctCount / item.totalCount) * 100
      }
    }))
  } catch (error) {
    console.error('获取考试历史失败', error)
  } finally {
    historyLoading.value = false
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
</script>

<style scoped>
.exam-list-container {
  width: 100%;
  padding: 16px;
}

.full-width {
  width: 100%;
}

/* 确保数据表格占满容器宽度 */
:deep(.v-data-table) {
  width: 100%;
}

/* 调整卡片网格布局 */
:deep(.v-row) {
  margin: 0;
  width: 100%;
}

.text-decoration-none {
  text-decoration: none;
}
</style>
