// src/components/ChatRoom/MessageList.js

// 1. imports
import React, { useEffect, useRef, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { firestore } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'

// 2. create MessageList component
export default function MessageList({ roomId }) {
  const [messages, setMessages] = useState([])
  const bottomRef = useRef()
  const { currentUser } = useAuth()
  const prevMessagesRef = useRef([])  // store previous messages

  // 3. request notification permission on mount
  useEffect(() => {
    const messagesRef = collection(firestore, 'chatrooms', roomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, snapshot => {
      const newMsgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(newMsgs)

      // 4. auto-scroll
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

      // 5. determine which messages are new:
      const prev = prevMessagesRef.current
      const prevIds = new Set(prev.map(m => m.id))
      const fresh = newMsgs.filter(m => !prevIds.has(m.id))

      // 6. notify for each fresh message sent by someone else
      fresh.forEach(msg => {
        if (msg.authorId !== currentUser.uid && 'Notification' in window) {
          // only if permission granted
          if (Notification.permission === 'granted') {
            new Notification(`New message in ${roomId}`, {
              body: `${msg.authorEmail.split('@')[0]}: ${msg.text}`,
              tag: `${roomId}-${msg.id}`
            })
          }
        }
      })

      // update ref
      prevMessagesRef.current = newMsgs
    })

    return unsubscribe
  }, [roomId, currentUser])

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
