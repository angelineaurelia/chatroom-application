// src/components/ChatRoom/MessageList.js

// 1. imports
import React, { useEffect, useRef, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import './ChatRoom.css'
import defaultAvatar from '../../assets/defaultAvatar.png'

// 2. create MessageList component
export default function MessageList({ roomId }) {
  const { currentUser } = useAuth()
  const [messages, setMessages]   = useState([])
  const [profiles, setProfiles]   = useState({})
  const bottomRef                 = useRef()

  // 3. subscribe to messages
  useEffect(() => {
    if (!roomId) return
    const messagesRef = collection(
      firestore,
      'chatrooms',
      roomId,
      'messages'
    )
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(q, snap => {
      const msgs = snap.docs.map(doc => {
        const d = doc.data()
        return {
          id: doc.id,
          text: d.text,
          authorId: d.authorId,
          createdAt: d.createdAt?.toDate() || new Date()
        }
      })
      setMessages(msgs)
      // 4. scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })

    return unsubscribe
  }, [roomId])

  // 5. fetch profiles for any new authorIds
  useEffect(() => {
    const uids = Array.from(new Set(messages.map(m => m.authorId)))
    uids.forEach(uid => {
      if (profiles[uid]) return // already have it
      if (uid === currentUser.uid) {
        // use currentUser data
        setProfiles(p => ({
          ...p,
          [uid]: {
            name: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || defaultAvatar
          }
        }))
      } else {
        // 6. fetch from Firestore
        getDoc(doc(firestore, 'users', uid)).then(snap => {
          if (snap.exists()) {
            const d = snap.data()
            setProfiles(p => ({
              ...p,
              [uid]: {
                name: d.name || d.email.split('@')[0],
                photoURL: d.photoURL || defaultAvatar
              }
            }))
          } else {
            setProfiles(p => ({
              ...p,
              [uid]: { name: 'Unknown', photoURL: defaultAvatar }
            }))
          }
        })
      }
    })
  }, [messages, currentUser, profiles])

  // 7. helpers for date labels
  function getDateLabel(date) {
    const today = new Date()
    const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffMs = dToday - dDate
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' })
    }
    // dd/mm/yy
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${dd}/${mm}/${yy}`
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // 8. build a mixed array of separators + message items
  const items = []
  let lastLabel = null
  messages.forEach(msg => {
    const label = getDateLabel(msg.createdAt)
    if (label !== lastLabel) {
      items.push({ type: 'separator', key: `sep-${msg.id}`, label })
      lastLabel = label
    }
    items.push({ type: 'message', key: msg.id, msg })
  })

  return (
    <div className="message-list">
      {items.map(item => {
        if (item.type === 'separator') {
          return (
            <div className="date-separator" key={item.key}>
              {item.label}
            </div>
          )
        }

        const { msg } = item
        const isSelf = msg.authorId === currentUser.uid
        const profile = profiles[msg.authorId] || {
          name: '',
          photoURL: defaultAvatar
        }

        return (
          <div
            key={msg.id}
            className={`message-row ${isSelf ? 'self' : 'other'}`}
          >
            {/* avatar for others */}
            {!isSelf && (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="message-avatar"
              />
            )}

            <div
              className={`message-block ${isSelf ? 'self' : 'other'}`}
            >
              <div className="message-text">{msg.text}</div>
              <div className="message-meta">
                {formatTime(msg.createdAt)} • {profile.name}
              </div>
            </div>

            {/* spacer for alignment */}
            {isSelf && <div className="message-avatar-spacer" />}
          </div>
        )
      })}

      <div ref={bottomRef} />
    </div>
  )
}