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
import './ChatRoom.css'

// 2. create MessageList component
export default function MessageList({ roomId }) {
  const [messages, setMessages] = useState([])
  const bottomRef = useRef()
  const { currentUser } = useAuth()

  // 3. fetch messages from firestore
  useEffect(() => {
    const messagesRef = collection(
      firestore, 'chatrooms', roomId, 'messages'
    )
    const q = query(messagesRef, orderBy('createdAt', 'asc'))
    return onSnapshot(q, snap => {
      setMessages(
        snap.docs.map(d => {
          const data = d.data()
          return {
            id: d.id,
            text: data.text,
            authorId: data.authorId,
            authorName: data.authorEmail.split('@')[0],
            authorPhotoURL: data.authorPhotoURL || '/defaultAvatar.png',
            createdAt: data.createdAt?.toDate() || new Date()
          }
        })
      )
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [roomId])

  // 4. format time
  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // 5. render the message list
  return (
    <div className="message-list">
      {/* date pill */}
      <div className="date-separator">Today</div>

      {messages.map(msg => {
        const isSelf = msg.authorId === currentUser.uid
        return (
          <div
            key={msg.id}
            className={`message-row ${isSelf ? 'self' : 'other'}`}
          >
            {/* avatar for others */}
            {!isSelf && (
              <img
                src={msg.authorPhotoURL}
                alt={msg.authorName}
                className="message-avatar"
              />
            )}

            {/* bubble */}
            <div className={`message-block ${isSelf ? 'self' : 'other'}`}>
              <div className="message-text">{msg.text}</div>
              <div className="message-meta">
                {formatTime(msg.createdAt)} • {msg.authorName}
              </div>
            </div>

            {/* spacer for self */}
            {isSelf && <div className="message-avatar-spacer" />}
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}
