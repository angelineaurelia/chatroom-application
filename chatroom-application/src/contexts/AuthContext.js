// src/contexts/AuthContext.js

// 1. imports
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, firestore } from '../firebase'

const AuthContext = createContext()

// 2. create AuthProvider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // email/password signup
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  // email/password login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // google OAuth
  function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  // sign out
  function logout() {
    return signOut(auth)
  }

  // listen for auth state changes & upsert user record
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          await setDoc(
            doc(firestore, 'users', user.uid),
            {
              email: user.email,
              createdAt: serverTimestamp()
            },
            { merge: true }
          )
        } catch (err) {
          console.error('Error upserting user:', err)
        }
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
