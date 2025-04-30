// src/components/ChatLayout/ChatSidebar.js

// 1. import
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import defaultAvatar from '../../assets/defaultAvatar.png'
import './ChatLayout.css'

export default function ChatSidebar({
  activeChat,
  setActiveChat,
  isOpen,
  onClose,
  onOpenCreate,
  onOpenProfile
}) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const [chatrooms, setChatrooms]       = useState([])
  const [searchTerm, setSearchTerm]     = useState('')
  const [lastMessages, setLastMessages] = useState({})

  // 4. load all rooms you belong to
  useEffect(() => {
    if (!currentUser) return
    const roomsRef = collection(firestore, 'chatrooms')
    const q = query(
      roomsRef,
      where('members', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setChatrooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [currentUser])

  // 5. for each room, listen to its latest message
  useEffect(() => {
    const unsubscribes = []
    chatrooms.forEach(room => {
      const msgsRef = collection(
        firestore,
        'chatrooms',
        room.id,
        'messages'
      )
      const recentQuery = query(
        msgsRef,
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const unsub = onSnapshot(recentQuery, async snap => {
        if (!snap.empty) {
          const data = snap.docs[0].data()
          const at = data.createdAt?.toDate() || null
          const isDeleted = data.isDeleted || false

          // fetch author name
          let authorName = ''
          try {
            const userSnap = await getDoc(
              doc(firestore, 'users', data.authorId)
            )
            if (userSnap.exists()) {
              const u = userSnap.data()
              authorName = u.name || u.email.split('@')[0]
            }
          } catch {
            // ignore
          }

          setLastMessages(prev => ({
            ...prev,
            [room.id]: { text: data.text, at, isDeleted, authorName }
          }))
        }
      })
      unsubscribes.push(unsub)
    })
    return () => unsubscribes.forEach(fn => fn())
  }, [chatrooms])

  // format HH:mm
  const fmtTime = date =>
    date
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ''

  // filter by name
  const filtered = chatrooms.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // logout
  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* profile */}
      <div className="sidebar-profile">
        <img
          src={currentUser.photoURL || defaultAvatar}
          alt={currentUser.displayName || currentUser.email}
          className="profile-pic"
        />
        <div className="profile-info">
          <div className="profile-name">
            {currentUser.displayName || currentUser.email}
          </div>
          <div className="profile-subinfo">
            <span className="profile-status">Online</span>
            <div className="profile-actions">
              <button
                type="button"
                className="profile-edit-btn"
                onClick={onOpenProfile}
                title="Edit Profile"
              >
                ✎
              </button>
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                title="Sign Out"
              >
                ⎋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* search */}
      <input
        type="text"
        className="sidebar-search"
        placeholder="🔍 Search chatrooms…"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {/* room list */}
      <ul className="chatroom-list">
        {filtered.length > 0 ? (
          filtered.map(room => {
            const last = lastMessages[room.id] || {}
            const isActive = room.id === activeChat

            return (
              <li
                key={room.id}
                className={isActive ? 'active' : ''}
                onClick={() => {
                  setActiveChat(room.id)
                  onClose()    /* hide sidebar on mobile */
                }}
              >
                <div className="room-heading">{room.name}</div>

                {last.at && (
                  <div className="room-subheading">
                    <span className="room-last-text">
                      {last.isDeleted
                        ? `${last.authorName} unsent a message`
                        : last.text.length > 30
                        ? last.text.slice(0, 30) + '…'
                        : last.text}
                    </span>
                    <span className="room-last-time">
                      {fmtTime(last.at)}
                    </span>
                  </div>
                )}
              </li>
            )
          })
        ) : (
          <li className="no-results">No chatrooms found.</li>
        )}
      </ul>

      {/* new Chat */}
      <button
        type="button"
        className="new-message-btn"
        onClick={onOpenCreate}
      >
        New Message +
      </button>
    </aside>
  )
}
