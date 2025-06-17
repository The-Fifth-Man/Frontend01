<template>
  <v-app>
    <!-- 应用栏 -->
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>考试题库管理系统</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <div v-if="userStore.currentUser">
        <v-chip class="mr-2" color="primary" variant="outlined">
          <v-avatar start>
            <v-icon>mdi-account</v-icon>
          </v-avatar>
          {{ userStore.currentUser.name }}
          <span class="ml-1 text-caption">({{ userStore.currentUser.role === 'admin' ? '管理员' : '教师' }})</span>
        </v-chip>
        
        <!-- 退出按钮暂时移除 -->
        <!-- <v-btn icon @click="logout">
          <v-icon>mdi-logout</v-icon>
        </v-btn> -->
      </div>
    </v-app-bar>
    
    <!-- 导航抽屉 -->
    <v-navigation-drawer permanent width="250">
      <v-list>
        <v-list-item
          title="首页"
          :to="{ name: 'home' }"
          prepend-icon="mdi-home"
        ></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item
          title="题库管理"
          :to="{ name: 'questions' }"
          prepend-icon="mdi-book-open-variant"
        ></v-list-item>
        
        <v-list-item
          title="试卷管理"
          :to="{ name: 'exams' }"
          prepend-icon="mdi-file-document-multiple"
        ></v-list-item>
        
        <v-list-item
          v-if="userStore.isAdmin"
          title="创建试卷"
          :to="{ name: 'exam-create' }"
          prepend-icon="mdi-file-plus"
        ></v-list-item>
      </v-list>
      
      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="primary" prepend-icon="mdi-brain">
            AI 助手
            <v-dialog
              activator="parent"
              width="600"
            >
              <v-card>
                <v-card-title>AI 助手</v-card-title>
                <v-card-text>
                  <v-tabs v-model="activeAiTab">
                    <v-tab value="generator">智能组卷</v-tab>
                    <v-tab value="grader">评分辅助</v-tab>
                    <v-tab value="analysis">考试分析</v-tab>
                  </v-tabs>
                  
                  <v-window v-model="activeAiTab" class="mt-5">
                    <!-- 智能组卷 -->
                    <v-window-item value="generator">
                      <v-text-field
                        v-model="aiGeneratorTopic"
                        label="请输入试题主题"
                        placeholder="例如：高中数学函数与导数"
                      ></v-text-field>
                      
                      <v-slider
                        v-model="aiGeneratorCount"
                        label="题目数量"
                        min="5"
                        max="30"
                        step="5"
                        thumb-label
                      ></v-slider>
                      
                      <v-slider
                        v-model="aiGeneratorDifficulty"
                        label="难度级别"
                        min="1"
                        max="5"
                        step="1"
                        thumb-label
                      ></v-slider>
                      
                      <v-btn
                        block
                        color="primary"
                        prepend-icon="mdi-robot"
                        :loading="aiGenerating"
                        @click="generateQuestions"
                      >
                        生成试题
                      </v-btn>
                      
                      <v-alert
                        v-if="aiGeneratedQuestions.length > 0"
                        type="success"
                        class="mt-3"
                      >
                        已生成 {{ aiGeneratedQuestions.length }} 道题目
                      </v-alert>
                      
                      <v-list v-if="aiGeneratedQuestions.length > 0" class="mt-3">
                        <v-list-item
                          v-for="(question, index) in aiGeneratedQuestions"
                          :key="index"
                        >
                          <v-list-item-title>
                            {{ question.type }} (难度: {{ question.difficulty }})
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ question.content.substring(0, 50) }}...
                          </v-list-item-subtitle>
                          
                          <template v-slot:append>
                            <v-btn
                              icon="mdi-plus"
                              size="small"
                              variant="text"
                              @click="addGeneratedQuestion(question)"
                            ></v-btn>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-window-item>
                    
                    <!-- 评分辅助 -->
                    <v-window-item value="grader">
                      <v-textarea
                        v-model="aiGraderStudentAnswer"
                        label="学生回答"
                        placeholder="请粘贴学生的问答题答案..."
                        rows="5"
                        auto-grow
                      ></v-textarea>
                      
                      <v-textarea
                        v-model="aiGraderReferenceAnswer"
                        label="参考答案"
                        placeholder="请粘贴或输入参考答案..."
                        rows="5"
                        auto-grow
                      ></v-textarea>
                      
                      <v-slider
                        v-model="aiGraderTotalScore"
                        label="总分值"
                        min="5"
                        max="20"
                        step="5"
                        thumb-label
                      ></v-slider>
                      
                      <v-btn
                        block
                        color="primary"
                        prepend-icon="mdi-check-decagram"
                        :loading="aiGrading"
                        @click="gradeAnswer"
                      >
                        AI 评分
                      </v-btn>
                      
                      <v-card
                        v-if="aiGradingResult"
                        class="mt-3"
                        variant="outlined"
                      >
                        <v-card-title>评分结果</v-card-title>
                        <v-card-text>
                          <div class="d-flex align-center mb-3">
                            <div class="text-h5 font-weight-bold mr-2">
                              {{ aiGradingResult.score }} / {{ aiGraderTotalScore }}
                            </div>
                            <v-rating
                              v-model="aiGradingResult.score"
                              :length="aiGraderTotalScore / 5"
                              density="compact"
                              half-increments
                              readonly
                            ></v-rating>
                          </div>
                          
                          <div class="text-body-1">{{ aiGradingResult.comment }}</div>
                        </v-card-text>
                      </v-card>
                    </v-window-item>
                    
                    <!-- 考试分析 -->
                    <v-window-item value="analysis">
                      <v-file-input
                        v-model="aiAnalysisFile"
                        label="上传成绩单CSV文件"
                        accept=".csv"
                        prepend-icon="mdi-table"
                        show-size
                      ></v-file-input>
                      
                      <v-btn
                        block
                        color="primary"
                        prepend-icon="mdi-chart-box"
                        :loading="aiAnalyzing"
                        :disabled="!aiAnalysisFile"
                        @click="analyzeExam"
                      >
                        生成分析报告
                      </v-btn>
                      
                      <v-alert
                        v-if="aiAnalysisResult"
                        type="success"
                        class="mt-3"
                      >
                        分析完成，点击下方查看详细报告
                      </v-alert>
                      
                      <v-card
                        v-if="aiAnalysisResult"
                        class="mt-3"
                        variant="outlined"
                      >
                        <v-card-title>班级分析报告</v-card-title>
                        <v-card-text>
                          <v-alert type="info" variant="outlined">
                            平均分: {{ aiAnalysisResult.averageScore.toFixed(2) }}
                            最高分: {{ aiAnalysisResult.maxScore }}
                            最低分: {{ aiAnalysisResult.minScore }}
                            及格率: {{ (aiAnalysisResult.passRate * 100).toFixed(2) }}%
                          </v-alert>
                          
                          <v-alert type="warning" variant="outlined" class="mt-3">
                            <div>较难题目: {{ aiAnalysisResult.hardQuestions.join(', ') }}</div>
                            <div>较易题目: {{ aiAnalysisResult.easyQuestions.join(', ') }}</div>
                          </v-alert>
                          
                          <v-alert type="success" variant="outlined" class="mt-3">
                            <div>知识点掌握情况:</div>
                            <ul>
                              <li v-for="(rate, point) in aiAnalysisResult.knowledgePoints" :key="point">
                                {{ point }}: {{ (rate * 100).toFixed(2) }}%
                              </li>
                            </ul>
                          </v-alert>
                        </v-card-text>
                      </v-card>
                    </v-window-item>
                  </v-window>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    variant="text"
                    @click="resetAiAssistant"
                  >
                    关闭
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
    
    <!-- 主内容区 -->
    <v-main class="main-content">
      <v-container fluid class="pa-0">
        <div class="router-view-container">
          <router-view></router-view>
        </div>
      </v-container>
    </v-main>
    
    <!-- 底部 -->
    <v-footer app class="pa-2">
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          {{ new Date().getFullYear() }} — <strong>考试题库管理系统</strong>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useQuestionStore } from '../../stores/question'
import { QuestionType } from '../../mock'

