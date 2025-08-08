import { initializeApp, getApps, getApp } from 'firebase/app'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const storage = getStorage(app)

/**
 * Accepts:
 * - Full https URL (returns as-is)
 * - gs://bucket/path/to/file.pdf (converted via ref + getDownloadURL)
 * - Path like "folder/subfolder/file.pdf" (converted via getDownloadURL)
 */
export async function getDownloadUrlForPath(input: string): Promise<string> {
  if (!input) throw new Error('Empty path/url')

  // If it already looks like an absolute http(s) URL, return as-is
  try {
    const u = new URL(input)
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return input
    }
  } catch {
    // Not an absolute URL, continue
  }

  // For gs:// or relative paths, use Firebase Storage ref
  const r = ref(storage, input)
  return await getDownloadURL(r)
}
