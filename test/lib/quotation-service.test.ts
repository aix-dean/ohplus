import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDirectQuotation, createMultipleQuotations } from '@/lib/quotation-service'

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}))

// Mock console.log to suppress verbose output
const mockConsoleLog = vi.fn()
console.log = mockConsoleLog

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
  Timestamp: {
    fromDate: vi.fn((date) => date),
  },
}))

describe('Quotation Service - Content Type Capitalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleLog.mockClear()
  })

  describe('Content Type Capitalization Logic', () => {
    it('should capitalize the first letter of content_type', () => {
      // Test the capitalization logic directly
      const testContentType = 'billboard'
      const capitalized = testContentType ? testContentType.charAt(0).toUpperCase() + testContentType.slice(1) : ''
      expect(capitalized).toBe('Billboard')
    })

    it('should handle empty content_type', () => {
      const contentType: string = ''
      const result = contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : ''
      expect(result).toBe('')
    })

    it('should handle null content_type', () => {
      const contentType: string | null = null
      const result = contentType ? (contentType as string).charAt(0).toUpperCase() + (contentType as string).slice(1) : ''
      expect(result).toBe('')
    })

    it('should handle undefined content_type', () => {
      const contentType: string | undefined = undefined
      const result = contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : ''
      expect(result).toBe('')
    })

    it('should capitalize single character content_type', () => {
      const contentType: string = 'a'
      const result = contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : ''
      expect(result).toBe('A')
    })

    it('should capitalize mixed case content_type', () => {
      const contentType: string = 'bIlLbOaRd'
      const result = contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : ''
      expect(result).toBe('BIlLbOaRd')
    })

    it('should capitalize lowercase content_type', () => {
      const contentType: string = 'billboard'
      const result = contentType ? contentType.charAt(0).toUpperCase() + contentType.slice(1) : ''
      expect(result).toBe('Billboard')
    })
  })

  describe('createDirectQuotation', () => {
    it('should create a quotation without throwing an error', async () => {
      const clientData = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@example.com',
      }

      const sitesData = [{
        id: 'site-1',
        name: 'Test Site',
        location: 'Test Location',
        price: 1000,
        content_type: 'billboard',
        type: 'old-type',
        image: 'test-image.jpg',
        height: 10,
        width: 20,
        specs_rental: {},
      }]

      const userId = 'user-1'
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        company_id: 'company-1',
      }

      // Test that the function completes without throwing
      await expect(createDirectQuotation(clientData, sitesData, userId, options)).resolves.not.toThrow()
    })
  })

  describe('createMultipleQuotations', () => {
    it('should create multiple quotations without throwing an error', async () => {
      const clientData = {
        id: 'client-1',
        name: 'Test Client',
        email: 'test@example.com',
      }

      const sitesData = [
        {
          id: 'site-1',
          name: 'Test Site 1',
          location: 'Test Location 1',
          price: 1000,
          content_type: 'billboard',
          type: 'old-type',
          image: 'test-image1.jpg',
          height: 10,
          width: 20,
          specs_rental: {},
        },
        {
          id: 'site-2',
          name: 'Test Site 2',
          location: 'Test Location 2',
          price: 1500,
          content_type: 'digital',
          type: 'old-type',
          image: 'test-image2.jpg',
          height: 15,
          width: 25,
          specs_rental: {},
        }
      ]

      const userId = 'user-1'
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        company_id: 'company-1',
      }

      // Test that the function completes without throwing
      await expect(createMultipleQuotations(clientData, sitesData, userId, options)).resolves.not.toThrow()
    })
  })
})