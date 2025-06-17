import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { questionApi, metaApi } from '../api'
import type { Question } from '../mock'
import { QuestionType } from '../mock'

export const useQuestionStore = defineStore('question', () => {
  // —— 状态 —— //
  const questions = ref<Question[]>([])
  const currentQuestion = ref<Question | null>(null)
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const subjects = ref<string[]>([])
  const tags = ref<string[]>([])
  const types = ref<string[]>(Object.values(QuestionType)) // ← 新增：动态题型

  // —— 筛选状态 —— //
  const filterSubject = ref<string | null>(null)
  const filterType = ref<QuestionType | null>(null)
  const filterDifficulty = ref<number | null>(null)
  const filterTag = ref<string | null>(null)
  const searchKeyword = ref('')
  const currentPage = ref(1)
  const pageSize = ref(10)

  // —— 计算属性：拼接查询参数 —— //
  const questionFilters = computed(() => {
    const filters: Record<string, any> = {
      page: currentPage.value - 1, // ← Spring Boot 默认从 0 开始
      pageSize: pageSize.value
    }
    if (filterSubject.value) filters.subject = filterSubject.value
    if (filterType.value) filters.type = filterType.value
    if (filterDifficulty.value !== null) filters.difficulty = filterDifficulty.value
    if (filterTag.value) filters.tag = filterTag.value
    if (searchKeyword.value) filters.search = searchKeyword.value
    return filters
  })

  // —— 方法 —— //
  async function fetchQuestions() {
    isLoading.value = true
    error.value = null
    try {
      const result = await questionApi.getQuestions(questionFilters.value)
      questions.value = result.items
      total.value = result.total
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : '获取题目列表失败'
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchQuestion(id: string) {
    isLoading.value = true
    error.value = null
    try {
      currentQuestion.value = await questionApi.getQuestion(id)
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : '获取题目详情失败'
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  async function createQuestion(question: Partial<Question>) {
    isLoading.value = true
    error.value = null
    try {
      const newQuestion = await questionApi.createQuestion(question)
      questions.value.unshift(newQuestion)
      return newQuestion
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : '创建题目失败'
      console.error(error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateQuestion(id: string, question: Partial<Question>) {
    isLoading.value = true
    error.value = null
    try {
      const updatedQuestion = await questionApi.updateQuestion(id, question)
      const idx = questions.value.findIndex(q => q.id === id)
      if (idx !== -1) questions.value[idx] = updatedQuestion
      if (currentQuestion.value?.id === id) currentQuestion.value = updatedQuestion
      return updatedQuestion
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : '更新题目失败'
      console.error(error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteQuestion(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await questionApi.deleteQuestion(id)
      const idx = questions.value.findIndex(q => q.id === id)
      if (idx !== -1) questions.value.splice(idx, 1)
      if (currentQuestion.value?.id === id) currentQuestion.value = null
    } catch (err: any) {
      error.value = err instanceof Error ? err.message : '删除题目失败'
      console.error(error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMetadata() {
    try {
      const [subjectsData, tagsData, typesData] = await Promise.all([
        metaApi.getSubjects(),
        metaApi.getTags(),
        metaApi.getTypes() // ← 新增题型请求
      ])
      subjects.value = subjectsData
      tags.value = tagsData
      types.value = typesData
    } catch (err) {
      console.error('获取元数据失败', err)
    }
  }

  function resetFilters() {
    filterSubject.value = null
    filterType.value = null
    filterDifficulty.value = null
    filterTag.value = null
    searchKeyword.value = ''
    currentPage.value = 1
  }

  return {
    // state
    questions,
    currentQuestion,
    total,
    isLoading,
    error,
    subjects,
    tags,
    types,

    // filters
    filterSubject,
    filterType,
    filterDifficulty,
    filterTag,
    searchKeyword,
    currentPage,
    pageSize,

    // actions
    fetchQuestions,
    fetchQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchMetadata,
    resetFilters
  }
})
