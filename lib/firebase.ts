import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase app
let app
if (typeof window !== "undefined") {
  // Client-side initialization only
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApp()
  }
} else {
  // Server-side - don't initialize Firebase
  app = null
}

// Initialize services with proper checks
let db: any = null
let auth: any = null
let storage: any = null

if (typeof window !== "undefined" && app) {
  // Client-side service initialization
  try {
    db = getFirestore(app)
    auth = getAuth(app)
    auth.tenantId = "ohplus-07hsi"
    storage = getStorage(app)
  } catch (error) {
    console.error("Error initializing Firebase services:", error)
  }
}

export { db, auth, storage }
export default app
