<template>
  <div class="question-bank-container">
    <v-row class="ma-0">
      <v-col cols="3" class="pa-2">
        <!-- 左侧树形分类导航 -->
        <v-card>
          <v-card-title class="text-subtitle-1 d-flex align-center">
            <v-icon class="mr-2">mdi-folder-outline</v-icon>
            分类导航
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list density="compact">
              <v-list-subheader>按科目</v-list-subheader>
              <v-list-item
                v-for="subject in questionStore.subjects"
                :key="subject"
                :title="subject"
                @click="filterBySubject(subject)"
                :active="questionStore.filterSubject === subject"
                active-color="primary"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-book</v-icon>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-subheader>按题型</v-list-subheader>
              <v-list-item
                v-for="type in questionTypes"
                :key="type"
                :title="type"
                @click="filterByType(type)"
                :active="questionStore.filterType === type"
                active-color="primary"
              >
                <template v-slot:prepend>
                  <v-icon>{{ getQuestionTypeIcon(type) }}</v-icon>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-subheader>按难度</v-list-subheader>
              <v-list-item
                v-for="level in 5"
                :key="`difficulty-${level}`"
                @click="filterByDifficulty(level)"
                :active="questionStore.filterDifficulty === level"
                active-color="primary"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-star</v-icon>
                </template>
                <template v-slot:title>
                  <v-rating
                    :model-value="level"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-subheader>按标签</v-list-subheader>
              <v-list-item
                v-for="tag in questionStore.tags"
                :key="tag"
                :title="tag"
                @click="filterByTag(tag)"
                :active="questionStore.filterTag === tag"
                active-color="primary"
              >
                <template v-slot:prepend>
                  <v-icon>mdi-tag</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions>
            <v-btn block color="error" variant="text" @click="resetFilters"> 重置筛选 </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="9" class="pa-2">
        <!-- 顶部操作栏 -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="questionStore.searchKeyword"
                  label="搜索题目"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @update:model-value="onSearch"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" class="d-flex justify-end">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="openQuestionDialog(null, true)"
                >
                  新建题目
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- 题目列表 -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="questionStore.questions"
            :loading="questionStore.isLoading"
            :items-per-page="questionStore.pageSize"
            :server-items-length="questionStore.total"
            density="compact"
            hover
          >
            <!-- 题型列 -->
            <template v-slot:item.type="{ item }">
              <v-chip :color="getTypeColor(item.type)" variant="outlined" size="small">
                {{ item.type }}
              </v-chip>
            </template>

            <!-- 内容列 -->
            <template v-slot:item.content="{ item }">
              <div class="text-truncate" style="max-width: 300px">
                {{ item.content }}
              </div>
            </template>

            <!-- 难度列 -->
            <template v-slot:item.difficulty="{ item }">
              <v-rating
                :model-value="item.difficulty"
                color="amber"
                density="compact"
                size="small"
                readonly
              ></v-rating>
            </template>

            <!-- 操作列 -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                size="small"
                variant="text"
                color="primary"
                @click="openQuestionDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="warning"
                @click="openQuestionDialog(item, true)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              ></v-btn>
            </template>

            <!-- 空数据提示 -->
            <template v-slot:no-data>
              <div class="text-center pa-5">
                <v-icon
                  icon="mdi-alert-circle-outline"
                  size="large"
                  color="grey"
                  class="mb-2"
                ></v-icon>
                <div class="text-subtitle-1 text-grey">暂无题目数据</div>
                <v-btn class="mt-3" color="primary" variant="text" @click="fetchQuestions">
                  刷新
                </v-btn>
              </div>
            </template>
          </v-data-table>

          <!-- 分页 -->
          <div class="d-flex justify-center pa-2">
            <v-pagination
              v-model="questionStore.currentPage"
              :length="Math.ceil(questionStore.total / questionStore.pageSize)"
              @update:model-value="onPageChange"
              :disabled="questionStore.isLoading"
            ></v-pagination>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 题目编辑/查看对话框 -->
    <v-dialog v-model="questionDialog" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ editMode ? (editQuestion.id ? '编辑题目' : '新建题目') : '查看题目' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="questionForm">
            <!-- 题型选择 -->
            <v-select
              v-model="editQuestion.type"
              :items="questionTypes"
              label="题目类型"
              variant="outlined"
              :readonly="!editMode"
              :rules="[(v) => !!v || '请选择题型']"
            ></v-select>

            <!-- 科目选择 -->
            <v-select
              v-model="editQuestion.subject"
              :items="questionStore.subjects"
              label="所属科目"
              variant="outlined"
              :readonly="!editMode"
              :rules="[(v) => !!v || '请选择科目']"
            ></v-select>

            <!-- 题目内容 -->
            <v-textarea
              v-model="editQuestion.content"
              label="题目内容"
              variant="outlined"
              :readonly="!editMode"
              :rules="[(v) => !!v || '请输入题目内容']"
            ></v-textarea>

            <!-- 选择题选项 -->
            <div v-if="editQuestion.type !== QuestionType.SHORT_ANSWER">
              <div class="d-flex align-center mb-2">
                <div class="text-subtitle-1">选项</div>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="editMode"
                  icon="mdi-plus"
                  size="small"
                  variant="text"
                  color="primary"
                  @click="addOption"
                ></v-btn>
              </div>

              <div
                v-for="(option, index) in editQuestion.options"
                :key="index"
                class="d-flex align-center mb-2"
              >
                <v-text-field
                  v-model="option.key"
                  label="选项编号"
                  variant="outlined"
                  density="compact"
                  class="mr-2"
                  style="width: 80px"
                  :readonly="!editMode"
                ></v-text-field>

                <v-text-field
                  v-model="option.value"
                  label="选项内容"
                  variant="outlined"
                  density="compact"
                  :readonly="!editMode"
                  :rules="[(v) => !!v || '请输入选项内容']"
                ></v-text-field>

                <v-btn
                  v-if="editMode"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeOption(index)"
                ></v-btn>
              </div>

              <!-- 答案选择 -->
              <div
                v-if="
                  editQuestion.type === QuestionType.SINGLE_CHOICE ||
                  editQuestion.type === QuestionType.TRUE_FALSE
                "
              >
                <div class="text-subtitle-1 mb-2">正确答案</div>
                <v-radio-group v-model="editQuestion.answer" :readonly="!editMode">
                  <v-radio
                    v-for="option in editQuestion.options"
                    :key="option.key"
                    :label="option.key + ': ' + option.value"
                    :value="option.key"
                  ></v-radio>
                </v-radio-group>
              </div>

              <div v-else-if="editQuestion.type === QuestionType.MULTIPLE_CHOICE">
                <div class="text-subtitle-1 mb-2">正确答案 (多选)</div>
                <v-checkbox
                  v-for="option in editQuestion.options"
                  :key="option.key"
                  v-model="multipleAnswers"
                  :label="option.key + ': ' + option.value"
                  :value="option.key"
                  :readonly="!editMode"
                ></v-checkbox>
              </div>
            </div>

            <!-- 问答题答案 -->
            <div v-else>
              <div class="text-subtitle-1 mb-2">参考答案</div>
              <v-textarea
                v-model="editQuestion.answer"
                variant="outlined"
                :readonly="!editMode"
              ></v-textarea>
            </div>

            <!-- 难度设置 -->
            <div class="text-subtitle-1 mb-2">难度等级</div>
            <v-slider
              v-model="editQuestion.difficulty"
              min="1"
              max="5"
              step="1"
              :readonly="!editMode"
              thumb-label
              :track-color="getDifficultyColor(editQuestion.difficulty)"
              :color="getDifficultyColor(editQuestion.difficulty)"
            >
              <template v-slot:thumb-label="{ modelValue }"> {{ modelValue }}星 </template>
            </v-slider>

            <!-- 标签 -->
            <div class="text-subtitle-1 mb-2">标签</div>
            <v-combobox
              v-model="editQuestion.tags"
              :items="questionStore.tags"
              label="输入标签，回车添加"
              multiple
              chips
              variant="outlined"
              :readonly="!editMode"
            ></v-combobox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="questionDialog = false">
            {{ editMode ? '取消' : '关闭' }}
          </v-btn>
          <v-btn
            v-if="editMode"
            color="primary"
            @click="saveQuestion"
            :loading="questionStore.isLoading"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text> 确定要删除这道题目吗？此操作不可恢复。 </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false"> 取消 </v-btn>
          <v-btn color="error" @click="deleteQuestion" :loading="questionStore.isLoading">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useQuestionStore } from '../../stores/question'
