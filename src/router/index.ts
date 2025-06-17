import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 布局组件
const MainLayout = () => import('../views/layouts/MainLayout.vue')

// 页面组件
const HomePage = () => import('../views/HomePage.vue')
// 登录页暂时移除
// const LoginPage = () => import('../views/LoginPage.vue')
const QuestionBank = () => import('../views/question/QuestionBank.vue')
const QuestionDetail = () => import('../views/question/QuestionDetail.vue')
const ExamList = () => import('../views/exam/ExamList.vue')
const ExamWorkbench = () => import('../views/exam/ExamWorkbench.vue')
const ExamDetail = () => import('../views/exam/ExamDetail.vue')
const ExamTaking = () => import('../views/exam/ExamTaking.vue')
const ExamResult = () => import('../views/exam/ExamResult.vue')
const NotFound = () => import('../views/NotFound.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 登录页暂时移除
    // {
    //   path: '/login',
    //   name: 'login',
    //   component: LoginPage,
    //   meta: { title: '登录', guest: true }
    // },
    {
      path: '/',
      component: MainLayout,
      // 移除认证需求
      // meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
          meta: { title: '首页' }
        },
        {
          path: 'questions',
          name: 'questions',
          component: QuestionBank,
          meta: { title: '题库管理' }
        },
        {
          path: 'questions/:id',
          name: 'question-detail',
          component: QuestionDetail,
          meta: { title: '题目详情' }
        },
        {
          path: 'exams',
          name: 'exams',
          component: ExamList,
          meta: { title: '试卷管理' }
        },
        {
          path: 'exams/create',
          name: 'exam-create',
          component: ExamWorkbench,
          meta: { title: '创建试卷', requiresAdmin: true }
        },
        {
          path: 'exams/:id',
          name: 'exam-detail',
          component: ExamDetail,
          meta: { title: '试卷详情' }
        },
        {
          path: 'exams/:id/edit',
          name: 'exam-edit',
          component: ExamWorkbench,
          meta: { title: '编辑试卷', requiresAdmin: true }
        },
        {
          path: 'exams/:id/take',
          name: 'exam-taking',
          component: ExamTaking,
          meta: { title: '考试' }
        },
        {
          path: 'exam-results/:id',
          name: 'exam-result',
          component: ExamResult,
          meta: { title: '考试结果' }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: { title: '页面不存在' }
    }
  ]
})

// 导航守卫 - 简化版
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '考试题库系统'} - 考试题库管理系统`
  
  // 获取用户信息
  const userStore = useUserStore()
  
  // 自动设置为已登录状态，使用默认管理员账号
  if (!userStore.currentUser) {
    userStore.setDefaultAdmin()
  }
  
  // 仅检查管理员权限
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return next({ name: 'home' })
  }
  
  next()
})

export default router
