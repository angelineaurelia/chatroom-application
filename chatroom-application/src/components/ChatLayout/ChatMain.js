// src/components/ChatLayout/ChatMain.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import MessageList from '../ChatRoom/MessageList'
import MessageInput from '../ChatRoom/MessageInput'
import {
  doc,
  onSnapshot,
  getDoc
} from 'firebase/firestore'
import { firestore }  from '../../firebase'
import AttachModal     from './AttachModal'
import './ChatLayout.css'

// 2. export ChatMain component
export default function ChatMain({ activeChat, toggleSidebar }) {
  const { currentUser } = useAuth()
  const [chatData, setChatData]       = useState(null)
  const [membersData, setMembersData] = useState([])
  const [showSearch, setShowSearch]   = useState(false)
  const [searchTerm, setSearchTerm]   = useState('')

  // 'media' = images/videos, 'gif' = Tenor GIFs
  const [attachModalOpen, setAttachModalOpen] = useState(false)
  const [attachTab, setAttachTab]             = useState('media')

  // load chatroom + members
  useEffect(() => {
    if (!activeChat) {
      setChatData(null)
      setMembersData([])
      setShowSearch(false)
      return
    }

    const roomRef = doc(firestore, 'chatrooms', activeChat)
    const unsubscribe = onSnapshot(roomRef, async snap => {
      if (!snap.exists()) return
      const data = snap.data()
      setChatData({ id: snap.id, ...data })

      const uids = Array.from(new Set(data.members || []))
      const profiles = await Promise.all(
        uids.map(async uid => {
          const userSnap = await getDoc(doc(firestore, 'users', uid))
          const base = userSnap.exists()
            ? (userSnap.data().name || userSnap.data().email)
            : 'Unknown'
          return {
            uid,
            name: uid === currentUser.uid ? `${base} (You)` : base
          }
        })
      )
      setMembersData(profiles)
    })

    return unsubscribe
  }, [activeChat, currentUser.uid])

  // placeholder UIs
  if (!activeChat) {
    return (
      <main className="chat-main empty">
        <p>Start a conversation</p>
      </main>
    )
  }
  if (!chatData) {
    return (
      <main className="chat-main empty">
        <p>Loading chat…</p>
      </main>
    )
  }

  // build the “Members: …” subtitle
  const ordered    = [
    ...membersData.filter(m => m.uid === currentUser.uid),
    ...membersData.filter(m => m.uid !== currentUser.uid)
  ]
  const names      = ordered.map(m => m.name)
  const firstThree = names.slice(0, 3)
  const subtitle   =
    names.length <= 3
      ? firstThree.join(', ')
      : `${firstThree.join(', ')} and ${names.length - 3} more`

  return (
    <>
      <main className="chat-main">
        <header className="chat-header">
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle chat list"
          >
            ☰
          </button>

          <div className="chat-header-left">
            <h2 className="chat-title">{chatData.name}</h2>
            <div className="chat-subtitle">{subtitle}</div>
          </div>

          <div className="chat-header-actions">
            <button
              className="search-msg-btn"
              onClick={() => {
                setShowSearch(v => !v)
                setSearchTerm('')
              }}
              aria-label="Search messages"
            >
              🔍
            </button>
          </div>
        </header>

        {showSearch && (
          <div className="chat-search-bar">
            <input
              type="text"
              placeholder="Search messages…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <section className="message-area">
          <MessageList roomId={activeChat} searchTerm={searchTerm} />
        </section>

        <footer className="chat-input">
          {/* open the AttachModal in 'media' tab */}
          <button
            className="chat-input-plus"
            aria-label="Attach image/video"
            onClick={() => {
              setAttachTab('media')
              setAttachModalOpen(true)
            }}
          >
            ＋
          </button>
          <MessageInput roomId={activeChat} />
        </footer>
      </main>

      {/* single modal with two tabs */}
      {attachModalOpen && (
        <AttachModal
          roomId={activeChat}
          initialTab={attachTab}
          onClose={() => setAttachModalOpen(false)}
        />
      )}
    </>
  )
}
