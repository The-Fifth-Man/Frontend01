import Mock from 'mockjs'

// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER'
}

export interface Option {
  id?: number         // 可选：仅后端返回带 id
  optKey: string      // A, B, C...
  value: string       // 选项内容
}

export interface Question {
  id: string
  subject: string
  type: QuestionType
  difficulty: number
  tags: string[]       // 解析自后端 JSON 字符串
  content: string
  answer: string | string[]  // 单选为 string，多选为 string[]
  options?: Option[]   // 非简答题/判断题时才存在
}

// 试卷接口
export interface Exam {
  id: string
  title: string
  duration: number
  totalScore: number
  questions: {
    id: string
    score: number
  }[]
  createdBy: string
  createdAt: string
}

// 用户接口
export interface User {
  id: string
  name: string
  role: 'teacher' | 'admin'
  subjects: string[]
}

// 考试提交结果
interface ExamSubmission {
  id: string
  examId: string
  userId: string
  answers: Record<string, any>
  usedTime: number
  score: number
  totalScore: number
  correctCount: number
  totalCount: number
  submittedAt: string
}

// 模拟考试提交数据
const examSubmissions: ExamSubmission[] = []

// 生成mock数据
const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const tags = ['基础', '进阶', '挑战', '期中', '期末', '模拟', '真题', '重点', '易错点']

// 生成选择题选项
const generateOptions = (type: QuestionType) => {
  if (type === QuestionType.TRUE_FALSE) {
    return [
      { key: 'A', value: '正确' },
      { key: 'B', value: '错误' }
    ]
  }

  const count = type === QuestionType.SINGLE_CHOICE ? 4 : Mock.Random.integer(4, 6)
  return Array.from({ length: count }, (_, index) => ({
    key: String.fromCharCode(65 + index),
    value: Mock.Random.sentence(3, 10)
  }))
}

// 生成答案
const generateAnswer = (type: QuestionType, options: { key: string; value: string }[]) => {
  if (type === QuestionType.SHORT_ANSWER) {
    return Mock.Random.paragraph(1, 3)
  }

  if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.TRUE_FALSE) {
    return options[Mock.Random.integer(0, options.length - 1)].key
  }

  // 多选题
  const count = Mock.Random.integer(2, options.length)
  const selectedIndexes = Mock.Random.shuffle(
    Array.from({ length: options.length }, (_, i) => i)
  ).slice(0, count)

  return selectedIndexes.map(i => options[i].key).sort()
}

// 生成题目
const generateQuestions = (count: number) => {
  return Array.from({ length: count }, () => {
    const type = Mock.Random.pick(Object.values(QuestionType))
    const options = type !== QuestionType.SHORT_ANSWER ? generateOptions(type as QuestionType) : undefined

    return {
      id: Mock.Random.guid(),
      type,
      content: Mock.Random.paragraph(1, 3),
      options,
      answer: generateAnswer(type as QuestionType, options || []),
      difficulty: Mock.Random.integer(1, 5),
      tags: Mock.Random.shuffle(tags).slice(0, Mock.Random.integer(1, 3)),
      subject: Mock.Random.pick(subjects),
      createdBy: Mock.Random.guid(),
      createdAt: Mock.Random.datetime()
    }
  })
}

// 生成试卷
const generateExams = (count: number, questions: Question[]) => {
  return Array.from({ length: count }, () => {
    const selectedQuestions = Mock.Random.shuffle([...questions])
      .slice(0, Mock.Random.integer(10, 20))
      .map(q => ({
        id: q.id,
        score: Mock.Random.integer(2, 10)
      }))

    return {
      id: Mock.Random.guid(),
      title: `${Mock.Random.pick(subjects)}${Mock.Random.pick(['期中', '期末', '模拟', '周测'])}试卷`,
      duration: Mock.Random.integer(60, 120),
      totalScore: selectedQuestions.reduce((sum, q) => sum + q.score, 0),
      questions: selectedQuestions,
      createdBy: Mock.Random.guid(),
      createdAt: Mock.Random.datetime()
    }
  })
}

// 用户数据结构扩展，添加用户名和密码
interface UserWithCredentials extends User {
  username: string;
  password: string;
}

