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

// 2. create AuthContext
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 3. sign up with email/password and record in 'users' collection
  async function signup(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(firestore, 'users', cred.user.uid), {
      email: cred.user.email,
      createdAt: serverTimestamp(),
    })
    return cred
  }

  // 5. sign in with email/password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // 6. sign in with Google OAuth
  function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  // 7. sign out
  function logout() {
    return signOut(auth)
  }

  // 8. listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // 9. only render children once we know auth status
  return (
    <AuthContext.Provider value={{
      currentUser,
      signup,
      login,
      signInWithGoogle,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// 10. custom hook to access the auth context
export function useAuth() {
  return useContext(AuthContext)
}
