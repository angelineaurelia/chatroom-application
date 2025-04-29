// src/components/ChatLayout/UserProfileModal.js

// // 1. imports
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile, updateEmail } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { firestore, storage, auth } from '../../firebase'
import './ChatLayout.css'
import defaultAvatar from '../../assets/defaultAvatar.png'

// 2. create UserProfileModal component
export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()

  // 3. state for each field
  const [profilePic, setProfilePic]   = useState('')
  const [newPicFile, setNewPicFile]   = useState(null)
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [address, setAddress]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [editingField, setEditingField] = useState(null)

  // 4. load user data when modal opens
  useEffect(() => {
    if (!isOpen) return
    setError('')
    setNewPicFile(null)
    setEditingField(null)

    // 5. auth fields
    setProfilePic(currentUser.photoURL || defaultAvatar)
    setName(currentUser.displayName || '')
    setEmail(currentUser.email || '')

    // 6. firestore fields
    ;(async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setPhone(data.phone || '')
          setAddress(data.address || '')
        }
      } catch (e) {
        console.error('Failed loading profile extras', e)
      }
    })()
  }, [isOpen, currentUser])

  // 7. save all changes
  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      const authUpdates = {}
      let updatedPicURL = currentUser.photoURL

      // photo upload
      if (newPicFile) {
        const imgRef = ref(storage, `users/${currentUser.uid}/profile`)
        await uploadBytes(imgRef, newPicFile)
        updatedPicURL = await getDownloadURL(imgRef)
        authUpdates.photoURL = updatedPicURL
      }

      // name change
      if (name.trim() && name !== currentUser.displayName) {
        authUpdates.displayName = name.trim()
      }

      // email change
      if (email.trim() && email !== currentUser.email) {
        await updateEmail(auth.currentUser, email.trim())
      }

      // apply auth profile updates
      if (Object.keys(authUpdates).length) {
        await updateProfile(auth.currentUser, authUpdates)
      }

      // update firestore user doc
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        name:    name.trim(),
        email:   email.trim(),
        phone:   phone.trim(),
        address: address.trim(),
        photoURL: updatedPicURL
      })

      onClose()
    } catch (err) {
      console.error('Profile save failed', err)
      setError('Save failed, please try again.')
    } finally {
      setSaving(false)
    }
  }

  // inline edit handler
  function startEditing(key) {
    if (!saving) setEditingField(key)
  }

  // render nothing if closed
  if (!isOpen) return null

  // define fields for list
  const fields = [
    { key: 'name',    label: 'Name',    value: name,    setter: setName,   type: 'text'  },
    { key: 'email',   label: 'Email',   value: email,   setter: setEmail,  type: 'email' },
    { key: 'phone',   label: 'Phone',   value: phone,   setter: setPhone,  type: 'text'  },
    { key: 'address', label: 'Address', value: address, setter: setAddress, type: 'text' }
  ]

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* header */}
        <header className="profile-header">
          <button type="button" className="back-btn" onClick={onClose}>←</button>
          <h2 className="profile-title">Profile</h2>
        </header>

        {/* avatar section */}
        <div className="profile-avatar-section">
          <img
            src={newPicFile ? URL.createObjectURL(newPicFile) : profilePic}
            alt="Profile"
            className="profile-avatar-large"
          />
          <button
            type="button"
            className="edit-photo-btn"
            onClick={() => document.getElementById('photo-input').click()}
          >
            Edit photo
          </button>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => setNewPicFile(e.target.files[0] || null)}
            disabled={saving}
          />
        </div>

        {/* error */}
        {error && <div className="modal-error">{error}</div>}

        {/* inline-editable list */}
        <ul className="profile-list">
          {fields.map(f => (
            <li
              key={f.key}
              className="profile-item"
              onClick={() => startEditing(f.key)}
            >
              <span className="item-label">{f.label}</span>
              <span className="item-value">
                {editingField === f.key ? (
                  <input
                    className="inline-input"
                    type={f.type}
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                  />
                ) : (
                  f.value || <em>Not set</em>
                )}
              </span>
              <span className="item-chevron">
                {editingField === f.key ? '✓' : '›'}
              </span>
            </li>
          ))}
        </ul>

        {/* actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
