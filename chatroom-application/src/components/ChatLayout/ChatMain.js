// src/components/ChatLayout/ChatMain.js

// 1. imports
import React from 'react'
import MessageList  from '../ChatRoom/MessageList'
import MessageInput from '../ChatRoom/MessageInput'
import './ChatLayout.css'

// 2. create ChatMain component
export default function ChatMain({ activeChat, openDetails }) {
  if (!activeChat) {
    return (
      <main className="chat-main empty">
        <p>Start a conversation</p>
      </main>
    )
  }

  return (
    <main className="chat-main">
      {/* header */}
      <header className="chat-header">
        <div>
          <h2 className="chat-title">{activeChat}</h2>
          {/* fetch and render member names here */}
          <div className="chat-subtitle">Members: …</div>
        </div>
        <div className="chat-header-actions">
          <button onClick={openDetails}>ℹ️</button>
        </div>
      </header>

      {/* messages */}
      <section className="message-area">
        <MessageList roomId={activeChat} />
      </section>

      {/* input */}
      <footer className="chat-input">
        <button className="chat-input-plus">＋</button>
        <MessageInput roomId={activeChat} />
      </footer>
    </main>
  )
}
