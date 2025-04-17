// src/components/ChatRoom/ChatRoom.js

// 1. imports
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import './ChatRoom.css'

// 2. create chatroom component
export default function ChatRoom() {
  const { id } = useParams()   // roomId

  return (
    <div className="chat-room">
      <header className="chat-room-header">
        <Link to="/chatrooms">← Back to rooms</Link>
        <h2>Room: {id}</h2>
      </header>
      <MessageList roomId={id} />
      <MessageInput roomId={id} />
    </div>
  )
}