import { QuestionType } from '../../mock'

// 获取store
const questionStore = useQuestionStore()

// 表格配置
const headers = [
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: '题型', key: 'type', sortable: false, width: '100px' },
  { title: '内容', key: 'content', sortable: false },
  { title: '难度', key: 'difficulty', sortable: false, width: '120px' },
  { title: '操作', key: 'actions', sortable: false, width: '120px', align: 'center' },
]

// 题型列表
const questionTypes = Object.values(QuestionType)

// 对话框控制
const questionDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const questionToDelete = ref<string | null>(null)

// 编辑题目的表单数据
const editQuestion = reactive({
  id: '',
  type: QuestionType.SINGLE_CHOICE,
  content: '',
  options: [
    { key: 'A', value: '' },
    { key: 'B', value: '' },
    { key: 'C', value: '' },
    { key: 'D', value: '' },
  ],
  answer: '',
  difficulty: 3,
  tags: [] as string[],
  subject: '',
})

// 用于多选题的答案处理
const multipleAnswers = ref<string[]>([])

// 监听多选答案变化
watch(
  multipleAnswers,
  (newVal) => {
    if (editQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      editQuestion.answer = newVal
    }
  },
  { deep: true },
)

// 监听题型变化
watch(
  () => editQuestion.type,
  (newType) => {
    // 如果切换到判断题，更新选项
    if (newType === QuestionType.TRUE_FALSE) {
      editQuestion.options = [
        { key: 'A', value: '正确' },
        { key: 'B', value: '错误' },
      ]
      editQuestion.answer = 'A'
    }
    // 如果切换到选择题，初始化选项
    else if (newType === QuestionType.SINGLE_CHOICE || newType === QuestionType.MULTIPLE_CHOICE) {
      if (!editQuestion.options || editQuestion.options.length === 0) {
        editQuestion.options = [
          { key: 'A', value: '' },
          { key: 'B', value: '' },
          { key: 'C', value: '' },
          { key: 'D', value: '' },
        ]
      }

      if (newType === QuestionType.SINGLE_CHOICE) {
        editQuestion.answer = ''
      } else {
        editQuestion.answer = []
        multipleAnswers.value = []
      }
    }
    // 如果切换到问答题，清空选项
    else if (newType === QuestionType.SHORT_ANSWER) {
      editQuestion.options = []
      editQuestion.answer = ''
    }
  },
)