// 更新用户数据生成函数
const generateUsers = () => {
  return [
    {
      id: '1',
      name: '管理员',
      username: 'admin',
      password: '123456',
      role: 'admin',
      subjects: subjects
    },
    {
      id: '2',
      name: '数学老师',
      username: 'math',
      password: '123456',
      role: 'teacher',
      subjects: ['数学']
    },
    {
      id: '3',
      name: '语文老师',
      username: 'chinese',
      password: '123456',
      role: 'teacher',
      subjects: ['语文']
    },
    {
      id: '4',
      name: '英语老师',
      username: 'english',
      password: '123456',
      role: 'teacher',
      subjects: ['英语']
    }
  ] as UserWithCredentials[]
}

// 生成所有数据
export const questions = generateQuestions(100)
export const exams = generateExams(20, questions)
export const users = generateUsers()

// 当前登录用户，默认设置为管理员
export let currentUser: User | null = users[0]

console.log('初始化MockJS...，默认用户已设置:', currentUser.name)

// Mock API
Mock.setup({
  timeout: '200-600',
  responseType: 'json'
})

// 记录所有Mock拦截的请求
Mock.mock(/.*/, 'GET', function(options) {
  console.log('Mock拦截到GET请求:', options.url)
  return null
})

Mock.mock(/.*/, 'POST', function(options) {
  console.log('Mock拦截到POST请求:', options.url, options.body)
  return null
})

// 确保后续拦截器能够正常工作
const originalMock = Mock.mock
Mock.mock = function() {
  console.log('注册Mock拦截:', arguments[0])
  return originalMock.apply(this, arguments)
}

// 获取题目列表
Mock.mock(/\/api\/questions(\?.+)?$/, 'get', (options: any) => {
  // 解析查询参数
  const url = options.url
  const params = new URLSearchParams(url.substring(url.indexOf('?')))

  let filteredQuestions = [...questions]

  // 筛选条件
  if (params.has('subject')) {
    filteredQuestions = filteredQuestions.filter(q => q.subject === params.get('subject'))
  }

  if (params.has('type')) {
    filteredQuestions = filteredQuestions.filter(q => q.type === params.get('type'))
  }

  if (params.has('difficulty')) {
    const difficulty = parseInt(params.get('difficulty') || '0')
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty)
  }

  if (params.has('tag')) {
    const tag = params.get('tag')
    filteredQuestions = filteredQuestions.filter(q => q.tags.includes(tag || ''))
  }

  if (params.has('search')) {
    const search = params.get('search')?.toLowerCase() || ''
    filteredQuestions = filteredQuestions.filter(q =>
      q.content.toLowerCase().includes(search) ||
      q.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  // 分页
  const page = parseInt(params.get('page') || '1')
  const pageSize = parseInt(params.get('pageSize') || '10')
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    data: {
      total: filteredQuestions.length,
      items: filteredQuestions.slice(start, end)
    }
  }
})

// 获取单个题目
Mock.mock(/\/api\/questions\/\w+$/, 'get', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const question = questions.find(q => q.id === id)

  if (!question) {
    return {
      code: 404,
      message: '题目不存在'
    }
  }

  return {
    code: 200,
    data: question
  }
})

// 创建题目
Mock.mock('/api/questions', 'post', (options: any) => {
  const question = JSON.parse(options.body)
  question.id = Mock.Random.guid()
  question.createdBy = currentUser?.id || ''
  question.createdAt = new Date().toISOString()

  questions.unshift(question)

  return {
    code: 200,
    data: question
  }
})

// 更新题目
Mock.mock(/\/api\/questions\/\w+$/, 'put', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const index = questions.findIndex(q => q.id === id)

  if (index === -1) {
    return {
      code: 404,
      message: '题目不存在'
    }
  }

  const question = JSON.parse(options.body)
  questions[index] = { ...questions[index], ...question }

  return {
    code: 200,
    data: questions[index]
  }
})

// 删除题目
Mock.mock(/\/api\/questions\/\w+$/, 'delete', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const index = questions.findIndex(q => q.id === id)

  if (index === -1) {
    return {
      code: 404,
      message: '题目不存在'
    }
  }

  questions.splice(index, 1)

  return {
    code: 200,
    message: '删除成功'
  }
})

