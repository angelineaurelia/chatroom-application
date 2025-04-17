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
        <Route path="/login" element={<AuthForm onSubmit={() => {}} />} />
        <Route
          path="/chatrooms"
          element={isLoggedIn ? <ChatRoomList /> : <Navigate to="/login" />}
        />
        <Route
          path="/chatrooms/:id"
          element={isLoggedIn ? <ChatRoom /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App

