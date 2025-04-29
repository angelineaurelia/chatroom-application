// src/components/ChatLayout/ChatCreateModal.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '../../contexts/AuthContext'
import { firestore, storage } from '../../firebase'
import './ChatLayout.css'

// 2. create ChatCreateModal component
export default function ChatCreateModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const [allUsers, setAllUsers] = useState([])
  const [name, setName]         = useState('')
  const [members, setMembers]   = useState([])
  const [file, setFile]         = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')

  // 3. load users when the modal opens
  useEffect(() => {
    if (!isOpen) return
    async function fetchUsers() {
      try {
        const snap = await getDocs(collection(firestore, 'users'))
        setAllUsers(
          snap.docs.map(d => ({ uid: d.id, ...d.data() }))
        )
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }
    fetchUsers()
  }, [isOpen])

  function toggleMember(uid) {
    setMembers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  // 4. handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Chatroom name is required')
      return
    }
    setError('')
    setCreating(true)

    try {
      // 5. create the chatroom doc
      const roomRef = await addDoc(
        collection(firestore, 'chatrooms'),
        {
          name: name.trim(),
          members: [currentUser.uid, ...members],
          createdAt: serverTimestamp()
        }
      )

      // 6. upload avatar if provided
      if (file) {
        const imgRef = ref(storage, `chatrooms/${roomRef.id}/avatar`)
        await uploadBytes(imgRef, file)
        const url = await getDownloadURL(imgRef)
        await updateDoc(roomRef, { avatarURL: url })
      }

      // 7. reset & close
      setName('')
      setMembers([])
      setFile(null)
      onClose()
    } catch (err) {
      console.error('Error creating chatroom:', err)
      setError('Failed to create chatroom')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>Create New Chatroom</h2>
        {error && <div className="modal-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Picture (optional)
            <input
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files[0] || null)}
              disabled={creating}
            />
          </label>

          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={creating}
              required
            />
          </label>

          <fieldset>
            <legend>Invite Members</legend>
            {allUsers
              .filter(u => u.uid !== currentUser.uid)
              .map(u => (
                <label key={u.uid} className="invite-checkbox">
                  <input
                    type="checkbox"
                    checked={members.includes(u.uid)}
                    onChange={() => toggleMember(u.uid)}
                    disabled={creating}
                  />
                  {u.name || u.email}
                </label>
              ))}
            {allUsers.filter(u => u.uid !== currentUser.uid).length === 0 && (
              <p>No other registered users.</p>
            )}
          </fieldset>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
