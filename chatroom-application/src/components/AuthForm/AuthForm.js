// src/components/AuthForm/AuthForm.js

// 1. imports
import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './AuthForm.css'

// 2. create AuthForm component
export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signup, login, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  // email/password sign up / sign in
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signup(email, password)
      } else {
        await login(email, password)
      }
      navigate('/chatrooms')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // google oauth sign in
  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/chatrooms')
    } catch (err) {
      setError('Google sign‑in failed: ' + err.message)
    }
    setLoading(false)
  }
  
  // render the form
  return (
    <div className="auth-form">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (6+ chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading
            ? 'Processing…'
            : isSignUp
            ? 'Sign Up'
            : 'Sign In'}
        </button>
      </form>

      <p className="toggle-container">
        {isSignUp
          ? 'Already have an account?'
          : "Don't have an account?"}{' '}
        <button
          type="button"
          className="toggle-btn"
          onClick={() => setIsSignUp(prev => !prev)}
          disabled={loading}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>

      <div className="divider">OR</div>

      <button
        type="button"
        className="google-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continue with Google
      </button>
    </div>
  )
}
