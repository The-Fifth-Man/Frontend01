import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { userApi } from '../api'
import type { User } from '../mock'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = ref(false)
  
  // 计算属性
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isTeacher = computed(() => currentUser.value?.role === 'teacher')
  const userSubjects = computed(() => currentUser.value?.subjects || [])
  
  // 获取当前用户信息
  async function fetchCurrentUser() {
    isLoading.value = true
    error.value = null
    
    try {
      if (isAuthenticated.value) {
        currentUser.value = await userApi.getCurrentUser()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取用户信息失败'
      console.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login(username: string, password: string) {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('尝试登录:', username)
      const response = await userApi.login(username, password)
      console.log('登录成功:', response)
      currentUser.value = response.user
      isAuthenticated.value = true
      localStorage.setItem('token', response.token)
      return true
    } catch (err) {
      console.error('登录失败:', err)
      error.value = err instanceof Error ? err.message : '登录失败，请检查用户名和密码'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  async function register(username: string, password: string, name: string) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await userApi.register(username, password, name)
      currentUser.value = response.user
      isAuthenticated.value = true
      localStorage.setItem('token', response.token)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
      console.error(error.value)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 退出登录
  function logout() {
    currentUser.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
  }

  // 检查是否已登录
  function checkAuth() {
    const token = localStorage.getItem('token')
    isAuthenticated.value = !!token
    return isAuthenticated.value
  }
  
  // 设置默认管理员账号
  function setDefaultAdmin() {
    currentUser.value = {
      id: '1',
      name: '管理员',
      role: 'admin',
      subjects: ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
    }
    isAuthenticated.value = true
    localStorage.setItem('token', `token-admin-${Date.now()}`)
  }
  
  return {
    currentUser,
    isLoading,
    error,
    isAdmin,
    isTeacher,
    userSubjects,
    isAuthenticated,
    fetchCurrentUser,
    login,
    register,
    logout,
    checkAuth,
    setDefaultAdmin
  }
}) 