// src/components/AuthForm/AuthForm.js

// 1. imports
import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './AuthForm.css'
import googleLogo from '../../assets/google-logo.svg'

// 2. create AuthForm component
export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup, login, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  // 3. handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (isSignUp) await signup(email, password)
      else            await login( email, password)
      navigate('/chatrooms')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // request notification permission
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission after login:', permission)
    })
  }
  
  // 4. handle Google sign-in
  async function handleGoogleSignIn() {
    setError(''); setLoading(true)
    try {
      await signInWithGoogle()
      // request notification permission
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission after login:', permission)
        })
      }
      navigate('/chatrooms')
    } catch {
      setError('Google sign-in failed')
    }
    setLoading(false)
  }

  // 5. render the form
  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <h1 className="auth-title">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="auth-subtitle">
          {isSignUp
            ? 'Join us—just a few details to get started.'
            : "Sign in to continue."}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>

          <label className="auth-label password-wrapper">
            Password
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </label>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        <div className="auth-alt">
          <span className="divider" />
          <span className="or">or</span>
          <span className="divider" />
        </div>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <img src={googleLogo} alt="Google logo" className="google-logo" />
          <span>Continue with Google</span>
        </button>

        <p className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => setIsSignUp(v => !v)}
            disabled={loading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
)
}
