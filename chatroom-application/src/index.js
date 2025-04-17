// src/index.js
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './firebase'
import { AuthProvider } from './contexts/AuthContext'

const container = document.getElementById('root')
const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
