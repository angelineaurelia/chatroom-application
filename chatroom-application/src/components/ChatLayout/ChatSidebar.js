// src/components/ChatLayout/ChatSidebar.js

// 1. imports
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import './ChatLayout.css'

// 2. create ChatSidebar component
export default function ChatSidebar({ activeChat, setActiveChat }) {
  const { currentUser, logout } = useAuth()
  const [chatrooms, setChatrooms] = useState([])
  const navigate = useNavigate()

  // 3. fetch chatrooms on mount
  useEffect(() => {
    if (!currentUser) return
    const roomsRef = collection(firestore, 'chatrooms')
    const q = query(roomsRef, where('members', 'array-contains', currentUser.uid))
    const unsubscribe = onSnapshot(q, snap => {
      setChatrooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [currentUser])

  // 4. handle chatroom selection
  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed', err)
    }
  }
  
  // 5. render the sidebar
  return (
    <aside className="sidebar">
      {/* Profile + Logout */}
      <div className="sidebar-profile">
        <img src="/defaultAvatar.png" alt="Me" className="profile-pic"/>
        <div style={{ flex: 1 }}>
          <div className="profile-name">{currentUser.email}</div>
          <div className="profile-status">Online</div>
        </div>
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          title="Sign out"
        >
          ⎋
        </button>
      </div>

      {/* search */}
      <button className="sidebar-btn">🔍 Search Chatrooms</button>

      {/* chatrooms list */}
      <ul className="chatroom-list">
        {chatrooms.map(room => (
          <li
            key={room.id}
            className={activeChat === room.id ? 'active' : ''}
            onClick={() => setActiveChat(room.id)}
          >
            {room.name}
          </li>
        ))}
      </ul>

      {/* new Message */}
      <button className="new-message-btn">New Message +</button>
    </aside>
  )
}
