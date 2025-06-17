import type { Question, Exam } from '../mock'
import { QuestionType } from '../mock'

// 通用响应类型
export type ApiResponse<T> = {
  code: number
  data: T
  message?: string
}

// 分页响应类型
export type PageResponse<T> = {
  total: number
  items: T[]
}

// 题目查询参数
export interface QuestionQueryParams {
  subject?: string
  type?: QuestionType
  difficulty?: number
  tag?: string
  search?: string
  page?: number
  pageSize?: number
}

// 试卷查询参数
export interface ExamQueryParams {
  search?: string
  page?: number
  pageSize?: number
}

// 考试答题提交参数
export interface ExamSubmission {
  examId: string
  userId: string
  answers: Record<string, any>
  usedTime: number
}

// 考试结果
export type ExamResult = {
  id: string
  examId: string
  userId: string
  score: number
  totalScore: number
  usedTime: number
  answers: Record<string, any>
  correctCount: number
  totalCount: number
  submittedAt: string
}

// 获取后端地址，自行在 .env 文件中配置 VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

// 基础请求函数，自动解析 ApiResponse 并返回 data
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
  console.debug(`>> ${options.method || 'GET'} ${url}`)

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // 支持携带 Cookie
    ...options
  })

  if (!response.ok) {
    throw new Error(`网络错误: ${response.status}`)
  }

  let res: ApiResponse<T>
  try {
    res = await response.json()
  } catch (e) {
    throw new Error('响应解析失败')
  }

  if (res.code !== 200) {
    throw new Error(res.message || `Error code: ${res.code}`)
  }

  return res.data
}

// 题目相关API
export const questionApi = {
  getQuestions(params: QuestionQueryParams = {}): Promise<PageResponse<Question>> {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val))
    })
    return request<PageResponse<Question>>(`/questions?${query}`)
  },
  getQuestion(id: string): Promise<Question> {
    return request<Question>(`/questions/${id}`)
  },
  createQuestion(payload: Partial<Question>): Promise<Question> {
    return request<Question>(`/questions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
  updateQuestion(id: string, payload: Partial<Question>): Promise<Question> {
    return request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  },
  deleteQuestion(id: string): Promise<void> {
    return request<void>(`/questions/${id}`, { method: 'DELETE' })
  }
}

// 试卷相关API
export const examApi = {
  getExams(params: ExamQueryParams = {}): Promise<PageResponse<Exam>> {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.append(key, String(val))
    })
    return request<PageResponse<Exam>>(`/exams?${query}`)
  },
  getExam(id: string): Promise<Exam> {
    return request<Exam>(`/exams/${id}`)
  },
  createExam(payload: Partial<Exam>): Promise<Exam> {
    return request<Exam>(`/exams`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },
  updateExam(id: string, payload: Partial<Exam>): Promise<Exam> {
    return request<Exam>(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  },
  deleteExam(id: string): Promise<void> {
    return request<void>(`/exams/${id}`, { method: 'DELETE' })
  }
}

// 用户相关API
export const userApi = {
  getCurrentUser(): Promise<any> {
    return request<any>(`/user`)
  },
  login(username: string, password: string): Promise<any> {
    return request<any>(`/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },
  register(username: string, password: string, name: string): Promise<any> {
    return request<any>(`/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password, name })
    })
  }
}

// 考试答题相关API
export const examTakingApi = {
  submitExam(submission: ExamSubmission): Promise<ExamResult> {
    return request<ExamResult>(`/exam-submissions`, {
      method: 'POST',
      body: JSON.stringify(submission)
    })
  },
  getExamResult(submissionId: string): Promise<ExamResult> {
    return request<ExamResult>(`/exam-submissions/${submissionId}`)
  },
  getUserExamHistory(userId: string): Promise<PageResponse<ExamResult>> {
    return request<PageResponse<ExamResult>>(`/users/${userId}/exam-history`)
  }
}

export const metaApi = {
  getSubjects(): Promise<string[]> {
    return request<string[]>(`/subjects`)
  },
  getTags(): Promise<string[]> {
    return request<string[]>(`/tags`)
  },
  getTypes(): Promise<string[]> {
    return request<string[]>(`/types`)
  }
}