// 获取试卷列表
Mock.mock(/\/api\/exams(\?.+)?$/, 'get', (options: any) => {
  // 解析查询参数
  const url = options.url
  const params = new URLSearchParams(url.substring(url.indexOf('?')))

  let filteredExams = [...exams]

  // 筛选条件
  if (params.has('search')) {
    const search = params.get('search')?.toLowerCase() || ''
    filteredExams = filteredExams.filter(e =>
      e.title.toLowerCase().includes(search)
    )
  }

  // 分页
  const page = parseInt(params.get('page') || '1')
  const pageSize = parseInt(params.get('pageSize') || '10')
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    data: {
      total: filteredExams.length,
      items: filteredExams.slice(start, end)
    }
  }
})

// 获取单个试卷
Mock.mock(/\/api\/exams\/\w+$/, 'get', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const exam = exams.find(e => e.id === id)

  if (!exam) {
    return {
      code: 404,
      message: '试卷不存在'
    }
  }

  // 获取完整题目信息
  const examWithQuestions = {
    ...exam,
    questions: exam.questions.map(q => {
      const question = questions.find(question => question.id === q.id)
      return {
        ...question,
        score: q.score
      }
    })
  }

  return {
    code: 200,
    data: examWithQuestions
  }
})

// 创建试卷
Mock.mock('/api/exams', 'post', (options: any) => {
  const exam = JSON.parse(options.body)
  exam.id = Mock.Random.guid()
  exam.createdBy = currentUser?.id || ''
  exam.createdAt = new Date().toISOString()

  exams.unshift(exam)

  return {
    code: 200,
    data: exam
  }
})

// 更新试卷
Mock.mock(/\/api\/exams\/\w+$/, 'put', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const index = exams.findIndex(e => e.id === id)

  if (index === -1) {
    return {
      code: 404,
      message: '试卷不存在'
    }
  }

  const exam = JSON.parse(options.body)
  exams[index] = { ...exams[index], ...exam }

  return {
    code: 200,
    data: exams[index]
  }
})

// 删除试卷
Mock.mock(/\/api\/exams\/\w+$/, 'delete', (options: any) => {
  const id = options.url.substring(options.url.lastIndexOf('/') + 1)
  const index = exams.findIndex(e => e.id === id)

  if (index === -1) {
    return {
      code: 404,
      message: '试卷不存在'
    }
  }

  exams.splice(index, 1)

  return {
    code: 200,
    message: '删除成功'
  }
})

// 登录API - 使用正则表达式以确保URL匹配
Mock.mock(/\/api\/login(\?.+)?$/, 'post', (options: any) => {
  try {
    console.log('处理登录请求:', options.url, options.body)
    const { username, password } = JSON.parse(options.body)
    console.log('Mock登录API收到请求:', username, password)

    // 硬编码admin账号的检查，确保初始账号能正常登录
    if (username === 'admin' && password === '123456') {
      console.log('管理员登录成功')

      // 设置当前用户为admin
      currentUser = users[0]

      return {
        code: 200,
        data: {
          user: {
            id: users[0].id,
            name: users[0].name,
            role: users[0].role,
            subjects: users[0].subjects
          },
          token: `token-admin-${Date.now()}`
        }
      }
    }

    // 其他用户的检查
    const user = users.find(
      u => (u as any).username === username && (u as any).password === password
    )

    if (!user) {
      console.log('登录失败：用户名或密码错误')
      return {
        code: 401,
        message: '用户名或密码错误'
      }
    }

    // 设置当前用户
    currentUser = user
    console.log('登录成功:', user.name)

    const { password: _, ...safeUser } = user as any

    return {
      code: 200,
      data: {
        user: safeUser,
        token: `token-${user.id}-${Date.now()}`
      }
    }
  } catch (error) {
    console.error('Mock登录API处理错误:', error)
    return {
      code: 500,
      message: '服务器内部错误'
    }
  }
})

// 注册API
Mock.mock('/api/register', 'post', (options: any) => {
  const { username, password, name } = JSON.parse(options.body)

  // 检查用户名是否已存在
  if (users.some((u: any) => u.username === username)) {
    return {
      code: 400,
      message: '用户名已存在'
    }
  }

  // 创建新用户
  const newUser = {
    id: `user-${users.length + 1}`,
    name,
    username,
    password,
    role: 'teacher',
    subjects: []
  } as any

  users.push(newUser)

  // 设置当前用户
  currentUser = newUser

  const { password: _, ...safeUser } = newUser

  return {
    code: 200,
    data: {
      user: safeUser,
      token: `token-${newUser.id}-${Date.now()}`
    }
  }
})

