<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>{{ isEditMode ? '编辑试卷' : '创建试卷' }}</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-arrow-left"
          :to="{ name: 'exams' }"
        >
          返回列表
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text v-if="isEditMode && examStore.isLoading">
        <div class="d-flex justify-center py-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>

      <template v-else>
        <v-card-text>
          <v-row>
            <!-- 左侧题库面板 -->
            <v-col cols="12" md="3">
              <div class="text-subtitle-1 mb-2">题库</div>
              <v-card variant="outlined" class="mb-4">
                <v-card-text class="pa-2">
                  <v-text-field
                    v-model="questionSearchKeyword"
                    label="搜索题目"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:model-value="searchQuestions"
                    class="mb-2"
                  ></v-text-field>

                  <v-row class="ma-0 pa-0">
                    <v-col cols="6" class="pa-1">
                      <v-select
                        v-model="questionFilterSubject"
                        :items="questionStore.subjects"
                        label="学科"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="filterQuestions"
                      ></v-select>
                    </v-col>

                    <v-col cols="6" class="pa-1">
                      <v-select
                        v-model="questionFilterType"
                        :items="questionTypes"
                        label="题型"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="filterQuestions"
                      ></v-select>
                    </v-col>
                  </v-row>

                  <v-slider
                    v-model="questionFilterDifficulty"
                    label="难度"
                    min="0"
                    max="5"
                    step="1"
                    thumb-label
                    hide-details
                    class="mt-4"
                    @update:model-value="filterQuestions"
                  >
                    <template v-slot:thumb-label="{ modelValue }">
                      {{ modelValue === 0 ? '全部' : `${modelValue}星` }}
                    </template>
                  </v-slider>
                </v-card-text>
              </v-card>

              <div class="mb-2 d-flex align-center">
                <div class="text-subtitle-1">题目列表</div>
                <v-spacer></v-spacer>
                <v-chip size="small" color="primary">{{ filteredQuestions.length }}题</v-chip>
              </div>

              <div
                v-if="questionStore.isLoading"
                class="d-flex justify-center py-4"
              >
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>

              <div
                v-else-if="filteredQuestions.length === 0"
                class="text-center pa-4 grey--text"
              >
                <v-icon
                  icon="mdi-help-circle-outline"
                  size="large"
                  color="grey"
                  class="mb-2"
                ></v-icon>
                <div>暂无符合条件的题目</div>
              </div>

              <div v-else class="question-list">
                <draggable
                  :list="filteredQuestions"
                  :group="{ name: 'questions', pull: 'clone', put: false }"
                  item-key="id"
                  :clone="cloneQuestion"
                  :sort="false"
                  v-bind="{ animation: 200 }"
                >
