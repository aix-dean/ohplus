import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
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

console.log("[v0] Firebase config validation:", {
  apiKey: firebaseConfig.apiKey ? "present" : "missing",
  authDomain: firebaseConfig.authDomain ? "present" : "missing",
  projectId: firebaseConfig.projectId ? "present" : "missing",
  storageBucket: firebaseConfig.storageBucket ? "present" : "missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "present" : "missing",
  appId: firebaseConfig.appId ? "present" : "missing",
})

const requiredFields = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]
const missingFields = requiredFields.filter((field) => !firebaseConfig[field as keyof typeof firebaseConfig])

if (missingFields.length > 0) {
  console.error("[v0] Missing Firebase configuration fields:", missingFields)
  throw new Error(`Missing Firebase configuration: ${missingFields.join(", ")}`)
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

export default app
