<template>
  <div>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>题目详情</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-arrow-left"
          :to="{ name: 'questions' }"
        >
          返回题库
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text v-if="questionStore.isLoading">
        <div class="d-flex justify-center py-5">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>
      
      <template v-else-if="questionStore.currentQuestion">
        <v-card-text>
          <v-chip
            :color="getTypeColor(questionStore.currentQuestion.type)"
            variant="outlined"
            class="mb-3"
          >
            {{ questionStore.currentQuestion.type }}
          </v-chip>
          
          <v-chip
            color="grey"
            variant="outlined"
            class="mb-3 ml-2"
          >
            {{ questionStore.currentQuestion.subject }}
          </v-chip>
          
          <v-rating
            :model-value="questionStore.currentQuestion.difficulty"
            color="amber"
            density="compact"
            readonly
            class="mb-3 ml-2"
          ></v-rating>
          
          <div class="text-h6 mb-3 text-pre-wrap">{{ questionStore.currentQuestion.content }}</div>
          
          <!-- 选择题选项 -->
          <div v-if="questionStore.currentQuestion.options && questionStore.currentQuestion.options.length > 0">
            <v-list>
              <v-list-item
                v-for="option in questionStore.currentQuestion.options"
                :key="option.key"
                :class="isCorrectAnswer(option.key) ? 'bg-light-green-lighten-5' : ''"
              >
                <template v-slot:prepend>
                  <div class="font-weight-bold mr-2">{{ option.key }}.</div>
                </template>
                
                <v-list-item-title>{{ option.value }}</v-list-item-title>
                
                <template v-slot:append v-if="isCorrectAnswer(option.key)">
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>
          
          <!-- 问答题答案 -->
          <div v-else>
            <div class="text-subtitle-1 mt-4 mb-2">参考答案:</div>
            <div class="text-body-1 text-pre-wrap pa-3 bg-grey-lighten-4 rounded">
              {{ questionStore.currentQuestion.answer }}
            </div>
          </div>
          
          <!-- 标签 -->
          <div class="mt-4">
            <div class="text-subtitle-1 mb-2">标签:</div>
            <div>
              <v-chip
                v-for="tag in questionStore.currentQuestion.tags"
                :key="tag"
                color="primary"
                variant="outlined"
                size="small"
                class="mr-2 mb-2"
              >
                {{ tag }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            color="warning"
            prepend-icon="mdi-pencil"
            @click="openEditDialog"
          >
            编辑题目
          </v-btn>
          <v-btn
            color="error"
            prepend-icon="mdi-delete"
            @click="confirmDelete"
          >
            删除题目
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            prepend-icon="mdi-file-plus"
            @click="addToExam"
            v-if="userStore.isAdmin"
          >
            添加到试卷
          </v-btn>
        </v-card-actions>
      </template>
      
      <v-card-text v-else-if="questionStore.error">
        <v-alert type="error" variant="tonal">
          {{ questionStore.error }}
        </v-alert>
      </v-card-text>
    </v-card>
    
    <!-- 编辑对话框 -->
    <v-dialog
      v-model="editDialog"
      max-width="800"
      persistent
    >
      <v-card>
        <v-card-title>编辑题目</v-card-title>
        
        <v-card-text>
          <v-form ref="questionForm">
            <!-- 题型选择 -->
            <v-select
              v-model="editQuestion.type"
              :items="questionTypes"
              label="题目类型"
              variant="outlined"
              :rules="[v => !!v || '请选择题型']"
            ></v-select>
            
            <!-- 科目选择 -->
            <v-select
              v-model="editQuestion.subject"
              :items="questionStore.subjects"
              label="所属科目"
              variant="outlined"
              :rules="[v => !!v || '请选择科目']"
            ></v-select>
            
            <!-- 题目内容 -->
            <v-textarea
              v-model="editQuestion.content"
              label="题目内容"
              variant="outlined"
              :rules="[v => !!v || '请输入题目内容']"
            ></v-textarea>
            
            <!-- 选择题选项 -->
            <div v-if="editQuestion.type !== QuestionType.SHORT_ANSWER">
              <div class="d-flex align-center mb-2">
                <div class="text-subtitle-1">选项</div>
                <v-spacer></v-spacer>
                <v-btn
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
                  style="width: 80px;"
                ></v-text-field>
                
                <v-text-field
                  v-model="option.value"
                  label="选项内容"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '请输入选项内容']"
                ></v-text-field>
                
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeOption(index)"
                ></v-btn>
              </div>
              
              <!-- 答案选择 -->
              <div v-if="editQuestion.type === QuestionType.SINGLE_CHOICE || editQuestion.type === QuestionType.TRUE_FALSE">
                <div class="text-subtitle-1 mb-2">正确答案</div>
                <v-radio-group
                  v-model="editQuestion.answer"
                >
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
                ></v-checkbox>
              </div>
            </div>
            
            <!-- 问答题答案 -->
            <div v-else>
              <div class="text-subtitle-1 mb-2">参考答案</div>
              <v-textarea
                v-model="editQuestion.answer"
                variant="outlined"
              ></v-textarea>
            </div>
            
            <!-- 难度设置 -->
            <div class="text-subtitle-1 mb-2">难度等级</div>
            <v-slider
              v-model="editQuestion.difficulty"
              min="1"
              max="5"
              step="1"
              thumb-label
              :track-color="getDifficultyColor(editQuestion.difficulty)"
              :color="getDifficultyColor(editQuestion.difficulty)"
            >
              <template v-slot:thumb-label="{ modelValue }">
                {{ modelValue }}星
              </template>
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
            ></v-combobox>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="editDialog = false"
          >
            取消
          </v-btn>
          <v-btn
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
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除这道题目吗？此操作不可恢复。
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
            @click="deleteQuestion"
            :loading="questionStore.isLoading"
          >
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 添加到试卷对话框 -->
    <v-dialog
      v-model="addToExamDialog"
      max-width="600"
    >
      <v-card>
        <v-card-title>添加到试卷</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedExam"
            :items="exams"
            item-title="title"
            item-value="id"
            label="选择试卷"
            variant="outlined"
            :loading="examStore.isLoading"
            :disabled="examStore.isLoading"
          ></v-select>
          
          <v-text-field
            v-model="questionScore"
            label="分值"
            type="number"
            variant="outlined"
            min="1"
            max="20"
          ></v-text-field>
          
          <v-alert
            v-if="examStore.error"
            type="error"
            variant="tonal"
            class="mt-3"
          >
            {{ examStore.error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="addToExamDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmAddToExam"
            :loading="examStore.isLoading"
            :disabled="!selectedExam"
          >
            添加
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionStore } from '../../stores/question'
import { useExamStore } from '../../stores/exam'
import { useUserStore } from '../../stores/user'
import { QuestionType } from '../../mock'

// 获取路由参数
const route = useRoute()
const router = useRouter()
const questionId = route.params.id as string

// 获取store
const questionStore = useQuestionStore()
const examStore = useExamStore()
const userStore = useUserStore()

// 对话框控制
const editDialog = ref(false)
const deleteDialog = ref(false)
const addToExamDialog = ref(false)

// 题型列表
const questionTypes = Object.values(QuestionType)

// 编辑题目的表单数据
const editQuestion = reactive({
  id: '',
  type: QuestionType.SINGLE_CHOICE,
  content: '',
  options: [] as { key: string; value: string }[],
  answer: '',
  difficulty: 3,
  tags: [] as string[],
  subject: ''
})

// 用于多选题的答案处理
const multipleAnswers = ref<string[]>([])

// 添加到试卷
const selectedExam = ref('')
const questionScore = ref(5)
const exams = ref<any[]>([])

// 监听多选答案变化
watch(multipleAnswers, (newVal) => {
  if (editQuestion.type === QuestionType.MULTIPLE_CHOICE) {
    editQuestion.answer = newVal
  }
}, { deep: true })

// 监听题型变化
watch(() => editQuestion.type, (newType) => {
  // 如果切换到判断题，更新选项
  if (newType === QuestionType.TRUE_FALSE) {
    editQuestion.options = [
      { key: 'A', value: '正确' },
      { key: 'B', value: '错误' }
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
        { key: 'D', value: '' }
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
})

// 页面加载时获取数据
onMounted(async () => {
  // 获取元数据（科目、标签等）
  await questionStore.fetchMetadata()
  
  // 获取题目详情
  await fetchQuestion()
  
  // 获取试卷列表
  if (userStore.isAdmin) {
    await fetchExams()
  }
})

// 获取题目详情
async function fetchQuestion() {
  await questionStore.fetchQuestion(questionId)
}

// 获取试卷列表
async function fetchExams() {
  await examStore.fetchExams()
  exams.value = examStore.exams
}

// 打开编辑对话框
function openEditDialog() {
  if (!questionStore.currentQuestion) return
  
  // 填充表单数据
  Object.assign(editQuestion, {
    id: questionStore.currentQuestion.id,
    type: questionStore.currentQuestion.type,
    content: questionStore.currentQuestion.content,
    options: questionStore.currentQuestion.options ? [...questionStore.currentQuestion.options] : [],
    difficulty: questionStore.currentQuestion.difficulty,
    tags: questionStore.currentQuestion.tags ? [...questionStore.currentQuestion.tags] : [],
    subject: questionStore.currentQuestion.subject
  })
  
  // 处理不同类型题目的答案
  if (questionStore.currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
    multipleAnswers.value = Array.isArray(questionStore.currentQuestion.answer) 
      ? [...questionStore.currentQuestion.answer] 
      : []
    editQuestion.answer = multipleAnswers.value
  } else {
    editQuestion.answer = questionStore.currentQuestion.answer
  }
  
  // 打开对话框
  editDialog.value = true
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
    if (editQuestion.type === QuestionType.SINGLE_CHOICE || editQuestion.type === QuestionType.TRUE_FALSE) {
      if (editQuestion.answer === editQuestion.options[index]?.key) {
        editQuestion.answer = ''
      }
    } else if (editQuestion.type === QuestionType.MULTIPLE_CHOICE) {
      const removedKey = String.fromCharCode(65 + index)
      multipleAnswers.value = multipleAnswers.value.filter(key => key !== removedKey)
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
    
    // 更新题目
    await questionStore.updateQuestion(editQuestion.id, editQuestion)
    
    // 关闭对话框
    editDialog.value = false
    
    // 刷新题目详情
    await fetchQuestion()
  } catch (error) {
    console.error('保存题目失败', error)
  }
}

// 确认删除题目
function confirmDelete() {
  deleteDialog.value = true
}

// 删除题目
async function deleteQuestion() {
  try {
    await questionStore.deleteQuestion(questionId)
    deleteDialog.value = false
    
    // 返回题库页面
    router.push({ name: 'questions' })
  } catch (error) {
    console.error('删除题目失败', error)
  }
}

// 添加到试卷
function addToExam() {
  addToExamDialog.value = true
}

// 确认添加到试卷
async function confirmAddToExam() {
  if (!questionStore.currentQuestion || !selectedExam.value) return
  
  try {
    // 获取试卷详情
    await examStore.fetchExam(selectedExam.value)
    
    if (!examStore.currentExam) return
    
    // 检查题目是否已存在
    const questionExists = examStore.currentExam.questions.some(q => q.id === questionId)
    
    if (questionExists) {
      // 更新题目分值
      const updatedQuestions = examStore.currentExam.questions.map(q => {
        if (q.id === questionId) {
          return { ...q, score: questionScore.value }
        }
        return q
      })
      
      await examStore.updateExam(selectedExam.value, {
        questions: updatedQuestions
      })
    } else {
      // 添加题目
      const updatedQuestions = [
        ...examStore.currentExam.questions,
        {
          id: questionId,
          score: questionScore.value
        }
      ]
      
      await examStore.updateExam(selectedExam.value, {
        questions: updatedQuestions
      })
    }
    
    // 关闭对话框
    addToExamDialog.value = false
  } catch (error) {
    console.error('添加题目到试卷失败', error)
  }
}

// 判断选项是否为正确答案
function isCorrectAnswer(key: string) {
  if (!questionStore.currentQuestion) return false
  
  if (questionStore.currentQuestion.type === QuestionType.MULTIPLE_CHOICE) {
    return Array.isArray(questionStore.currentQuestion.answer) && 
      questionStore.currentQuestion.answer.includes(key)
  } else {
    return questionStore.currentQuestion.answer === key
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
.text-pre-wrap {
  white-space: pre-wrap;
}
</style> 