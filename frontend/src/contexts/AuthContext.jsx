import { createContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export { AuthContext }

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authAPI.getCurrentUser()
      
      if (response.data.success) {
        setUser(response.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.log('Auth check failed:', error.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = () => {
    authAPI.googleLogin()
  }

  const logout = async () => {
    try {
      await authAPI.logout()
      setUser(null)
      setError(null)
      
      // Redirect to login page
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails on server, clear local state
      setUser(null)
      window.location.href = '/admin/login'
    }
  }

  const isAuthenticated = () => {
    return !!user
  }

  const isAdmin = () => {
    return isAuthenticated() && user.email
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
