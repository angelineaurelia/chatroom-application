// src/components/ChatRoomList/ChatRoomList.js

// 1. imports
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { firestore } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import './ChatRoomList.css'

// 2. create ChatRoomList component
export default function ChatRoomList() {
  const { currentUser } = useAuth()
  const [chatrooms, setChatrooms] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // 3. fetch chatrooms from firestore
  useEffect(() => {
    if (!currentUser) return
    const roomsRef = collection(firestore, 'chatrooms')
    const q = query(roomsRef, where('members', 'array-contains', currentUser.uid))
    const unsubscribe = onSnapshot(q, snap => {
      setChatrooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [currentUser])

  // 4. load all users (including current user)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(firestore, 'users'))
        setAllUsers(
          snap.docs.map(d => ({
            uid: d.id,
            email: d.data().email
          }))
        )
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    if (currentUser) fetchUsers()
  }, [currentUser])

  function toggleMember(uid) {
    setSelectedMembers(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    )
  }

  // 5. create a new chatroom
  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) {
      setError('Chatroom name is required.')
      return
    }
    setCreating(true)
    try {
      await addDoc(collection(firestore, 'chatrooms'), {
        name: roomName.trim(),
        members: [currentUser.uid, ...selectedMembers],
        createdAt: serverTimestamp()
      })
      setRoomName('')
      setSelectedMembers([])
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating chatroom:', err)
      setError('Could not create chatroom.')
    }
    setCreating(false)
  }

  // 6. filter out currentuser for the invite list
  const inviteOptions = allUsers.filter(u => u.uid !== currentUser.uid)

  // 7. render the chatroom list
  return (
    <div className="chatroom-list-container">
      <aside className="sidebar">
        <button
          className="new-room-btn"
          onClick={() => setShowCreateForm(v => !v)}
        >
          New +
        </button>

        {showCreateForm && (
          <form className="create-room-form" onSubmit={handleCreate}>
            {error && <div className="error">{error}</div>}

            <input
              type="text"
              placeholder="Chatroom name"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              disabled={creating}
            />

            <fieldset className="invite-list">
              <legend>Invite members (optional):</legend>

              {inviteOptions.length === 0 ? (
                <div>No other registered users.</div>
              ) : (
                inviteOptions.map(user => (
                  <label key={user.uid}>
                    <input
                      type="checkbox"
                      value={user.uid}
                      checked={selectedMembers.includes(user.uid)}
                      onChange={() => toggleMember(user.uid)}
                      disabled={creating}
                    />
                    {user.email}
                  </label>
                ))
              )}
            </fieldset>

            <button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Chatroom'}
            </button>
          </form>
        )}

        <ul className="room-list">
          {chatrooms.map(room => {
            // dedupe UIDs
            const uniqueUids = Array.from(new Set(room.members))
            return (
              <li key={room.id}>
                <Link to={`/chatrooms/${room.id}`}>{room.name}</Link>
                <div className="room-members">
                  Members:{' '}
                  {uniqueUids
                    .map(uid => {
                      const user = allUsers.find(u => u.uid === uid)
                      if (!user) return uid
                      return `${user.email}${
                        uid === currentUser.uid ? ' (Me)' : ''
                      }`
                    })
                    .join(', ')}
                </div>
              </li>
            )
          })}
        </ul>
      </aside>

      <main className="main-view">
        <p>Select or create a chatroom to get started.</p>
      </main>
    </div>
  )
}
