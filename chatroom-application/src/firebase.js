// src/firebase.js

// 1. imports
import { initializeApp }  from 'firebase/app'
import { getAuth }        from 'firebase/auth'
import { getDatabase }    from 'firebase/database'
import { getFirestore }   from 'firebase/firestore'
import { getStorage }     from 'firebase/storage'
import { getAnalytics }   from 'firebase/analytics'


// 2. web app's firebase configuration
const firebaseConfig = {
  apiKey:             process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:         process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL:        process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId:          process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:      process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};


// 3. initialize Firebase App
const app = initializeApp(firebaseConfig)

// 4. export individual services for modular imports
const auth = getAuth(app)
const realtimeDB = getDatabase(app)
const firestore = getFirestore(app)
const storage = getStorage(app)
const analytics = getAnalytics(app)  // optional, if you’ll use Analytics

export { app, auth, realtimeDB, firestore, storage, analytics }