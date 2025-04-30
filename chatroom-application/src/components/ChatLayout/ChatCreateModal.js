// src/components/ChatLayout/ChatCreateModal.js

// 1. import
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { firestore, auth } from '../../firebase'
import './ChatLayout.css'

export default function ChatCreateModal({ isOpen, onClose }) {
  const me = auth.currentUser.uid

  const [name, setName]         = useState('')
  const [members, setMembers]   = useState([me])
  const [allUsers, setAllUsers] = useState([])
  const [saving, setSaving]     = useState(false)

  // 2. load all users when modal opens
  useEffect(() => {
    if (!isOpen) return
    async function fetchUsers() {
      const usersCol = collection(firestore, 'users')
      const snap     = await getDocs(usersCol)
      setAllUsers(
        snap.docs.map(d => ({
          uid:   d.id,
          name:  d.data().name || d.data().email.split('@')[0]
        }))
      )
    }
    fetchUsers()
  }, [isOpen])

  // 3. only the “other” users to invite
  const invitees = allUsers.filter(u => u.uid !== me)

  // 4. create the room
  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addDoc(
        collection(firestore, 'chatrooms'),
        {
          name,
          members,
          createdBy: me,
          createdAt: serverTimestamp()
        }
      )
      onClose()
    } catch (err) {
      console.error('Create chatroom failed', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card create-modal"
        onClick={e => e.stopPropagation()}
      >
        <header className="create-header">
          <h2>Create New Chatroom</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        <form className="create-body" onSubmit={handleCreate}>
          <label>
            Chatroom Name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter a name…"
              required
              disabled={saving}
            />
          </label>

          <label>
            Invite Members
            <div className="member-select">
              {invitees.map(u => (
                <button
                  key={u.uid}
                  type="button"
                  className={
                    'member-pill' +
                    (members.includes(u.uid) ? ' selected' : '')
                  }
                  onClick={() => {
                    setMembers(curr =>
                      curr.includes(u.uid)
                        ? curr.filter(id => id !== u.uid)
                        : [...curr, u.uid]
                    )
                  }}
                  disabled={saving}
                >
                  {u.name}
                </button>
              ))}
              {invitees.length === 0 && (
                <div className="no-results">
                  No other users to invite.
                </div>
              )}
            </div>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="pill secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pill primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
