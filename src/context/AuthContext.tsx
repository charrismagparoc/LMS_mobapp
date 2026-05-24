import * as SecureStore from 'expo-secure-store'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Platform } from 'react-native'
import { AuthUser } from '../types'
import { fetchMe, logoutApi, clearTokens } from '../api/client'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (userData: AuthUser, access: string, refresh: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const storeGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') return localStorage.getItem(key)
  return SecureStore.getItemAsync(key)
}

const storeSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') localStorage.setItem(key, value)
  else await SecureStore.setItemAsync(key, value)
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await storeGet('access_token')
        if (token) {
          const res = await fetchMe()
          setUser(res.data)
        }
      } catch {
        await clearTokens()
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  const login = async (userData: AuthUser, access: string, refresh: string) => {
    await storeSet('access_token', access)
    await storeSet('refresh_token', refresh)
    await storeSet('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try {
      const refresh = await storeGet('refresh_token')
      if (refresh) await logoutApi(refresh)
    } catch {}
    await clearTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