// 页面加载时获取数据
onMounted(async () => {
  // 获取元数据（科目、标签等）
  await questionStore.fetchMetadata()

  // 如果科目为空，赋默认值
  if (!questionStore.subjects || questionStore.subjects.length === 0) {
    questionStore.subjects = [
      '语文',
      '数学',
      '英语',
      '物理',
      '化学',
      '生物',
      '历史',
      '地理',
      '政治',
    ]
  }

  // 获取题目列表
  await fetchQuestions()
})

// 获取题目列表
async function fetchQuestions() {
  await questionStore.fetchQuestions()
}

// 分页改变
async function onPageChange() {
  await fetchQuestions()
}

// 搜索
async function onSearch() {
  questionStore.currentPage = 1
  await fetchQuestions()
}

// 按科目筛选
async function filterBySubject(subject: string) {
  if (questionStore.filterSubject === subject) {
    questionStore.filterSubject = null
  } else {
    questionStore.filterSubject = subject
  }
  questionStore.currentPage = 1
  await fetchQuestions()
}

// 按题型筛选
async function filterByType(type: QuestionType) {
  if (questionStore.filterType === type) {
    questionStore.filterType = null
  } else {
    questionStore.filterType = type
  }
  questionStore.currentPage = 1
  await fetchQuestions()
}

// 按难度筛选
async function filterByDifficulty(difficulty: number) {
  if (questionStore.filterDifficulty === difficulty) {
    questionStore.filterDifficulty = null
  } else {
    questionStore.filterDifficulty = difficulty
  }
  questionStore.currentPage = 1
  await fetchQuestions()
}

// 按标签筛选
async function filterByTag(tag: string) {
  if (questionStore.filterTag === tag) {
    questionStore.filterTag = null
  } else {
    questionStore.filterTag = tag
  }
  questionStore.currentPage = 1
  await fetchQuestions()
}

// 重置筛选条件
async function resetFilters() {
  questionStore.resetFilters()
  await fetchQuestions()
}

