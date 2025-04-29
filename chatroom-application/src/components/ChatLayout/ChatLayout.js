// src/components/ChatLayout/ChatLayout.js

// 1. imports
import React, { useState, useEffect } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatMain    from './ChatMain'
import './ChatLayout.css'

export default function ChatLayout() {
  const [activeChat, setActiveChat] = useState(null) // currently open chat room ID
  const [showSidebar, setShowSidebar] = useState( // sidebar visibility
    window.innerWidth > 768
  )

  // 2. keep sidebar visible on desktop, hide/leave as-is on mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setShowSidebar(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 3. toggle sidebar
  const toggleSidebar = () => setShowSidebar(v => !v)

  return (
    <div className={`chat-layout ${showSidebar ? 'sidebar-open' : ''}`}>
      <ChatSidebar
        activeChat={activeChat}
        setActiveChat={chatId => {
          setActiveChat(chatId)
          // on mobile, auto‐close sidebar when pick a chat
          if (window.innerWidth <= 768) setShowSidebar(false)
        }}
      />
      <ChatMain
        activeChat={activeChat}
        toggleSidebar={toggleSidebar}
      />
    </div>
  )
}
