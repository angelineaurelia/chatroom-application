// src/App.js

// 1. imports
import React, { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'

import AuthForm      from './components/AuthForm/AuthForm'
import ChatRoomList  from './components/ChatRoomList/ChatRoomList'
import ChatRoom      from './components/ChatRoom/ChatRoom'
import { useAuth }   from './contexts/AuthContext'
import ChatLayout from './components/ChatLayout/ChatLayout'

// 2. create App component
function App() {
  const { currentUser } = useAuth()
  const isLoggedIn = !!currentUser

  // 3. request notification permission on mount
  useEffect(() => {
    if (
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission()
    }
  }, [])

  // 4. render the app
  return (
    <Router>
      <Routes>
        {/* public login / signup */}
        <Route path="/login" element={<AuthForm />} />

        {/* protected chat area */}
        <Route
          path="/chatrooms/*"
          element={
            currentUser
              ? <ChatLayout />
              : <Navigate to="/login" replace />
          }
        />

        {/* catch‐all: redirect based on auth state */}
        <Route
          path="*"
          element={
            currentUser
              ? <Navigate to="/chatrooms" replace />
              : <Navigate to="/login"     replace />
          }
        />
      </Routes>
    </Router>
  )
}


export default App

