'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface User {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatar?: string
  bio?: string
  roles?: string[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Verify token is still valid
      const response = await api.get('/auth/me')
      if (response.data) {
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (error: any) {
      // Token is invalid, clear it
      console.error('Auth check failed:', error.response?.status || error.message)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    // Force a re-render by updating state immediately
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

