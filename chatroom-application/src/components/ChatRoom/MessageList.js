// src/components/ChatRoom/MessageList.js

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

export default function MessageList({
  roomId,
  roomName = 'Chat',
  searchTerm = ''
}) {
  const { currentUser } = useAuth()
  const [messages, setMessages]           = useState([])
  const [profiles, setProfiles]           = useState({})
  const [highlightedId, setHighlightedId] = useState(null)

  // ref to track which IDs we've already notified
  const prevIdsRef = useRef(new Set())

  // for auto-scroll
  const bottomRef = useRef()
  const msgRefs   = useRef({})

  // 1) subscribe to messages + fire notifications for fresh ones
  useEffect(() => {
    if (!roomId) {
      setMessages([])
      return
    }
    const msgsRef = collection(firestore, 'chatrooms', roomId, 'messages')
    const q = query(msgsRef, orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => {
        const data = d.data()
        return {
          id:        d.id,
          text:      data.text || '',
          mediaURL:  data.mediaURL || null,
          mediaType: data.mediaType || null,
          authorId:  data.authorId,
          createdAt: data.createdAt?.toDate() || new Date(),
          isDeleted: data.isDeleted || false
        }
      })

      // figure out which are brand-new
      const fresh = docs.filter(m => !prevIdsRef.current.has(m.id))

      // notify for each fresh message if appropriate
      if (
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        fresh.forEach(m => {
          if (m.authorId !== currentUser.uid) {
            new Notification(`New message in ${roomName}`, {
              body: m.text || '📨',
              tag: roomId
            })
          }
        })
      }

      // update the ref so we don't notify on the same ones again
      prevIdsRef.current = new Set(docs.map(m => m.id))

      // finally update state
      setMessages(docs)
    })

    return () => unsub()
  }, [roomId, roomName, currentUser.uid])

  // 2) auto-scroll to bottom on every new message
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages])

  // 3) lazy-load profile info for each author
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

  // 4) highlight search results
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

  // helper: wrap matching text in <mark>
  function renderHighlighted(text) {
    if (!searchTerm) return text
    const esc   = searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`(${esc})`, 'gi')
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    )
  }

  // unsend handler
  async function handleUnsend(messageId) {
    try {
      const refMsg = doc(
        firestore,
        'chatrooms',
        roomId,
        'messages',
        messageId
      )
      await updateDoc(refMsg, { isDeleted: true })
    } catch (err) {
      console.error('Unsend failed', err)
    }
  }

  // date-separator logic
  function getDateLabel(date) {
    const today   = new Date()
    const dDate   = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dToday  = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const diff    = (dToday - dDate) / (1000*60*60*24)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7)  return date.toLocaleDateString(undefined, { weekday: 'short' })
    const dd = String(date.getDate()).padStart(2,'0')
    const mm = String(date.getMonth()+1).padStart(2,'0')
    const yy = String(date.getFullYear()).slice(-2)
    return `${dd}/${mm}/${yy}`
  }
  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // interleave separators + messages
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

  // render
  return (
    <div className="message-list">
      {items.map(item =>
        item.type === 'separator' ? (
          <div className="date-separator" key={item.key}>
            {item.label}
          </div>
        ) : (
          (() => {
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
                {!isSelf && (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="message-avatar"
                  />
                )}

                <div
                  className={
                    `message-block ${isSelf ? 'self' : 'other'}`
                    + (msg.mediaURL && !msg.text ? ' media-only' : '')
                    + (isHighlight ? ' highlight' : '')
                  }
                >
                  {msg.isDeleted ? (
                    <div className="message-text deleted">
                      <em>{profile.name} unsent a message</em>
                    </div>
                  ) : msg.mediaURL ? (
                    msg.mediaType === 'video' ? (
                      <video
                        src={msg.mediaURL}
                        controls
                        className="message-media"
                      />
                    ) : (
                      <img
                        src={msg.mediaURL}
                        alt="attachment"
                        className="message-media"
                      />
                    )
                  ) : (
                    <>
                      <div className="message-text">
                        {renderHighlighted(msg.text)}
                      </div>
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

                {isSelf && <div className="message-avatar-spacer" />}
              </div>
            )
          })()
        )
      )}
      <div ref={bottomRef} />
    </div>
  )
}
