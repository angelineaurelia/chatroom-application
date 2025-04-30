// src/components/ChatRoom/GifPickerModal.js

// 1. imports
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { firestore } from '../../firebase'
import './GifPickerModal.css'

// 2. export GifPickerModal component
export default function GifPickerModal({ roomId, isOpen, onClose }) {
  const { currentUser } = useAuth()
  const [term, setTerm]       = useState('')
  const [gifs, setGifs]       = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // 3. fetch from tenor v2 whenever `term` changes
  useEffect(() => {
    if (!term) {
      setGifs([])
      return
    }
    const fetchGifs = async () => {
      setLoading(true)
      setError('')
      try {
        const key = process.env.REACT_APP_TENOR_KEY
        const url =
          `https://tenor.googleapis.com/v2/search?` +
          `key=${encodeURIComponent(key)}` +
          `&q=${encodeURIComponent(term)}` +
          `&limit=24`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Tenor API error: ${res.status}`)
        const json = await res.json()

        // 4. map to { id, thumb, full }
        const items = json.results.map(r => {
          const gifUrl   = r.media_formats.gif.url
          const thumbUrl = r.media_formats.tinygif?.url || gifUrl
          return {
            id:    r.id,
            thumb: thumbUrl,
            full:  gifUrl
          }
        })
        setGifs(items)
      } catch (e) {
        console.error('GIF search failed', e)
        setError('Failed to fetch GIFs. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchGifs()
  }, [term])

  // 5. when user selects a GIF, send it as a message
  const handleSelect = async gif => {
    try {
      await addDoc(
        collection(firestore, 'chatrooms', roomId, 'messages'),
        {
          mediaURL:       gif.full,
          mediaType:      'gif',
          authorId:       currentUser.uid,
          authorEmail:    currentUser.email,
          authorPhotoURL: currentUser.photoURL || '',
          createdAt:      serverTimestamp()
        }
      )
      onClose()
    } catch (e) {
      console.error('GIF send failed', e)
      setError('Failed to send GIF.')
    }
  }

  if (!isOpen) return null
  
  // 6. render the modal
  return createPortal(
    <div className="gif-modal-overlay" onClick={onClose}>
      <div className="gif-modal-card" onClick={e => e.stopPropagation()}>
        <header className="gif-modal-header">
          <h2>Send a GIF</h2>
          <button className="gif-close" onClick={onClose}>×</button>
        </header>

        <div className="gif-search">
          <input
            type="text"
            placeholder="Search GIFs…"
            value={term}
            onChange={e => setTerm(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="gif-error">{error}</div>}

        <div className="gif-grid">
          {loading && <p>Loading…</p>}
          {!loading && gifs.map(g => (
            <img
              key={g.id}
              src={g.thumb}
              alt=""
              onClick={() => handleSelect(g)}
            />
          ))}
          {!loading && term && !gifs.length && (
            <p>No GIFs found for “{term}.”</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
