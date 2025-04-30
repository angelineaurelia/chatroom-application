// src/components/ChatLayout/AttachModal.js

// 1. import
import React, { useState } from 'react'
import { createPortal }          from 'react-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL }    from 'firebase/storage'
import { firestore, storage }   from '../../firebase'
import './ChatLayout.css'

// 2. export
export default function AttachModal({ roomId, author, onClose }) {
  const [tab, setTab]         = useState('upload')    // or 'gif'
  const [file, setFile]       = useState(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const ext   = file.type.startsWith('video/') ? 'video' : 'image'
      const path  = `chatrooms/${roomId}/media/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      // write a message
      await addDoc(
        collection(firestore, 'chatrooms', roomId, 'messages'),
        {
          authorId:    author.uid,
          authorEmail: author.email,
          authorPhotoURL: author.photoURL || '',
          text:        '',           // no text
          mediaURL:    url,
          mediaType:   ext,          // 'image' or 'video'
          createdAt:   serverTimestamp()
        }
      )

      onClose()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  // 3. close modal on outside click
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card attach-modal" onClick={e => e.stopPropagation()}>
        {/* tabs */}
        <div className="attach-tabs">
          <button
            className={tab==='upload'? 'active' : ''}
            onClick={() => setTab('upload')}
          >
            Upload
          </button>
          <button
            className={tab==='gif'? 'active' : ''}
            onClick={() => setTab('gif')}
          >
            GIFs
          </button>
        </div>

        {tab === 'upload' && (
          <form className="attach-body" onSubmit={handleUpload}>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={e => setFile(e.target.files[0] || null)}
              disabled={uploading}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="pill secondary"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pill primary"
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading…' : 'Send'}
              </button>
            </div>
          </form>
        )}

        {tab === 'gif' && (
          <div className="attach-placeholder">
            {/* wire up tenor search here next */}
            <p>GIF search coming soon…</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
