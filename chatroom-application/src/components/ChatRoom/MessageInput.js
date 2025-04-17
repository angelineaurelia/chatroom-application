// src/components/ChatRoom/MessageInput.js

// 1. imports
import React, { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { firestore } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import sanitize from '../../utils/sanitize'

// 2. create MessageInput component
export default function MessageInput({ roomId }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const { currentUser } = useAuth()

  // 3. handle form submission
  const handleSubmit = async e => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await addDoc(
        collection(firestore, 'chatrooms', roomId, 'messages'),
        {
          text: sanitize(text),
          authorId: currentUser.uid,
          authorEmail: currentUser.email,
          createdAt: serverTimestamp()
        }
      )
      setText('')
    } catch (err) {
      console.error('Send failed:', err)
    }
    setSending(false)
  }

  // 4. render the message input form
  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message…"
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={sending}
      />
      <button type="submit" disabled={sending}>
        {sending ? '…' : 'Send'}
      </button>
    </form>
  )
}
