// src/components/ChatLayout/ChatLayout.js

// 1. import
import React, { useState, useEffect } from 'react'
import ChatSidebar      from './ChatSidebar'
import ChatMain         from './ChatMain'
import ChatCreateModal  from './ChatCreateModal'
import UserProfileModal from './UserProfileModal'
import './ChatLayout.css'

export default function ChatLayout() {
  const [activeChat, setActiveChat]     = useState(null)   // which chat is active
  const [sidebarOpen, setSidebarOpen]   = useState(false)  // sidebar open/closed on mobile

  // modals
  const [createModalOpen, setCreateModalOpen]   = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // whenever there is no activeChat, force the sidebar open
  // on mount activeChat === null, so on mobile list is open immediately
  useEffect(() => {
    if (!activeChat) {
      setSidebarOpen(true)
    }
  }, [activeChat])

  return (
    <div className={`chat-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <ChatSidebar
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenCreate={() => setCreateModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      <ChatMain
        activeChat={activeChat}
        toggleSidebar={() => setSidebarOpen(o => !o)}
        openCreate={() => setCreateModalOpen(true)}
        openProfile={() => setProfileModalOpen(true)}
      />

      <ChatCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  )
}
