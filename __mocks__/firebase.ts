import { vi } from 'vitest'

// Mock Firebase App
const mockInitializeApp = vi.fn(() => ({
  name: '[DEFAULT]',
  options: {},
}))

const mockGetAnalytics = vi.fn(() => ({
  app: {},
  config: {},
}))

// Mock Firestore
const mockGetFirestore = vi.fn(() => ({}))

const mockCollection = vi.fn(() => 'mock-collection-ref')
const mockQuery = vi.fn(() => 'mock-query-ref')
const mockWhere = vi.fn(() => 'mock-query-ref')
const mockOrderBy = vi.fn(() => 'mock-query-ref')
const mockDoc = vi.fn(() => 'mock-doc-ref')
const mockGetDoc = vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) }))
const mockUpdateDoc = vi.fn(() => Promise.resolve())
const mockServerTimestamp = vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))

const mockGetDocs = vi.fn(() =>
  Promise.resolve({
    forEach: (callback: (doc: any) => void) => {
      // Default empty result - can be overridden in tests
    },
    docs: [],
    size: 0,
    empty: true,
  })
)

// Mock Auth
const mockGetAuth = vi.fn(() => ({
  currentUser: null,
  app: {},
  tenantId: null,
}))

const mockConnectAuthEmulator = vi.fn()

// Mock Storage
const mockGetStorage = vi.fn(() => ({}))

const mockUploadBytes = vi.fn(() => Promise.resolve({ ref: {}, metadata: {} }))
const mockGetDownloadURL = vi.fn(() => Promise.resolve('https://mock-url.com/file.jpg'))
const mockDeleteObject = vi.fn(() => Promise.resolve())

// Export all mocks
export {
  mockInitializeApp as initializeApp,
  mockGetAnalytics as getAnalytics,
  mockGetFirestore as getFirestore,
  mockCollection as collection,
  mockQuery as query,
  mockWhere as where,
  mockOrderBy as orderBy,
  mockDoc as doc,
  mockGetDoc as getDoc,
  mockGetDocs as getDocs,
  mockUpdateDoc as updateDoc,
  mockServerTimestamp as serverTimestamp,
  mockGetAuth as getAuth,
  mockConnectAuthEmulator as connectAuthEmulator,
  mockGetStorage as getStorage,
  mockUploadBytes as uploadBytes,
  mockGetDownloadURL as getDownloadURL,
  mockDeleteObject as deleteObject,
}

// Default export
export default {
  initializeApp: mockInitializeApp,
  getAnalytics: mockGetAnalytics,
  getFirestore: mockGetFirestore,
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  serverTimestamp: mockServerTimestamp,
  getAuth: mockGetAuth,
  connectAuthEmulator: mockConnectAuthEmulator,
  getStorage: mockGetStorage,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
  deleteObject: mockDeleteObject,
}