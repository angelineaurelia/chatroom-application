// src/components/ChatLayout/UserProfileModal.js

// 1. import
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile, updateEmail } from 'firebase/auth'
import { useAuth } from '../../contexts/AuthContext'
import { firestore, storage, auth } from '../../firebase'
import './ChatLayout.css'
import defaultAvatar from '../../assets/defaultAvatar.png'

// 2. export UserProfileModal component
export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser } = useAuth()

  // form state
  const [profilePic, setProfilePic]     = useState('')
  const [newPicFile, setNewPicFile]     = useState(null)
  const [name, setName]                 = useState('')
  const [email, setEmail]               = useState('')
  const [phone, setPhone]               = useState('')
  const [address, setAddress]           = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [editingField, setEditingField] = useState(null)

  // original values for dirty‐checking
  const [origPhotoURL, setOrigPhotoURL] = useState('')
  const [origName, setOrigName]         = useState('')
  const [origEmail, setOrigEmail]       = useState('')
  const [origPhone, setOrigPhone]       = useState('')
  const [origAddress, setOrigAddress]   = useState('')

  // load on open
  useEffect(() => {
    if (!isOpen) return
    setError('')
    setNewPicFile(null)
    setEditingField(null)

    // 3. auth fields
    const photoURL = currentUser.photoURL || defaultAvatar
    const dispName = currentUser.displayName || ''
    const mail     = currentUser.email || ''

    setProfilePic(photoURL)
    setName(dispName)
    setEmail(mail)

    setOrigPhotoURL(photoURL)
    setOrigName(dispName)
    setOrigEmail(mail)

    // 4. firestore extras
    ;(async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', currentUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          const ph = data.phone || ''
          const ad = data.address || ''
          setPhone(ph)
          setAddress(ad)
          setOrigPhone(ph)
          setOrigAddress(ad)
        } else {
          setPhone('')
          setAddress('')
          setOrigPhone('')
          setOrigAddress('')
        }
      } catch (e) {
        console.error('Failed loading profile extras', e)
      }
    })()
  }, [isOpen, currentUser])

  // dirty‐check
  const isDirty =
    !!newPicFile ||
    name.trim()    !== origName   ||
    email.trim()   !== origEmail  ||
    phone.trim()   !== origPhone  ||
    address.trim() !== origAddress

  // save handler
  async function handleSave(e) {
    e.preventDefault()
    if (!isDirty) return

    // client-side validation
    const phoneTrim = phone.trim()
    if (phoneTrim && !/^\+?[0-9]{7,15}$/.test(phoneTrim)) {
      setError('Please enter a valid phone number (7-15 digits, optional +).')
      return
    }
    const addressTrim = address.trim()
    if (addressTrim && addressTrim.length < 5) {
      setError('Please enter a valid address (at least 5 characters).')
      return
    }

    setSaving(true)
    setError('')

    try {
      const authUpdates = {}
      let updatedPicURL = currentUser.photoURL

      // upload new picture
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

      // apply Auth updates
      if (Object.keys(authUpdates).length) {
        await updateProfile(auth.currentUser, authUpdates)
      }

      // update Firestore
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        name:     name.trim(),
        email:    email.trim(),
        phone:    phoneTrim,
        address:  addressTrim,
        photoURL: updatedPicURL
      })

      onClose()
      // reload so AuthContext sees new displayName/photoURL
      window.location.reload()
    } catch (err) {
      console.error('Profile save failed', err)
      setError('Save failed, please try again.')
      setSaving(false)
    }
  }

  function startEditing(key) {
    if (!saving) setEditingField(key)
  }

  if (!isOpen) return null

  // field definitions, with phone validation attributes
  const fields = [
    { key: 'name',    label: 'Name',    value: name,    setter: setName,    type: 'text'  },
    { key: 'email',   label: 'Email',   value: email,   setter: setEmail,   type: 'email' },
    {
      key:    'phone',
      label:  'Phone',
      value:  phone,
      setter: setPhone,
      type:   'text',
    },
    { key: 'address', label: 'Address', value: address, setter: setAddress, type: 'text' }
  ]

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSave}
        noValidate
      >
        <header className="profile-header">
          <button type="button" className="back-btn" onClick={onClose}>
            ←
          </button>
          <h2 className="profile-title">Profile</h2>
        </header>

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
            disabled={saving}
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

        {error && <div className="modal-error">{error}</div>}

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
                    pattern={f.pattern}
                    title={f.title}
                    value={f.value}
                    onChange={e => f.setter(e.target.value)}
                    onBlur={() => setEditingField(null)}
                    autoFocus
                    disabled={saving}
                    required={f.key === 'phone'}
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
            disabled={!isDirty || saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
