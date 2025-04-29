// src/components/ChatLayout/ChatSidebar.js

// 1. imports
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import ChatCreateModal from './ChatCreateModal'
import UserProfileModal from './UserProfileModal'
import defaultAvatar from '../../assets/defaultAvatar.png'
import './ChatLayout.css'

// 2. create ChatSidebar component
export default function ChatSidebar({ activeChat, setActiveChat }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  const [chatrooms, setChatrooms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // 3. load chatrooms that include this user
  useEffect(() => {
    if (!currentUser) return
    const roomsRef = collection(firestore, 'chatrooms')
    const q = query(
      roomsRef,
      where('members', 'array-contains', currentUser.uid)
    )
    const unsub = onSnapshot(
      q,
      snap => setChatrooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Failed to load chatrooms:', err)
    )
    return unsub
  }, [currentUser])

  // 4. sign out
  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // 5. search chatrooms by name
  const filteredRooms = chatrooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <aside className="sidebar">
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
                onClick={() => setProfileModalOpen(true)}
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

      {/* chatroom list */}
      <ul className="chatroom-list">
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <li
              key={room.id}
              className={activeChat === room.id ? 'active' : ''}
              onClick={() => setActiveChat(room.id)}
            >
              {room.name}
            </li>
          ))
        ) : (
          <li className="no-results">No chatrooms found.</li>
        )}
      </ul>

      {/* new chatroom */}
      <button
        type="button"
        className="new-message-btn"
        onClick={() => setCreateModalOpen(true)}
      >
        New Message +
      </button>

      {/* modals */}
      <ChatCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </aside>
  )
}
