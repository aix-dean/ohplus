import React from 'react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props }),
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    userData: { company_id: 'test-company-id' },
  }),
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock cost estimate service
const mockCreateDirectCostEstimate = vi.fn()
const mockCreateMultipleCostEstimates = vi.fn()
vi.mock('@/lib/cost-estimate-service', () => ({
  createDirectCostEstimate: mockCreateDirectCostEstimate,
  createMultipleCostEstimates: mockCreateMultipleCostEstimates,
}))

// Mock firebase service
const mockGetProductById = vi.fn()
const mockGetProductBookings = vi.fn()
const mockUploadFileToFirebaseStorage = vi.fn()
const mockUpdateProduct = vi.fn()
const mockGetServiceAssignmentsByProductId = vi.fn()
const mockSoftDeleteProduct = vi.fn()

vi.mock('@/lib/firebase-service', () => ({
  getProductById: mockGetProductById,
  getProductBookings: mockGetProductBookings,
  uploadFileToFirebaseStorage: mockUploadFileToFirebaseStorage,
  updateProduct: mockUpdateProduct,
  getServiceAssignmentsByProductId: mockGetServiceAssignmentsByProductId,
  softDeleteProduct: mockSoftDeleteProduct,
}))

// Mock Firebase Firestore functions used in the component
const mockCollection = vi.fn()
const mockQuery = vi.fn()
const mockWhere = vi.fn()
const mockOrderBy = vi.fn()
const mockGetDocs = vi.fn()
const mockDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockServerTimestamp = vi.fn(() => new Date())
const mockGetFirestore = vi.fn(() => ({}))

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  serverTimestamp: mockServerTimestamp,
  getFirestore: mockGetFirestore,
}))

// Mock client service
const mockGetClientById = vi.fn()
vi.mock('@/lib/client-service', () => ({
  getClientById: mockGetClientById,
}))

// Export mocks for use in tests
;(globalThis as any).mockCreateDirectCostEstimate = mockCreateDirectCostEstimate
;(globalThis as any).mockCreateMultipleCostEstimates = mockCreateMultipleCostEstimates
;(globalThis as any).mockGetProductById = mockGetProductById
;(globalThis as any).mockGetProductBookings = mockGetProductBookings
;(globalThis as any).mockGetClientById = mockGetClientById
;(globalThis as any).mockUploadFileToFirebaseStorage = mockUploadFileToFirebaseStorage
;(globalThis as any).mockUpdateProduct = mockUpdateProduct
;(globalThis as any).mockGetServiceAssignmentsByProductId = mockGetServiceAssignmentsByProductId
;(globalThis as any).mockSoftDeleteProduct = mockSoftDeleteProduct

// Export Firebase mocks
;(globalThis as any).mockCollection = mockCollection
;(globalThis as any).mockQuery = mockQuery
;(globalThis as any).mockWhere = mockWhere
;(globalThis as any).mockOrderBy = mockOrderBy
;(globalThis as any).mockGetDocs = mockGetDocs
;(globalThis as any).mockDoc = mockDoc
;(globalThis as any).mockUpdateDoc = mockUpdateDoc
;(globalThis as any).mockServerTimestamp = mockServerTimestamp
;(globalThis as any).mockGetFirestore = mockGetFirestore

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => React.createElement('div', { className, 'data-testid': 'skeleton' }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CalendarIcon: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }),
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }),
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
  MoreVertical: () => React.createElement('div', { 'data-testid': 'more-vertical-icon' }),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
  Printer: () => React.createElement('div', { 'data-testid': 'printer-icon' }),
  Eye: () => React.createElement('div', { 'data-testid': 'eye-icon' }),
  Trash2: () => React.createElement('div', { 'data-testid': 'trash2-icon' }),
  History: () => React.createElement('div', { 'data-testid': 'history-icon' }),
  Copy: () => React.createElement('div', { 'data-testid': 'copy-icon' }),
  Edit: () => React.createElement('div', { 'data-testid': 'edit-icon' }),
  Upload: () => React.createElement('div', { 'data-testid': 'upload-icon' }),
  Paperclip: () => React.createElement('div', { 'data-testid': 'paperclip-icon' }),
}))