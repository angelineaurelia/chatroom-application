// src/components/ChatLayout/ChatMain.js

// 1. import
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import MessageList from '../ChatRoom/MessageList'
import MessageInput from '../ChatRoom/MessageInput'
import { doc, onSnapshot, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL }             from 'firebase/storage'
import { firestore, storage }                           from '../../firebase'
import AttachModal                                      from './AttachModal'
import './ChatLayout.css'

// 2. export
export default function ChatMain({ activeChat, toggleSidebar }) {
  const { currentUser } = useAuth()
  const [chatData, setChatData]         = useState(null)
  const [membersData, setMembersData]   = useState([])
  const [showSearch, setShowSearch]     = useState(false)
  const [searchTerm, setSearchTerm]     = useState('')
  const [showAttach, setShowAttach] = useState(false)

  // 3. load chatroom data
  useEffect(() => {
    if (!activeChat) {
      setChatData(null)
      setMembersData([])
      setSearchTerm('')
      setShowSearch(false)
      return
    }

    const roomRef = doc(firestore, 'chatrooms', activeChat)
    const unsubscribe = onSnapshot(roomRef, async snap => {
      if (!snap.exists()) return
      const data = snap.data()
      setChatData({ id: snap.id, ...data })

      // dedupe UIDs
      const uids = Array.from(new Set(data.members || []))
      // fetch user profiles
      const profiles = await Promise.all(
        uids.map(async uid => {
          const userSnap = await getDoc(doc(firestore, 'users', uid))
          if (userSnap.exists()) {
            const u = userSnap.data()
            const baseName = u.name || u.email || 'Unknown'
            return {
              uid,
              name:
                uid === currentUser.uid
                  ? `${baseName} (You)`
                  : baseName
            }
          }
          return {
            uid,
            name: uid === currentUser.uid ? '(You)' : 'Unknown'
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

  // build subtitle
  const ordered = [
    ...membersData.filter(m => m.uid === currentUser.uid),
    ...membersData.filter(m => m.uid !== currentUser.uid)
  ]
  const names = ordered.map(m => m.name)
  const firstThree = names.slice(0, 3)
  const subtitle =
    names.length <= 3
      ? firstThree.join(', ')
      : `${firstThree.join(', ')} and ${names.length - 3} more`

  return (
    <main className="chat-main">
      <header className="chat-header">
        {/* mobile “hamburger” */}
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

        {/* search‐for‐message button */}
        <div className="chat-header-actions">
          <button
            className="search-msg-btn"
            onClick={() => {
              setShowSearch(show => !show)
              setSearchTerm('')
            }}
            aria-label="Search messages"
          >
            🔍
          </button>
        </div>
      </header>

      {/* search bar (toggles open) */}
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

      {/* messages, pass searchTerm down */}
      <section className="message-area">
        <MessageList roomId={activeChat} searchTerm={searchTerm} />
      </section>

      {/* input */}
      <footer className="chat-input">
        <button
          className="chat-input-plus"
          aria-label="Attach media"
          onClick={() => setShowAttach(true)}
        >
          ＋
        </button>
        <MessageInput roomId={activeChat} />
      </footer>

      {showAttach && (
        <AttachModal
          roomId={activeChat}
          onClose={() => setShowAttach(false)}
          author={currentUser}
        />
      )}
    </main>
  )
}
