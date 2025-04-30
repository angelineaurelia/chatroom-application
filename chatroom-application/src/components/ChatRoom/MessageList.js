// src/components/ChatRoom/MessageList.js

// 1. imports
import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect
} from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import defaultAvatar from '../../assets/defaultAvatar.png'
import './ChatRoom.css'

// 2. export MessageList component
export default function MessageList({ roomId, searchTerm = '' }) {
  const { currentUser } = useAuth()
  const [messages, setMessages]           = useState([])
  const [profiles, setProfiles]           = useState({})
  const [highlightedId, setHighlightedId] = useState(null)
  const bottomRef = useRef()
  const msgRefs   = useRef({})

  // 3. subscribe to messages
  useEffect(() => {
    if (!roomId) {
      setMessages([])
      return
    }
    const msgsRef = collection(firestore, 'chatrooms', roomId, 'messages')
    const q = query(msgsRef, orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => {
        const data = d.data()
        return {
          id:         d.id,
          text:       data.text || '',
          mediaURL:   data.mediaURL || null,
          mediaType:  data.mediaType || null,  // 'image' or 'video'
          authorId:   data.authorId,
          createdAt:  data.createdAt?.toDate() || new Date(),
          isDeleted:  data.isDeleted || false
        }
      })
      setMessages(msgs)
    })
    return () => unsub()
  }, [roomId])

  // 4. scroll to bottom on new messages
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages])

  // 5. lazy-load profile info
  useEffect(() => {
    const uids = Array.from(new Set(messages.map(m => m.authorId)))
    uids.forEach(uid => {
      if (profiles[uid]) return
      if (uid === currentUser.uid) {
        setProfiles(p => ({
          ...p,
          [uid]: {
            name:     currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL    || defaultAvatar
          }
        }))
      } else {
        getDoc(doc(firestore, 'users', uid)).then(snap => {
          if (snap.exists()) {
            const u = snap.data()
            setProfiles(p => ({
              ...p,
              [uid]: {
                name:     u.name     || u.email.split('@')[0],
                photoURL: u.photoURL || defaultAvatar
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

  // 6. highlight search results
  useEffect(() => {
    if (!searchTerm) {
      setHighlightedId(null)
      return
    }
    const lower = searchTerm.toLowerCase()
    const match = messages.find(
      m => !m.isDeleted && m.text.toLowerCase().includes(lower)
    )
    if (match) {
      setHighlightedId(match.id)
      const el = msgRefs.current[match.id]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setHighlightedId(null)
    }
  }, [searchTerm, messages])

  // 7. helper to wrap matching text in <mark>
  function renderHighlighted(text) {
    if (!searchTerm) return text
    const esc   = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`(${esc})`, 'gi')
    return text.split(regex).map((part,i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    )
  }

  // 8. unsend (mark deleted)
  async function handleUnsend(messageId) {
    try {
      const refMsg = doc(firestore, 'chatrooms', roomId, 'messages', messageId)
      await updateDoc(refMsg, { isDeleted: true })
    } catch (err) {
      console.error('Unsend failed', err)
    }
  }

  // 9. date‐separator logic
  function getDateLabel(date) {
    const today   = new Date()
    const dDate   = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dToday  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diffDays = (dToday - dDate) / (1000 * 60 * 60 * 24)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7)  return date.toLocaleDateString(undefined, { weekday: 'short' })
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${dd}/${mm}/${yy}`
  }
  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // 10. interleave date separators
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

  // 11. render
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
        const isSelf  = msg.authorId === currentUser.uid
        const profile = profiles[msg.authorId] || {
          name:     '',
          photoURL: defaultAvatar
        }
        const isHighlight = msg.id === highlightedId

        return (
          <div
            key={msg.id}
            ref={el => (msgRefs.current[msg.id] = el)}
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

            {/* bubble */}
            <div
              className={
                `message-block ${isSelf ? 'self' : 'other'}` +
                (msg.mediaURL && !msg.text ? ' media-only' : '') +
                (isHighlight ? ' highlight' : '')
              }
            >
              {msg.isDeleted ? (
                <div className="message-text deleted">
                  <em>{profile.name} unsent a message</em>
                </div>
              ) : (
                <>
                  {/* media or text */}
                  {msg.mediaURL ? (
                    msg.mediaType === 'video' ? (
                      <video
                        src={msg.mediaURL}
                        controls
                        className="message-media"
                      />
                    ) : msg.mediaType === 'gif' ? (
                      <img src={msg.mediaURL} alt="GIF" className="message-media" />
                    ) : (
                      <img
                        src={msg.mediaURL}
                        alt="attachment"
                        className="message-media"
                      />
                    )
                  ) : (
                    <div className="message-text">
                      {renderHighlighted(msg.text)}
                    </div>
                  )}

                  {/* inline meta + Unsend */}
                  <div className="message-meta">
                    {formatTime(msg.createdAt)} • {profile.name}
                    {isSelf && (
                      <> • 
                        <button
                          className="unsend-meta-btn"
                          onClick={() => handleUnsend(msg.id)}
                        >
                          Unsend
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
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