// 打开题目对话框（查看/编辑/新建）
function openQuestionDialog(question: any = null, isEdit = false) {
  // 设置编辑模式
  editMode.value = isEdit

  // 重置表单数据
  resetEditQuestion()

  if (question) {
    // 填充表单数据
    Object.assign(editQuestion, {
      id: question.id,
      type: question.type,
      content: question.content,
      options: question.options ? [...question.options] : [],
      difficulty: question.difficulty,
      tags: question.tags ? [...question.tags] : [],
      subject: question.subject,
    })

    // 处理不同类型题目的答案
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      multipleAnswers.value = Array.isArray(question.answer) ? [...question.answer] : []
      editQuestion.answer = multipleAnswers.value
    } else {
      editQuestion.answer = question.answer
    }
  }

  // 打开对话框
  questionDialog.value = true
}

// 重置编辑表单
function resetEditQuestion() {
  Object.assign(editQuestion, {
    id: '',
    type: QuestionType.SINGLE_CHOICE,
    content: '',
    options: [
      { key: 'A', value: '' },
      { key: 'B', value: '' },
      { key: 'C', value: '' },
      { key: 'D', value: '' },
    ],
    answer: '',
    difficulty: 3,
    tags: [],
    subject: questionStore.subjects.length > 0 ? questionStore.subjects[0] : '',
  })

  multipleAnswers.value = []
}

// 添加选项
function addOption() {
  if (!editQuestion.options) {
    editQuestion.options = []
  }

  const newKey = String.fromCharCode(65 + editQuestion.options.length)
  editQuestion.options.push({ key: newKey, value: '' })
}

// 删除选项
function removeOption(index: number) {
  if (editQuestion.options && editQuestion.options.length > 2) {
    editQuestion.options.splice(index, 1)

    // 更新选项的key
    editQuestion.options.forEach((option, i) => {
      option.key = String.fromCharCode(65 + i)
    })

    // 如果删除的选项是答案，清空答案
    if (
      editQuestion.type === QuestionType.SINGLE_CHOICE ||
      editQuestion.type === QuestionType.TRUE_FALSE
    ) {
      if (editQuestion.answer === editQuestion.options[index]?.key) {
        editQuestion.answer = ''
      }
    } else if (editQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      const removedKey = String.fromCharCode(65 + index)
      multipleAnswers.value = multipleAnswers.value.filter((key) => key !== removedKey)
      editQuestion.answer = multipleAnswers.value
    }
  }
}

// 保存题目
async function saveQuestion() {
  try {
    // 处理多选题答案
    if (editQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      editQuestion.answer = multipleAnswers.value
    }

    if (editQuestion.id) {
      // 更新题目
      await questionStore.updateQuestion(editQuestion.id, editQuestion)
    } else {
      // 创建题目
      await questionStore.createQuestion(editQuestion)
    }

    // 关闭对话框
    questionDialog.value = false

    // 刷新题目列表
    await fetchQuestions()
  } catch (error) {
    console.error('保存题目失败', error)
  }
}

// 确认删除题目
function confirmDelete(question: any) {
  questionToDelete.value = question.id
  deleteDialog.value = true
}

// 删除题目
async function deleteQuestion() {
  if (questionToDelete.value) {
    try {
      await questionStore.deleteQuestion(questionToDelete.value)
      deleteDialog.value = false
      questionToDelete.value = null

      // 刷新题目列表
      await fetchQuestions()
    } catch (error) {
      console.error('删除题目失败', error)
    }
  }
}

// 获取题型图标
function getQuestionTypeIcon(type: QuestionType) {
  switch (type) {
    case QuestionType.SINGLE_CHOICE:
      return 'mdi-checkbox-marked-circle-outline'
    case QuestionType.MULTIPLE_CHOICE:
      return 'mdi-checkbox-multiple-marked-outline'
    case QuestionType.TRUE_FALSE:
      return 'mdi-check-circle-outline'
    case QuestionType.SHORT_ANSWER:
      return 'mdi-text-box-outline'
    default:
      return 'mdi-help-circle-outline'
  }
}

// 获取题型颜色
function getTypeColor(type: QuestionType) {
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
    case 1:
      return 'success'
    case 2:
      return 'light-green'
    case 3:
      return 'warning'
    case 4:
      return 'orange'
    case 5:
      return 'error'
    default:
      return 'grey'
  }
}
</script>

<style scoped>
.question-bank-container {
  width: 100%;
  padding: 16px;
}

/* 调整表格内容列的最大宽度 */
:deep(.text-truncate) {
  max-width: 100%;
  width: 100%;
}

/* 确保v-data-table占满整个列宽 */
:deep(.v-data-table) {
  width: 100%;
}
</style>
