import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore" // Added doc and getDoc imports
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
  measurementId: "G-7CPDJLG85K"
};


const app = initializeApp(firebaseConfig)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const db = getFirestore(app)
export const auth = getAuth(app)

// Set the tenant ID if available in environment variables
if (process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID) {
  auth.tenantId = process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID
}

export const storage = getStorage(app)

export { doc, getDoc }

export default app
