// src/components/ChatLayout/ChatCreateModal.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firestore, storage } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import './ChatLayout.css'

// 2. create ChatCreateModal component
export default function ChatCreateModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const [allUsers, setAllUsers] = useState([])
  const [name, setName] = useState('')
  const [members, setMembers] = useState([])
  const [file, setFile] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // 3. load users for invite
  useEffect(() => {
    async function fetch() {
      const snap = await firestore.collection('users').get()
      setAllUsers(
        snap.docs.map(d => ({
          uid: d.id,
          email: d.data().email
        }))
      )
    }
    if (isOpen) fetch()
  }, [isOpen])

  // 4. toggle member selection
  function toggleMember(uid) {
    setMembers(ms => (ms.includes(uid) ? ms.filter(x => x !== uid) : [...ms, uid]))
  }

  // 5. handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name required')
    setCreating(true)
    try {
      // 6. create room doc
      const roomRef = await addDoc(collection(firestore, 'chatrooms'), {
        name: name.trim(),
        members: [currentUser.uid, ...members],
        createdAt: serverTimestamp()
      })
      // 7. if file, upload to Storage
      if (file) {
        const imgRef = ref(storage, `chatrooms/${roomRef.id}/avatar`)
        await uploadBytes(imgRef, file)
        const url = await getDownloadURL(imgRef)
        await updateDoc(roomRef, { avatarURL: url })
      }
      // 8. reset & close
      setName(''); setMembers([]); setFile(null)
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not create room')
    }
    setCreating(false)
  }

  if (!isOpen) return null

  // 9. render the modal
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
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
            {allUsers.length === 0 && <p>No users found.</p>}
            {allUsers
              .filter(u => u.uid !== currentUser.uid)
              .map(u => (
                <label key={u.uid} className="invite-checkbox">
                  <input
                    type="checkbox"
                    value={u.uid}
                    checked={members.includes(u.uid)}
                    onChange={() => toggleMember(u.uid)}
                    disabled={creating}
                  />
                  {u.email}
                </label>
              ))}
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
