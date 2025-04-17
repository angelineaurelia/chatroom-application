// src/components/ChatRoom/MessageList.js

// 1. imports
import React, { useEffect, useRef, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { firestore } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'

// 2. create MessageList component
export default function MessageList({ roomId }) {
  const [messages, setMessages] = useState([])
  const bottomRef = useRef()
  const { currentUser } = useAuth()

  // 3. fetch messages from firestore
  useEffect(() => {
    const messagesRef = collection(firestore, 'chatrooms', roomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
    return unsub
  }, [roomId])

  return (
    <div className="message-list">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={
            msg.authorId === currentUser.uid
              ? 'message message-self'
              : 'message'
          }
        >
          <div className="message-author">
            {msg.authorEmail.split('@')[0]}
          </div>
          <div className="message-text">{msg.text}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
