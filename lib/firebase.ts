import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore" // Added doc and getDoc imports
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}


const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

// Set the tenant ID if available in environment variables
if (process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID) {
  auth.tenantId = process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID
}

export const storage = getStorage(app)

export { doc, getDoc }

export default app
