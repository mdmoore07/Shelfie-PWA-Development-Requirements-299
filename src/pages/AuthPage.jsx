import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../components/common/SafeIcon'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Header from '../components/Layout/Header'
import { useAuth } from '../contexts/AuthContext'

const { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } = FiIcons

const AuthPage = () => {
  const navigate = useNavigate()
  const { signIn, signUp, isLoading } = useAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setError(null)
  }

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required')
      return false
    }
    
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    
    if (!isLogin && !formData.fullName) {
      setError('Full name is required')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) throw error
        
        // Redirect to home page after successful login
        navigate('/')
      } else {
        // Sign up
        const { data, error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        
        // Show success message for sign up
        setError({
          type: 'success',
          message: 'Account created! You can now sign in.'
        })
        
        // Switch to login view
        setIsLogin(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError(error.message || 'Authentication failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={isLogin ? "Sign In" : "Create Account"} showBack={true} />
      
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24"
      >
        <div className="max-w-md mx-auto">
          <Card className="mb-4 py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiUser} className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isLogin ? 'Welcome Back' : 'Create Your Account'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {isLogin ? 'Sign in to continue to Shelfie' : 'Join Shelfie to start creating listings'}
              </p>
            </div>
            
            {error && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                error.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <SafeIcon 
                  icon={error.type === 'success' ? FiIcons.FiCheck : FiAlertCircle} 
                  className={`w-5 h-5 mr-2 ${
                    error.type === 'success' ? 'text-green-500' : 'text-red-500'
                  }`} 
                />
                <span className={`text-sm ${
                  error.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {error.message || error}
                </span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <SafeIcon 
                      icon={FiUser} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    />
                    <input 
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <SafeIcon 
                    icon={FiMail} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <SafeIcon 
                    icon={FiLock} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-sm text-primary-600 hover:text-primary-800">
                    Forgot password?
                  </button>
                </div>
              )}
              
              <Button 
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </Card>
          
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={toggleAuthMode}
                className="ml-1 text-primary-600 hover:text-primary-800 font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  )
}

export default AuthPage