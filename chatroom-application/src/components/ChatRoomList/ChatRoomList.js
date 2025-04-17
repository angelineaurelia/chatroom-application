// src/components/ChatRoomList/ChatRoomList.js

// 1. imports
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot, orderBy, serverTimestamp, addDoc } from 'firebase/firestore'
import { firestore } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import './ChatRoomList.css'

// 2. create ChatRoomList component
export default function ChatRoomList() {
  const { currentUser } = useAuth()
  const [chatrooms, setChatrooms] = useState([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // 3. fetch chatrooms from firestore
  useEffect(() => {
    if (!currentUser) return
    // Query rooms where currentUser is a member, ordered by creation time
    const roomsRef = collection(firestore, 'chatrooms')
    const q = query(
      roomsRef,
      where('members', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(q, snapshot => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setChatrooms(rooms)
    }, err => {
      console.error('Failed to load chatrooms:', err)
    })

    return unsubscribe
  }, [currentUser])

  // 4. reate a new chatroom with just the creator as member
  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) {
      setError('Room name cannot be empty.')
      return
    }
    setCreating(true)
    try {
      await addDoc(collection(firestore, 'chatrooms'), {
        name: newName.trim(),
        members: [currentUser.uid],
        createdAt: serverTimestamp()
      })
      setNewName('')
    } catch (err) {
      console.error('Error creating chatroom:', err)
      setError('Could not create room.')
    }
    setCreating(false)
  }

  return (
    <div className="chatroom-list">
      <h2>Available Chatrooms</h2>
      {error && <div className="error">{error}</div>}
      <ul>
        {chatrooms.length > 0 ? (
          chatrooms.map(room => (
            <li key={room.id}>
              <Link to={`/chatrooms/${room.id}`}>
                {room.name}
              </Link>
            </li>
          ))
        ) : (
          <li>No chatrooms yet—create one below.</li>
        )}
      </ul>

      <form className="new-room-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New room name…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          disabled={creating}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'Create Chatroom'}
        </button>
      </form>
    </div>
  )
}