<!--                  <pre>{{ filteredQuestions }}</pre>-->
                  <template #item="{ element: question }">
                    <v-card
                      class="mb-2 question-card"
                      variant="outlined"
                      :class="[
                        `border-${getTypeColor(question.type)}`,
                        { 'selected-question': isQuestionSelected(question.id) }
                      ]"
                      @click="toggleQuestionSelection(question)"
                    >
                      <v-card-text class="pa-2">
                        <div class="d-flex align-center mb-1">
                          <v-chip
                            size="x-small"
                            :color="getTypeColor(question.type)"
                            variant="outlined"
                            class="mr-1"
                          >
                            {{ question.type }}
                          </v-chip>
                          <v-rating
                            :model-value="question.difficulty"
                            color="amber"
                            density="compact"
                            size="x-small"
                            readonly
                          ></v-rating>
                          <v-spacer></v-spacer>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="text"
                            color="primary"
                            @click.stop="addQuestionToExam(question)"
                          ></v-btn>
                        </div>

                        <div class="text-body-2 text-truncate-2">
                          {{ question.content }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </template>
                </draggable>
              </div>

              <div class="d-flex justify-center mt-4">
                <v-pagination
                  v-if="filteredQuestions.length > 0"
                  v-model="questionPage"
                  :length="Math.ceil(filteredQuestions.length / questionPageSize)"
                  :total-visible="5"
                  density="compact"
                ></v-pagination>
              </div>
            </v-col>

            <!-- 中央试卷预览区 -->
            <v-col cols="12" md="6">
              <div class="d-flex align-center mb-2">
                <div class="text-subtitle-1">试卷内容</div>
                <v-spacer></v-spacer>
                <v-chip size="small" color="primary">{{ getSelectedQuestionCount() }}题</v-chip>
                <v-chip size="small" color="success" class="ml-2">{{ examStore.workbenchExam.totalScore }}分</v-chip>
              </div>

              <v-card variant="outlined">
                <v-card-title>
                  <v-text-field
                    v-model="examStore.workbenchExam.title"
                    label="试卷标题"
                    variant="underlined"
                    hide-details
                    class="text-h6"
                  ></v-text-field>
                </v-card-title>

                <v-divider></v-divider>

                <v-card-text class="pa-0">
                  <draggable
                    v-model="selectedQuestions"
                    group="questions"
                    item-key="id"
                    v-bind="{ animation: 200 }"
                    class="min-height-300 pa-2"
                    @change="onDragChange"
                  >
                    <template #item="{ element: question, index }">
                      <v-card
                        class="mb-2 selected-question-card"
                        :class="`border-l-${getTypeColor(question.type)}`"
                      >
                        <v-card-text class="pa-2">
                          <div class="d-flex align-center">
                            <div class="text-body-2 mr-2">{{ index + 1 }}.</div>
                            <v-chip
                              size="x-small"
                              :color="getTypeColor(question.type)"
                              variant="outlined"
                              class="mr-1"
                            >
                              {{ question.type }}
                            </v-chip>
                            <div class="text-truncate flex-grow-1">{{ question.content }}</div>
                            <v-text-field
                              v-model="question.score"
                              type="number"
                              label="分值"
                              variant="outlined"
                              density="compact"
                              hide-details
                              class="score-input ml-2"
                              min="1"
                              max="100"
                              @update:model-value="updateTotalScore"
                            ></v-text-field>
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              class="ml-1"
                              @click="removeQuestionFromExam(question.id)"
                            ></v-btn>
                          </div>
                        </v-card-text>
                      </v-card>
                    </template>

                    <template #header v-if="selectedQuestions.length === 0">
                      <div class="text-center pa-4 grey--text">
                        <v-icon
                          icon="mdi-arrow-left-right"
                          size="large"
                          color="grey"
                          class="mb-2"
                        ></v-icon>
                        <div>将左侧题目拖拽到此处或点击添加</div>
                      </div>
                    </template>
                  </draggable>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- 右侧属性面板 -->
            <v-col cols="12" md="3">
              <div class="text-subtitle-1 mb-2">试卷属性</div>

              <v-card variant="outlined" class="mb-4">
                <v-card-text>
                  <v-text-field
                    v-model="examStore.workbenchExam.duration"
                    type="number"
                    label="考试时长(分钟)"
                    variant="outlined"
                    density="compact"
                    min="1"
                    max="180"
                    class="mb-4"
                  ></v-text-field>

                  <div class="text-subtitle-2 mb-2">试卷总分: {{ examStore.workbenchExam.totalScore }} 分</div>

                  <v-divider class="my-3"></v-divider>

                  <div class="text-subtitle-2 mb-2">题型分布</div>
                  <v-sheet
                    v-if="selectedQuestions.length > 0"
                    class="mb-4"
                    height="180"
                  >
                    <!-- 这里用饼图显示题型分布 -->
                    <div class="d-flex flex-column h-100">
                      <div
                        v-for="(count, type) in getQuestionTypeDistribution()"
                        :key="type"
                        class="d-flex align-center mb-2"
                      >
                        <div class="text-body-2 mr-2" style="width: 80px;">{{ type }}</div>
                        <v-progress-linear
                          :model-value="(count / selectedQuestions.length) * 100"
                          :color="getTypeColor(type)"
                          height="20"
                          class="flex-grow-1"
                        >
                          <template v-slot:default>{{ count }}题</template>
                        </v-progress-linear>
                      </div>
                    </div>
                  </v-sheet>

                  <div v-else class="text-center pa-4 grey--text">
                    <v-icon
                      icon="mdi-chart-pie"
                      size="large"
                      color="grey"
                      class="mb-2"
                    ></v-icon>
                    <div>添加题目后查看分布</div>
                  </div>

                  <v-divider class="my-3"></v-divider>

                  <div class="text-subtitle-2 mb-2">难度分布</div>
                  <v-sheet
                    v-if="selectedQuestions.length > 0"
                    class="mb-4"
                    height="180"
                  >
                    <!-- 难度分布图 -->
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
                          :model-value="(getSelectedDifficultyCount(level) / selectedQuestions.length) * 100"
                          :color="getDifficultyColor(level)"
                          height="20"
                          class="flex-grow-1"
                        >
                          <template v-slot:default>{{ getSelectedDifficultyCount(level) }}题</template>
                        </v-progress-linear>
                      </div>
                    </div>
                  </v-sheet>

                  <div v-else class="text-center pa-4 grey--text">
                    <v-icon
                      icon="mdi-chart-bell-curve"
                      size="large"
                      color="grey"
                      class="mb-2"
                    ></v-icon>
                    <div>添加题目后查看分布</div>
                  </div>

                  <v-divider class="my-3"></v-divider>

                  <div class="d-flex align-center mb-2">
                    <div class="text-subtitle-2">AI 推荐</div>
                    <v-spacer></v-spacer>
                    <v-switch
                      v-model="aiRecommendEnabled"
                      color="primary"
                      hide-details
                      density="compact"
                    ></v-switch>
                  </div>

                  <div v-if="aiRecommendEnabled">
                    <v-btn
                      block
                      color="primary"
                      variant="text"
                      prepend-icon="mdi-lightbulb-on"
                      @click="generateAiRecommendations"
                      :loading="isAiLoading"
                      class="mb-2"
                    >
                      智能推荐题目
                    </v-btn>

                    <div v-if="aiRecommendations.length > 0" class="mt-2">
                      <div class="text-caption">AI 推荐题目:</div>
                      <v-card
                        v-for="(question, index) in aiRecommendations"
                        :key="index"
                        variant="outlined"
                        class="mt-2 pa-1"
                        density="compact"
                      >
                        <div class="d-flex align-center">
                          <v-chip
                            size="x-small"
                            :color="getTypeColor(question.type)"
                            variant="outlined"
                            class="mr-1"
                          >
                            {{ question.type }}
                          </v-chip>
                          <div class="text-caption text-truncate">{{ question.content }}</div>
                          <v-btn
                            icon="mdi-plus"
                            size="x-small"
                            variant="text"
                            color="primary"
                            class="ml-auto"
                            @click="addQuestionToExam(question)"
                          ></v-btn>
                        </div>
                      </v-card>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <v-card variant="outlined">
                <v-card-text>
                  <v-btn
                    block
                    color="primary"
                    size="large"
                    prepend-icon="mdi-content-save"
                    @click="saveExam"
                    :loading="examStore.isLoading"
                    :disabled="!canSaveExam"
                  >
                    {{ isEditMode ? '保存修改' : '创建试卷' }}
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </template>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '../../stores/exam'
import { useQuestionStore } from '../../stores/question'
import { QuestionType } from '../../mock'
import draggable from 'vuedraggable'

// 获取路由参数
const route = useRoute()
const router = useRouter()
const examId = route.params.id as string

// 获取store
const examStore = useExamStore()
const questionStore = useQuestionStore()

// 判断是否是编辑模式
const isEditMode = computed(() => !!examId)

// 题型列表
const questionTypes = Object.values(QuestionType)

// 题库筛选相关
const questionSearchKeyword = ref('')
const questionFilterSubject = ref<string | null>(null)
const questionFilterType = ref<QuestionType | null>(null)
const questionFilterDifficulty = ref(0)
const questionPage = ref(1)
const questionPageSize = ref(10)

// 已选中的题目
const selectedQuestions = ref<any[]>([])

// AI推荐相关
const aiRecommendEnabled = ref(false)
const aiRecommendations = ref<any[]>([])
const isAiLoading = ref(false)

// 计算属性：筛选后的题目
const filteredQuestions = computed(() => {
  let filtered = [...questionStore.questions]

  // 按关键词筛选
  if (questionSearchKeyword.value) {
    const keyword = questionSearchKeyword.value.toLowerCase()
    filtered = filtered.filter(q =>
      q.content.toLowerCase().includes(keyword) ||
      q.tags.some((tag: string) => tag.toLowerCase().includes(keyword))
    )
  }

  // 按学科筛选
  if (questionFilterSubject.value) {
    filtered = filtered.filter(q => q.subject === questionFilterSubject.value)
  }

  // 按题型筛选
  if (questionFilterType.value) {
    filtered = filtered.filter(q => q.type === questionFilterType.value)
  }

  // 按难度筛选
  if (questionFilterDifficulty.value > 0) {
    filtered = filtered.filter(q => q.difficulty === questionFilterDifficulty.value)
  }

  return filtered
})

// 计算属性：分页后的题目
const paginatedQuestions = computed(() => {
  const start = (questionPage.value - 1) * questionPageSize.value
  const end = start + questionPageSize.value
  return filteredQuestions.value.slice(start, end)
})

// 计算属性：是否可以保存试卷
const canSaveExam = computed(() => {
  return (
    examStore.workbenchExam.title &&
    examStore.workbenchExam.duration > 0 &&
    examStore.workbenchExam.questions &&
    examStore.workbenchExam.questions.length > 0
  )
})

// 监听所选题目的变化，更新工作台试卷的题目列表
watch(selectedQuestions, (newVal) => {
  // 更新工作台试卷的题目列表
  if (!examStore.workbenchExam.questions) {
    examStore.workbenchExam.questions = []
  }

  // 重新计算分值
  examStore.workbenchExam.questions = newVal.map(q => ({
    id: q.id,
    score: q.score || 5
  }))

  // 更新总分
  updateTotalScore()
}, { deep: true })

// 页面加载时获取数据
onMounted(async () => {
  // 获取题目列表
  await questionStore.fetchQuestions()

  // 获取元数据（科目、标签等）
  await questionStore.fetchMetadata()

  // 如果是编辑模式，获取试卷详情
  if (isEditMode.value) {
    await examStore.fetchExam(examId)

    // 将试卷数据加载到工作台
    if (examStore.currentExam) {
      // 克隆一份数据，避免直接修改store中的数据
      examStore.workbenchExam = {
        id: examStore.currentExam.id,
        title: examStore.currentExam.title,
        duration: examStore.currentExam.duration,
        totalScore: examStore.currentExam.totalScore,
        questions: []
      }

      // 加载题目详情
      if (examStore.currentExam.questions) {
        for (const item of examStore.currentExam.questions) {
          // 查找题目详情
          const question = questionStore.questions.find(q => q.id === item.id)

          if (question) {
            // 添加到已选题目
            selectedQuestions.value.push({
              ...question,
              score: item.score
            })

            // 添加到工作台试卷
            examStore.workbenchExam.questions.push({
              id: item.id,
              score: item.score
            })
          }
        }
      }
    }
  } else {
    // 新建模式，重置工作台
    examStore.resetWorkbench()
  }
})

// 搜索题目
function searchQuestions() {
  questionPage.value = 1
}

// 筛选题目
function filterQuestions() {
  questionPage.value = 1
}

// 克隆题目（用于拖拽）
function cloneQuestion(question: any) {
  return {
    ...question,
    score: 5
  }
}

// 拖拽变化事件处理
function onDragChange(event: any) {
  // 拖拽添加
  if (event.added) {
    const question = event.added.element

    // 确保题目分值
    if (!question.score) {
      question.score = 5
    }
  }
}

// 判断题目是否已选中
function isQuestionSelected(questionId: string) {
  return selectedQuestions.value.some(q => q.id === questionId)
}

// 切换题目选择状态
function toggleQuestionSelection(question: any) {
  if (isQuestionSelected(question.id)) {
    removeQuestionFromExam(question.id)
  } else {
    addQuestionToExam(question)
  }
}

// 添加题目到试卷
function addQuestionToExam(question: any) {
  // 避免重复添加
  if (isQuestionSelected(question.id)) {
    return
  }

  // 添加题目到已选列表
  selectedQuestions.value.push({
    ...question,
    score: 5
  })
}

// 从试卷中移除题目
function removeQuestionFromExam(questionId: string) {
  // 从已选列表中移除
  const index = selectedQuestions.value.findIndex(q => q.id === questionId)

  if (index !== -1) {
    selectedQuestions.value.splice(index, 1)
  }
}

// 更新总分
function updateTotalScore() {
  // 计算总分
  let totalScore = 0

  for (const question of selectedQuestions.value) {
    totalScore += Number(question.score) || 0
  }

  // 更新工作台试卷总分
  examStore.workbenchExam.totalScore = totalScore
}

// 获取已选题目数量
function getSelectedQuestionCount() {
  return selectedQuestions.value.length
}

// 获取已选题目中题型分布
function getQuestionTypeDistribution() {
  const distribution: Record<string, number> = {}

  for (const question of selectedQuestions.value) {
    if (distribution[question.type]) {
      distribution[question.type]++
    } else {
      distribution[question.type] = 1
    }
  }

  return distribution
}

// 获取已选题目中难度为level的题目数量
function getSelectedDifficultyCount(level: number) {
  return selectedQuestions.value.filter(q => q.difficulty === level).length
}

// 生成AI推荐题目
async function generateAiRecommendations() {
  isAiLoading.value = true

  try {
    // 这里模拟AI推荐题目的过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 简单的推荐逻辑：随机选择一些题目
    const recommended = questionStore.questions
      .filter(q => !isQuestionSelected(q.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)

    aiRecommendations.value = recommended
  } finally {
    isAiLoading.value = false
  }
}

// 保存试卷
async function saveExam() {
  try {
    if (1==1) {
      alert("创建成功")
    }
    if (isEditMode.value) {
      await examStore.updateExam(examId, examStore.workbenchExam)
      alert("更新成功")
    } else {
      await examStore.createExam(examStore.workbenchExam)
      alert("创建成功")
    }
  } catch (error) {
    console.error('保存试卷失败', error)
  } finally {
    // 无论成功或失败都跳转
    await router.push({ name: 'exams' })
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
</script>

<style scoped>
.min-height-300 {
  min-height: 300px;
}

.question-list {
  max-height: 500px;
  overflow-y: auto;
}

.question-card {
  cursor: pointer;
  transition: all 0.2s;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.selected-question {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.border-primary {
  border-left: 3px solid rgb(var(--v-theme-primary)) !important;
}

.border-secondary {
  border-left: 3px solid rgb(var(--v-theme-secondary)) !important;
}

.border-success {
  border-left: 3px solid rgb(var(--v-theme-success)) !important;
}

.border-warning {
  border-left: 3px solid rgb(var(--v-theme-warning)) !important;
}

.border-error {
  border-left: 3px solid rgb(var(--v-theme-error)) !important;
}

.border-grey {
  border-left: 3px solid rgb(var(--v-theme-grey)) !important;
}

.border-l-primary {
  border-left: 3px solid rgb(var(--v-theme-primary)) !important;
}

.border-l-secondary {
  border-left: 3px solid rgb(var(--v-theme-secondary)) !important;
}

.border-l-success {
  border-left: 3px solid rgb(var(--v-theme-success)) !important;
}

.border-l-warning {
  border-left: 3px solid rgb(var(--v-theme-warning)) !important;
}

.border-l-error {
  border-left: 3px solid rgb(var(--v-theme-error)) !important;
}

.border-l-grey {
  border-left: 3px solid rgb(var(--v-theme-grey)) !important;
}

.score-input {
  width: 80px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
