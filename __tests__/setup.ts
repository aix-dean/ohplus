import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getAnalytics: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  serverTimestamp: vi.fn(() => new Date()),
  getDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getCountFromServer: vi.fn(() => ({ data: () => ({ count: 0 }) })),
  onSnapshot: vi.fn(),
  getFirestore: vi.fn(() => ({})),
  Timestamp: {
    fromDate: vi.fn((date) => date),
  },
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}))

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
}))
