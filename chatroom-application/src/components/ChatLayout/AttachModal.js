// src/components/ChatLayout/AttachModal.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'
import { firestore, storage } from '../../firebase'
import './ChatLayout.css'

// 2. export AttachModal component
export default function AttachModal({
  roomId,
  initialTab = 'upload', // 'upload' or 'gif'
  onClose
}) {
  const { currentUser } = useAuth()

  // which tab is active?
  const [tab, setTab] = useState(initialTab)

  // upload state
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // GIF search state
  const [term, setTerm] = useState('')
  const [gifs, setGifs] = useState([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [gifError, setGifError] = useState('')

  // 3. fetch GIFs when search term changes and "gif" tab is active
  useEffect(() => {
    if (tab !== 'gif') return
    if (!term) {
      setGifs([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingGifs(true)
      setGifError('')
      try {
        const key = process.env.REACT_APP_TENOR_KEY
        const url =
          `https://tenor.googleapis.com/v2/search?` +
          `key=${encodeURIComponent(key)}` +
          `&q=${encodeURIComponent(term)}` +
          `&limit=24`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Tenor ${res.status}`)
        const json = await res.json()
        const items = (json.results || []).map(r => {
          const gifUrl = r.media_formats.gif.url
          const thumbUrl = r.media_formats.tinygif?.url || gifUrl
          return { id: r.id, thumb: thumbUrl, full: gifUrl }
        })
        if (!cancelled) setGifs(items)
      } catch (e) {
        console.error('GIF search failed', e)
        if (!cancelled) setGifError('Failed to load GIFs.')
      } finally {
        if (!cancelled) setLoadingGifs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [term, tab])

  // 4. handle file upload
  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      // determine type
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      const path = `chatrooms/${roomId}/media/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      // write message
      await addDoc(
        collection(firestore, 'chatrooms', roomId, 'messages'),
        {
          authorId:       currentUser.uid,
          authorEmail:    currentUser.email,
          authorPhotoURL: currentUser.photoURL || '',
          text:           '',
          mediaURL:       url,
          mediaType,      // 'image' or 'video'
          createdAt:      serverTimestamp()
        }
      )

      onClose()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  // 5. handle GIF selection
  async function handleGifSelect(gif) {
    try {
      await addDoc(
        collection(firestore, 'chatrooms', roomId, 'messages'),
        {
          authorId:       currentUser.uid,
          authorEmail:    currentUser.email,
          authorPhotoURL: currentUser.photoURL || '',
          text:           '',
          mediaURL:       gif.full,
          mediaType:      'gif',
          createdAt:      serverTimestamp()
        }
      )
      onClose()
    } catch (e) {
      console.error('GIF send failed', e)
      setGifError('Failed to send GIF.')
    }
  }

  if (!roomId) return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card attach-modal" onClick={e => e.stopPropagation()}>
        {/* tabs */}
        <div className="attach-tabs">
          <button
            className={tab === 'upload' ? 'active' : ''}
            onClick={() => setTab('upload')}
          >
            Upload
          </button>
          <button
            className={tab === 'gif' ? 'active' : ''}
            onClick={() => setTab('gif')}
          >
            GIFs
          </button>
        </div>

        {/* upload tab */}
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

        {/* gif tab */}
        {tab === 'gif' && (
          <div className="attach-body">
            <input
              type="text"
              placeholder="Search GIFs…"
              value={term}
              onChange={e => setTerm(e.target.value)}
              autoFocus
            />
            {gifError && <div className="modal-error">{gifError}</div>}
            <div className="gif-grid">
              {loadingGifs && <p>Loading…</p>}
              {!loadingGifs && gifs.map(g => (
                <img
                  key={g.id}
                  src={g.thumb}
                  alt=""
                  onClick={() => handleGifSelect(g)}
                />
              ))}
              {!loadingGifs && term && !gifs.length && (
                <p className="no-results">No GIFs found for “{term}.”</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}