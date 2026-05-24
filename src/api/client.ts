import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// ─── AUTO-DETECT API URL (same pattern as Ordering_System reference) ──────────
// If your backend is not found, set EXPO_PUBLIC_API_URL in a .env file:
//   EXPO_PUBLIC_API_URL=http://192.168.1.XX:8000/api
const resolveApiBaseUrl = (): string => {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim()
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }

  if (Platform.OS === 'web') {
    return '/api'
  }

  // Auto-detect host from Expo tunnel/LAN
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri

  if (hostUri) {
    const host = hostUri.split(':')[0]
    return `http://${host}:8000/api`
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api'
  }

  return 'http://localhost:8000/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem('access_token')
  return SecureStore.getItemAsync('access_token')
}

const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem('refresh_token')
  return SecureStore.getItemAsync('refresh_token')
}

const setToken = async (access: string, refresh: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  } else {
    await SecureStore.setItemAsync('access_token', access)
    await SecureStore.setItemAsync('refresh_token', refresh)
  }
}

export const clearTokens = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  } else {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    await SecureStore.deleteItemAsync('user')
  }
}

// ─── INTERCEPTORS ─────────────────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        const refresh = await getRefreshToken()
        if (refresh) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
          await setToken(res.data.access, refresh)
          orig.headers.Authorization = `Bearer ${res.data.access}`
          return api(orig)
        }
      } catch {
        await clearTokens()
      }
    }
    return Promise.reject(error)
  }
)

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const loginApi = (email: string, password: string) =>
  api.post('/auth/login/', { email, password })
export const registerApi = (data: any) => api.post('/auth/register/', data)
export const fetchMe = () => api.get('/auth/me/')
export const logoutApi = (refresh: string) => api.post('/auth/logout/', { refresh })

// ─── BOOKS ───────────────────────────────────────────────────────────────────
export const getBooks = (params?: any) => api.get('/books/', { params })
export const createBook = (data: any) => api.post('/books/', data)
export const updateBook = (id: number, data: any) => api.patch(`/books/${id}/`, data)
export const deleteBook = (id: number) => api.delete(`/books/${id}/`)

// ─── MEMBERS ─────────────────────────────────────────────────────────────────
export const getMembers = () => api.get('/members/')
export const getMember = (id: number) => api.get(`/members/${id}/`)
export const updateMember = (id: number, data: any) => api.patch(`/members/${id}/`, data)

// ─── BORROWS ─────────────────────────────────────────────────────────────────
export const getBorrows = (params?: any) => api.get('/borrows/', { params })
export const createBorrow = (data: any) => api.post('/borrows/', data)
export const approveBorrow = (id: number) => api.post(`/borrows/${id}/approve/`, {})
export const rejectBorrow = (id: number, data?: any) => api.post(`/borrows/${id}/reject/`, data || {})
export const returnBook = (id: number) => api.post(`/borrows/${id}/return/`, {})

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard/')

// ─── CHATBOT ─────────────────────────────────────────────────────────────────
export const chatbot = (message: string, history: any[] = []) =>
  api.post('/chatbot/', { message, history })

export default api