// const router = useRouter()
const userStore = useUserStore()
const questionStore = useQuestionStore()

// 在组件挂载时获取用户信息或设置默认用户
onMounted(async () => {
  if (!userStore.currentUser) {
    userStore.setDefaultAdmin()
  }
})

// 退出登录功能暂时移除
// function logout() {
//   userStore.logout()
//   router.push({ name: 'login' })
// }

// AI助手相关
const activeAiTab = ref('generator')

// 智能组卷
const aiGeneratorTopic = ref('')
const aiGeneratorCount = ref(10)
const aiGeneratorDifficulty = ref(3)
const aiGenerating = ref(false)
const aiGeneratedQuestions = ref<any[]>([])

// 模拟AI生成题目的函数
async function generateQuestions() {
  if (!aiGeneratorTopic.value) return
  
  aiGenerating.value = true
  
  try {
    // 这里模拟AI生成题目的过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成模拟题目
    aiGeneratedQuestions.value = Array.from({ length: aiGeneratorCount.value }, (_, i) => {
      const type = Object.values(QuestionType)[Math.floor(Math.random() * 4)]
      const difficulty = aiGeneratorDifficulty.value
      
      return {
        type,
        difficulty,
        content: `关于${aiGeneratorTopic.value}的第${i + 1}题：${type}难度${difficulty}`,
        options: type !== QuestionType.SHORT_ANSWER ? [
          { key: 'A', value: '选项A' },
          { key: 'B', value: '选项B' },
          { key: 'C', value: '选项C' },
          { key: 'D', value: '选项D' }
        ] : undefined,
        answer: type === QuestionType.SINGLE_CHOICE ? 'A' : 
                type === QuestionType.MULTIPLE_CHOICE ? ['A', 'B'] :
                type === QuestionType.TRUE_FALSE ? 'A' : '这是参考答案',
        tags: [aiGeneratorTopic.value],
        subject: '未分类'
      }
    })
  } finally {
    aiGenerating.value = false
  }
}

