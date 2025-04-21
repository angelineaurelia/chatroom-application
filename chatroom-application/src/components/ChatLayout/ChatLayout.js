// src/components/ChatLayout/ChatLayout.js

// 1. imports
import React, { useState } from 'react'
import ChatSidebar from './ChatSidebar'
import ChatMain    from './ChatMain'
import ChatDetails from './ChatDetails'
import './ChatLayout.css'

// 2. create ChatLayout component
export default function ChatLayout() {
  const [activeChat, setActiveChat] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="chat-layout">
      <ChatSidebar
        activeChat={activeChat}
        setActiveChat={setActiveChat}
      />
      <ChatMain
        activeChat={activeChat}
        openDetails={() => setDetailsOpen(true)}
      />
      <ChatDetails
        isOpen={detailsOpen}
        activeChat={activeChat}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  )
}
