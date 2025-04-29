// src/components/ChatLayout/ChatMain.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import MessageList from '../ChatRoom/MessageList'
import MessageInput from '../ChatRoom/MessageInput'
import './ChatLayout.css'

// 2. create ChatMain component
export default function ChatMain({ activeChat, toggleSidebar }) {
  const { currentUser } = useAuth()
  const [chatData, setChatData]     = useState(null)
  const [membersData, setMembersData] = useState([])

  useEffect(() => {
    if (!activeChat) {
      setChatData(null)
      setMembersData([])
      return
    }

    const roomRef = doc(firestore, 'chatrooms', activeChat)
    const unsubscribe = onSnapshot(roomRef, async snap => {
      if (!snap.exists()) return
      const data = snap.data()
      setChatData({ id: snap.id, ...data })

      // 3. dedupe UIDs
      const uids = Array.from(new Set(data.members || []))
      // 4. fetch user profiles
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

  // 5. placeholder UIs
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

  // 6. build subtitle: up to 3 names, then “and N more”
  const orderedMembers = [
    ...membersData.filter(m => m.uid === currentUser.uid),
    ...membersData.filter(m => m.uid !== currentUser.uid)
  ]
  const names = orderedMembers.map(m => m.name)
  const firstThree = names.slice(0, 3)
  const subtitle =
    names.length <= 3
      ? firstThree.join(', ')
      : `${firstThree.join(', ')} and ${names.length - 3} more`

  // 7. render the main chat area
  return (
    <main className="chat-main">
      {/* header */}
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
      </header>

      {/* messages */}
      <section className="message-area">
        <MessageList roomId={activeChat} />
      </section>

      {/* input */}
      <footer className="chat-input">
        <button className="chat-input-plus" aria-label="More actions">
          ＋
        </button>
        <MessageInput roomId={activeChat} />
      </footer>
    </main>
  )
}
