import axios from 'axios'

// Use port 5001 (5000 is often taken by macOS AirPlay Receiver)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

// Log API URL in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔗 API URL:', API_URL)
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Add token to requests
api.interceptors.request.use((config) => {
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
  }
  return config
})

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only access localStorage/window in browser environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

