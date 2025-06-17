import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { examApi } from '../api'
import type { Exam, Question } from '../mock'

export const useExamStore = defineStore('exam', () => {
  // 状态
  const exams = ref<Exam[]>([])
  const currentExam = ref<Exam | null>(null)
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 筛选状态
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 组卷工作台状态
  const workbenchExam = ref<Partial<Exam>>({
    title: '',
    duration: 90,
    questions: [],
    totalScore: 0
  })
  
  // 计算属性
  const examFilters = computed(() => {
    const filters: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (searchKeyword.value) {
      filters.search = searchKeyword.value
    }
    
    return filters
  })
  
  // 方法
  async function fetchExams() {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await examApi.getExams(examFilters.value)
      exams.value = result.items
      total.value = result.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取试卷列表失败'
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }
  
  async function fetchExam(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      currentExam.value = await examApi.getExam(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取试卷详情失败'
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }
  
  // 根据ID获取试卷
  async function getExamById(id: string): Promise<Exam | null> {
    try {
      // 先在已加载的试卷中查找
      let exam = exams.value.find(e => e.id === id)
      
      // 如果当前已加载的试卷就是要查找的试卷
      if (currentExam.value && currentExam.value.id === id) {
        return currentExam.value
      }
      
      // 如果找不到，则从服务器获取
      if (!exam) {
        await fetchExam(id)
        return currentExam.value
      }
      
      return exam
    } catch (err) {
      console.error('获取试卷失败', err)
      return null
    }
  }
  
  async function createExam(exam: Partial<Exam>) {
    isLoading.value = true
    error.value = null
    
    try {
      const newExam = await examApi.createExam(exam)
      exams.value.unshift(newExam)
      return newExam
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建试卷失败'
      console.error(error.value)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }
  
  async function updateExam(id: string, exam: Partial<Exam>) {
    isLoading.value = true
    error.value = null
    
    try {
      const updatedExam = await examApi.updateExam(id, exam)
      const index = exams.value.findIndex(e => e.id === id)
      
      if (index !== -1) {
        exams.value[index] = updatedExam
      }
      
      if (currentExam.value?.id === id) {
        currentExam.value = updatedExam
      }
      
      return updatedExam
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新试卷失败'
      console.error(error.value)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }
  
  async function deleteExam(id: string) {
    isLoading.value = true
    error.value = null
    
    try {
      await examApi.deleteExam(id)
      const index = exams.value.findIndex(e => e.id === id)
      
      if (index !== -1) {
        exams.value.splice(index, 1)
      }
      
      if (currentExam.value?.id === id) {
        currentExam.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除试卷失败'
      console.error(error.value)
      throw error.value
    } finally {
      isLoading.value = false
    }
  }
  
  // 组卷工作台方法
  function resetWorkbench() {
    workbenchExam.value = {
      title: '',
      duration: 90,
      questions: [],
      totalScore: 0
    }
  }
  
  function addQuestionToWorkbench(question: Question, score: number = 5) {
    if (!workbenchExam.value.questions) {
      workbenchExam.value.questions = []
    }
    
    // 检查题目是否已存在
    const existingIndex = workbenchExam.value.questions.findIndex(q => q.id === question.id)
    
    if (existingIndex === -1) {
      workbenchExam.value.questions.push({
        id: question.id,
        score
      })
      
      // 更新总分
      updateWorkbenchTotalScore()
    }
  }
  
  function removeQuestionFromWorkbench(questionId: string) {
    if (!workbenchExam.value.questions) return
    
    const index = workbenchExam.value.questions.findIndex(q => q.id === questionId)
    
    if (index !== -1) {
      workbenchExam.value.questions.splice(index, 1)
      
      // 更新总分
      updateWorkbenchTotalScore()
    }
  }
  
  function updateQuestionScoreInWorkbench(questionId: string, score: number) {
    if (!workbenchExam.value.questions) return
    
    const index = workbenchExam.value.questions.findIndex(q => q.id === questionId)
    
    if (index !== -1) {
      workbenchExam.value.questions[index].score = score
      
      // 更新总分
      updateWorkbenchTotalScore()
    }
  }
  
  function updateWorkbenchTotalScore() {
    if (!workbenchExam.value.questions) {
      workbenchExam.value.totalScore = 0
      return
    }
    
    workbenchExam.value.totalScore = workbenchExam.value.questions.reduce(
      (sum, q) => sum + q.score,
      0
    )
  }
  
  // 重置筛选条件
  function resetFilters() {
    searchKeyword.value = ''
    currentPage.value = 1
  }
  
  return {
    exams,
    currentExam,
    total,
    isLoading,
    error,
    searchKeyword,
    currentPage,
    pageSize,
    workbenchExam,
    fetchExams,
    fetchExam,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    resetFilters,
    resetWorkbench,
    addQuestionToWorkbench,
    removeQuestionFromWorkbench,
    updateQuestionScoreInWorkbench
  }
}) 