// 获取用户信息
Mock.mock('/api/user', 'get', () => {
  if (!currentUser) {
    return {
      code: 401,
      message: '未登录'
    }
  }

  return {
    code: 200,
    data: currentUser
  }
})

// 获取所有学科
Mock.mock('/api/subjects', 'get', () => {
  return {
    code: 200,
    data: subjects
  }
})

// 获取所有标签
Mock.mock('/api/tags', 'get', () => {
  return {
    code: 200,
    data: tags
  }
})

// 添加考试答题相关API
Mock.mock(/\/api\/exam-submissions/, 'post', (options: any) => {
  const submission = JSON.parse(options.body)
  const exam = exams.find(e => e.id === submission.examId)

  if (!exam) {
    return {
      code: 404,
      message: '试卷不存在'
    }
  }

  // 计算得分
  let score = 0
  let correctCount = 0
  const detailedAnswers: Record<string, {
    userAnswer: any,
    correctAnswer: any,
    isCorrect: boolean,
    score: number
  }> = {}

  for (const questionRef of exam.questions) {
    const question = questions.find(q => q.id === questionRef.id)
    if (!question) continue;

    const userAnswer = submission.answers[questionRef.id]
    const correctAnswer = question.answer

    let isCorrect = false

    // 根据题型判断答案是否正确
    if (question.type === QuestionType.SINGLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
      isCorrect = userAnswer === correctAnswer
    } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
      // 多选题需要完全匹配
      isCorrect = Array.isArray(userAnswer) &&
                 Array.isArray(correctAnswer) &&
                 userAnswer.length === correctAnswer.length &&
                 userAnswer.every(a => correctAnswer.includes(a))
    } else if (question.type === QuestionType.SHORT_ANSWER) {
      // 问答题暂时无法自动评分，需要教师手动评分
      isCorrect = false
    }

    const questionScore = isCorrect ? questionRef.score : 0
    score += questionScore
    if (isCorrect) correctCount++

    detailedAnswers[questionRef.id] = {
      userAnswer,
      correctAnswer,
      isCorrect,
      score: questionScore
    }
  }

  // 创建提交记录
  const submissionRecord: ExamSubmission = {
    id: Mock.Random.guid(),
    examId: submission.examId,
    userId: submission.userId,
    answers: detailedAnswers,
    usedTime: submission.usedTime,
    score,
    totalScore: exam.totalScore,
    correctCount,
    totalCount: exam.questions.length,
    submittedAt: new Date().toISOString()
  }

  // 保存提交记录
  examSubmissions.push(submissionRecord)

  return {
    code: 200,
    data: submissionRecord
  }
})

// 获取考试结果
Mock.mock(/\/api\/exam-submissions\/\w+/, 'get', (options: any) => {
  const url = options.url
  const id = url.match(/\/api\/exam-submissions\/(\w+)/)[1]

  const submission = examSubmissions.find(s => s.id === id)

  if (!submission) {
    return {
      code: 404,
      message: '考试结果不存在'
    }
  }

  return {
    code: 200,
    data: submission
  }
})

// 获取用户考试历史
Mock.mock(/\/api\/users\/\w+\/exam-history/, 'get', (options: any) => {
  const url = options.url
  const userId = url.match(/\/api\/users\/(\w+)\/exam-history/)[1]

  const userSubmissions = examSubmissions.filter(s => s.userId === userId)

  return {
    code: 200,
    data: {
      total: userSubmissions.length,
      items: userSubmissions
    }
  }
})

// 硬编码admin登录路由
Mock.mock('/api/login/admin', 'post', () => {
  console.log('使用硬编码admin登录路由')

  // 设置当前用户为admin
  currentUser = users[0]

  return {
    code: 200,
    data: {
      user: {
        id: users[0].id,
        name: users[0].name,
        role: users[0].role,
        subjects: users[0].subjects
      },
      token: `token-admin-${Date.now()}`
    }
  }
})

export default Mock