// 添加生成的题目到题库
async function addGeneratedQuestion(question: any) {
  try {
    await questionStore.createQuestion(question)
    // 从生成列表中移除
    aiGeneratedQuestions.value = aiGeneratedQuestions.value.filter(q => q !== question)
  } catch (error) {
    console.error('添加生成题目失败', error)
  }
}

// 评分辅助
const aiGraderStudentAnswer = ref('')
const aiGraderReferenceAnswer = ref('')
const aiGraderTotalScore = ref(10)
const aiGrading = ref(false)
const aiGradingResult = ref<any>(null)

// 模拟AI评分的函数
async function gradeAnswer() {
  if (!aiGraderStudentAnswer.value || !aiGraderReferenceAnswer.value) return
  
  aiGrading.value = true
  
  try {
    // 这里模拟AI评分的过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 生成模拟评分结果
    const similarity = Math.random()
    const score = Math.round(similarity * aiGraderTotalScore.value)
    
    aiGradingResult.value = {
      score,
      comment: similarity > 0.8 ? '回答非常好，基本符合参考答案要求。' :
              similarity > 0.6 ? '回答较好，但有一些关键点没有覆盖到。' :
              similarity > 0.4 ? '回答一般，只覆盖了部分知识点。' :
              '回答不够理想，与参考答案相差较大。'
    }
  } finally {
    aiGrading.value = false
  }
}

// 考试分析
const aiAnalysisFile = ref<File | null>(null)
const aiAnalyzing = ref(false)
const aiAnalysisResult = ref<any>(null)

// 模拟AI分析的函数
async function analyzeExam() {
  if (!aiAnalysisFile.value) return
  
  aiAnalyzing.value = true
  
  try {
    // 这里模拟AI分析的过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟分析结果
    aiAnalysisResult.value = {
      averageScore: 75 + Math.random() * 10,
      maxScore: 95 + Math.random() * 5,
      minScore: 45 + Math.random() * 15,
      passRate: 0.7 + Math.random() * 0.2,
      hardQuestions: ['第3题', '第7题', '第12题'],
      easyQuestions: ['第1题', '第5题', '第9题'],
      knowledgePoints: {
        '函数': 0.85 + Math.random() * 0.15,
        '导数': 0.65 + Math.random() * 0.2,
        '积分': 0.55 + Math.random() * 0.2,
        '三角函数': 0.75 + Math.random() * 0.2
      }
    }
  } finally {
    aiAnalyzing.value = false
  }
}

// 重置AI助手
function resetAiAssistant() {
  aiGeneratorTopic.value = ''
  aiGeneratedQuestions.value = []
  
  aiGraderStudentAnswer.value = ''
  aiGraderReferenceAnswer.value = ''
  aiGradingResult.value = null
  
  aiAnalysisFile.value = null
  aiAnalysisResult.value = null
}
</script>

<style>
.v-navigation-drawer {
  position: fixed;
  top: 0;
  left: 0;
  padding-top: 64px; /* 为应用栏留出空间 */
  z-index: 1;
}

.v-app-bar {
  z-index: 2; /* 确保应用栏位于最上层 */
}

.v-main {
  width: calc(100% - 250px) !important;
  height: 100%;
  background-color: white !important;
  margin-left: 250px; /* 与导航抽屉宽度相同 */
  padding-top: 64px !important; /* 为应用栏留出空间 */
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
}

.main-content {
  width: 100%;
  min-height: calc(100vh - 64px); /* 减去应用栏高度 */
  background-color: white !important;
  padding: 0 !important;
}

/* 移除container的默认内边距，防止内容不能延伸到边缘 */
.v-container.fluid.pa-0 {
  max-width: none !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 确保整个应用背景为白色 */
.v-application {
  background-color: white !important;
}

.v-application__wrap {
  background-color: white !important;
}

body, html {
  background-color: white !important;
}

/* 确保路由视图占满容器 */
.router-view-container {
  width: 100%;
  padding: 16px;
}
</style> 