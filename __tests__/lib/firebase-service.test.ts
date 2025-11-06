import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getServiceAssignments } from '../../lib/firebase-service'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: vi.fn(() => new Date()) })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: vi.fn(() => new Date()) })),
    fromDate: vi.fn((date) => ({ toDate: vi.fn(() => date) }))
  }
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}))

// Mock the firebase-service module to allow partial mocking
vi.mock('../../lib/firebase-service', async (importOriginal) => {
  return await importOriginal()
})

describe('Firebase Service - getServiceAssignments', () => {
  const mockServiceAssignmentData = {
    saNumber: 'SA-001',
    joNumber: 'JO-001',
    projectSiteId: 'site-1',
    projectSiteName: 'Test Site',
    projectSiteLocation: 'Test Location',
    serviceType: 'Installation',
    assignedTo: 'user-1',
    jobDescription: 'Install billboard',
    requestedBy: {
      id: 'requester-1',
      name: 'John Doe',
      department: 'Operations'
    },
    message: 'Urgent installation needed',
    campaignName: 'Summer Campaign',
    coveredDateStart: new Date('2024-01-01'),
    coveredDateEnd: new Date('2024-01-31'),
    alarmDate: new Date('2024-01-01'),
    alarmTime: '09:00',
    attachments: [{ name: 'blueprint.pdf', type: 'application/pdf' }],
    serviceExpenses: [{ name: 'Transport', amount: '500' }],
    status: 'pending',
    created: { toDate: vi.fn(() => new Date()) },
    updated: { toDate: vi.fn(() => new Date()) },
    company_id: 'comp-1',
    reservation_number: 'RES-001',
    booking_id: 'book-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getServiceAssignments', () => {
    it('should fetch all service assignments successfully', async () => {
      const mockQuerySnapshot = {
        size: 1,
        docs: [
          {
            id: 'assignment-1',
            data: () => mockServiceAssignmentData
          }
        ],
        forEach: function(callback: (doc: any) => void) {
          this.docs.forEach(callback)
        }
      }

      ;(getDocs as any).mockResolvedValue(mockQuerySnapshot)

      const result = await getServiceAssignments()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'assignment-1',
        ...mockServiceAssignmentData
      })
      expect(collection).toHaveBeenCalledWith(db, 'service_assignments')
      expect(getDocs).toHaveBeenCalledTimes(1)
    })

    it('should handle empty service assignments list', async () => {
      const mockQuerySnapshot = {
        size: 0,
        docs: [],
        forEach: function(callback: (doc: any) => void) {
          this.docs.forEach(callback)
        }
      }

      ;(getDocs as any).mockResolvedValue(mockQuerySnapshot)

      const result = await getServiceAssignments()

      expect(result).toHaveLength(0)
      expect(collection).toHaveBeenCalledWith(db, 'service_assignments')
      expect(getDocs).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple service assignments', async () => {
      const mockQuerySnapshot = {
        size: 2,
        docs: [
          {
            id: 'assignment-1',
            data: () => ({ ...mockServiceAssignmentData, saNumber: 'SA-001' })
          },
          {
            id: 'assignment-2',
            data: () => ({ ...mockServiceAssignmentData, saNumber: 'SA-002' })
          }
        ],
        forEach: function(callback: (doc: any) => void) {
          this.docs.forEach(callback)
        }
      }

      ;(getDocs as any).mockResolvedValue(mockQuerySnapshot)

      const result = await getServiceAssignments()

      expect(result).toHaveLength(2)
      expect(result[0].saNumber).toBe('SA-001')
      expect(result[1].saNumber).toBe('SA-002')
      expect(collection).toHaveBeenCalledWith(db, 'service_assignments')
      expect(getDocs).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when getDocs throws an error', async () => {
      ;(getDocs as any).mockRejectedValue(new Error('Firestore error'))

      const result = await getServiceAssignments()

      expect(result).toEqual([])
      expect(collection).toHaveBeenCalledWith(db, 'service_assignments')
      expect(getDocs).toHaveBeenCalledTimes(1)
    })
  })
})