// src/components/ChatLayout/ChatDetails.js

// 1. imports
import React from 'react'
import './ChatLayout.css'

// 2. create ChatDetails component
export default function ChatDetails({ isOpen, activeChat, onClose }) {
  return (
    <aside className={`chat-details ${isOpen?'open':'closed'}`}>
      <button className="details-close" onClick={onClose}>←</button>
      {activeChat ? (
        <div>
          <h3>Details for {activeChat}</h3>
          {/* future details go here */}
        </div>
      ) : (
        <p>No chat selected</p>
      )}
    </aside>
  )
}
