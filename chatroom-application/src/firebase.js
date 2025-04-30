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
  apiKey: "AIzaSyCm3LWss5eIDZP7kR82U7_PhmGobc1pdus",
  authDomain: "wapp-chattr.firebaseapp.com",
  databaseURL: "https://wapp-chattr-default-rtdb.firebaseio.com",
  projectId: "wapp-chattr",
  storageBucket: "wapp-chattr.firebasestorage.app",
  messagingSenderId: "795474319184",
  appId: "1:795474319184:web:21f9386557aa0768613e55",
  measurementId: "G-M7JG95Y4CW"
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