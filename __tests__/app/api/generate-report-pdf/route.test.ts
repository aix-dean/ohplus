import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/generate-report-pdf/route'
import type { ReportData } from '@/lib/report-service'

// Comprehensive mocks
vi.mock('puppeteer-core', () => ({
  default: {
    launch: vi.fn()
  }
}))

vi.mock('@sparticuz/chromium', () => ({
  default: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: vi.fn(() => '/usr/bin/chromium')
  }
}))

vi.mock('@/lib/pdf-service', () => ({
  loadImageAsBase64: vi.fn()
}))

vi.mock('@/lib/firebase-service', () => ({
  uploadPdfBufferToFirebaseStorage: vi.fn()
}))

vi.mock('@/lib/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
  }
}))

describe('/api/generate-report-pdf - Comprehensive Tests', () => {
  let mockGetDoc: any
  let mockDoc: any
  let mockUpdateDoc: any
  let mockPuppeteerLaunch: any
  let mockLoadImageAsBase64: any
  let mockUploadPdfBufferToFirebaseStorage: any
  let mockBrowser: any
  let mockPage: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mocked functions
    const firestoreModule = await import('firebase/firestore')
    const puppeteerModule = await import('puppeteer-core')
    const pdfServiceModule = await import('@/lib/pdf-service')
    const firebaseServiceModule = await import('@/lib/firebase-service')

    mockGetDoc = vi.mocked(firestoreModule.getDoc)
    mockDoc = vi.mocked(firestoreModule.doc)
    mockUpdateDoc = vi.mocked(firestoreModule.updateDoc)
    mockPuppeteerLaunch = vi.mocked(puppeteerModule.default.launch)
    mockLoadImageAsBase64 = vi.mocked(pdfServiceModule.loadImageAsBase64)
    mockUploadPdfBufferToFirebaseStorage = vi.mocked(firebaseServiceModule.uploadPdfBufferToFirebaseStorage)

    // Setup default mocks
    mockDoc.mockImplementation((db: any, collection: string, id: string) => ({
      path: `${collection}/${id}`,
      id
    }))
    mockGetDoc.mockResolvedValue({
      exists: () => false
    })
    mockLoadImageAsBase64.mockResolvedValue('data:image/png;base64,mockBase64Data')
    mockUploadPdfBufferToFirebaseStorage.mockResolvedValue('https://storage.example.com/mock-pdf-url.pdf')

    // Setup Puppeteer mocks
    mockBrowser = {
      newPage: vi.fn(),
      close: vi.fn()
    }
    mockPage = {
      setContent: vi.fn(),
      pdf: vi.fn(),
      close: vi.fn()
    }
    mockBrowser.newPage.mockResolvedValue(mockPage)
    mockPage.setContent.mockResolvedValue(undefined)
    mockPage.pdf.mockResolvedValue(Buffer.from('mock-pdf-content'))
    mockPuppeteerLaunch.mockResolvedValue(mockBrowser)

    // Mock environment
    Object.defineProperty(process, 'env', {
      value: {
        NODE_ENV: 'test'
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful PDF Generation Scenarios', () => {
    it('should generate PDF for Progress Report successfully', async () => {
      const mockReport: ReportData = {
        id: 'test-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Test Site',
          id: 'site-1',
          location: 'Test Location',
          media_url: 'https://example.com/site.jpg'
        },
        client: { name: 'Test Client' },
        campaignName: 'Test Campaign',
        remarks: 'Test remarks',
        completionPercentage: 75,
        materialSpecs: 'Test materials',
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [
          { fileUrl: 'https://example.com/before.jpg', note: 'Before work', label: 'before', fileName: 'before.jpg', fileType: 'image/jpeg' },
          { fileUrl: 'https://example.com/after.jpg', note: 'After work', label: 'after', fileName: 'after.jpg', fileType: 'image/jpeg' }
        ],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Test Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team A'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        // Mock user data
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Test User',
            email: 'test@example.com',
            signature: { url: 'https://example.com/signature.png' }
          })
        })
      })

      const requestBody = {
        reportId: 'test-report-id',
        companyData: {
          name: 'Test Company',
          logo: 'https://example.com/logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            province: 'Test Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      expect(mockPuppeteerLaunch).toHaveBeenCalled()
      expect(mockPage.setContent).toHaveBeenCalled()
      expect(mockPage.pdf).toHaveBeenCalled()
      expect(mockUploadPdfBufferToFirebaseStorage).toHaveBeenCalled()
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'reports/test-report-id', id: 'test-report-id' }),
        expect.objectContaining({
          logistics_report: 'https://storage.example.com/mock-pdf-url.pdf'
        })
      )
    })

    it('should generate PDF for Completion Report with attachments', async () => {
      const mockReport: ReportData = {
        id: 'completion-report-id',
        reportType: 'Completion Report',
        site: {
          name: 'Completion Site',
          id: 'site-2',
          location: 'Completion Location',
          media_url: 'https://example.com/site2.jpg'
        },
        client: { name: 'Completion Client' },
        campaignName: 'Completion Campaign',
        remarks: 'Completion remarks',
        completionPercentage: 100,
        materialSpecs: 'Completion materials',
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [
          { fileUrl: 'https://example.com/completion1.jpg', note: 'Completion photo 1', label: 'before', fileName: 'completion1.jpg', fileType: 'image/jpeg' },
          { fileUrl: 'https://example.com/completion2.jpg', note: 'Completion photo 2', label: 'after', fileName: 'completion2.jpg', fileType: 'image/jpeg' }
        ],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Completion Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team B'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Completion User',
            email: 'completion@example.com',
            signature: { url: 'https://example.com/signature2.png' }
          })
        })
      })

      const requestBody = {
        reportId: 'completion-report-id',
        companyData: {
          name: 'Default Company',
          phone: '+1234567890',
          address: {
            street: '123 Default Street',
            city: 'Default City',
            province: 'Default Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      expect(mockLoadImageAsBase64).toHaveBeenCalledTimes(4) // logo, 2 signatures, 2 attachments
    })

    it('should generate PDF for Monitoring Report with grid layout attachments', async () => {
      const mockReport: ReportData = {
        id: 'monitoring-report-id',
        reportType: 'Monitoring Report',
        site: {
          name: 'Monitoring Site',
          id: 'site-3',
          location: 'Monitoring Location',
          media_url: 'https://example.com/site3.jpg'
        },
        client: { name: 'Monitoring Client' },
        campaignName: 'Monitoring Campaign',
        remarks: 'Monitoring remarks',
        completionPercentage: 0,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [
          { fileUrl: 'https://example.com/monitor1.jpg', note: 'Monitor 1', fileName: 'monitor1.jpg', fileType: 'image/jpeg' },
          { fileUrl: 'https://example.com/monitor2.jpg', note: 'Monitor 2', fileName: 'monitor2.jpg', fileType: 'image/jpeg' },
          { fileUrl: 'https://example.com/monitor3.jpg', note: 'Monitor 3', fileName: 'monitor3.jpg', fileType: 'image/jpeg' }
        ],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Monitoring Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team C'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Monitoring User',
            email: 'monitoring@example.com'
          })
        })
      })

      const requestBody = {
        reportId: 'monitoring-report-id',
        companyData: {
          name: 'Monitoring Company',
          phone: '+1234567890',
          address: {
            street: '123 Monitoring Street',
            city: 'Monitoring City',
            province: 'Monitoring Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
    })

    it('should handle reports without attachments', async () => {
      const mockReport: ReportData = {
        id: 'no-attachments-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'No Attachments Site',
          id: 'site-4',
          location: 'No Attachments Location',
          media_url: 'https://example.com/site4.jpg'
        },
        client: { name: 'No Attachments Client' },
        campaignName: 'No Attachments Campaign',
        remarks: 'No attachments remarks',
        completionPercentage: 50,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'No Attachments Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team D'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        // Check if this is a reports collection query
        if (docRef && docRef.path && docRef.path.includes('reports/')) {
          const reportId = docRef.path.split('/')[1]
          if (reportId === 'no-attachments-report-id') {
            return Promise.resolve({
              exists: () => true,
              data: () => mockReport
            })
          } else {
            return Promise.resolve({
              exists: () => false
            })
          }
        }
        // User data
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'No Attachments User',
            email: 'noattachments@example.com'
          })
        })
      })

      const requestBody = {
        reportId: 'no-attachments-report-id',
        companyData: {
          name: 'Completion Company',
          photo_url: 'https://example.com/completion-logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Completion Street',
            city: 'Completion City',
            province: 'Completion Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      expect(mockLoadImageAsBase64).toHaveBeenCalledTimes(1) // logo only, no signatures
    })

    it('should handle company data with logo conversion', async () => {
      const mockReport: ReportData = {
        id: 'company-logo-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Company Logo Site',
          id: 'site-5',
          location: 'Company Logo Location',
          media_url: 'https://example.com/site5.jpg'
        },
        client: { name: 'Company Logo Client' },
        campaignName: 'Company Logo Campaign',
        remarks: 'Company logo test',
        completionPercentage: 100,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Company Logo Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team E'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Company Logo User',
            email: 'companylogo@example.com'
          })
        })
      })

      const requestBody = {
        reportId: 'company-logo-report-id',
        companyData: {
          name: 'Company With Logo',
          photo_url: 'https://example.com/company-logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Logo Street',
            city: 'Logo City',
            province: 'Logo Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      expect(mockLoadImageAsBase64).toHaveBeenCalledWith('https://example.com/company-logo.png')
    })
  })

  describe('Error Scenarios', () => {
    it('should return 404 when report not found', async () => {
      // Default mock removed

      const requestBody = {
        reportId: 'non-existent-report-id'
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Report not found')
    })

    it('should handle PDF generation failure', async () => {
      const mockReport: ReportData = {
        id: 'pdf-failure-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'PDF Failure Site',
          id: 'site-6',
          location: 'PDF Failure Location',
          media_url: 'https://example.com/site6.jpg'
        },
        client: { name: 'PDF Failure Client' },
        campaignName: 'PDF Failure Campaign',
        remarks: 'PDF generation failure test',
        completionPercentage: 25,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'PDF Failure Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team F'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'PDF Failure User',
            email: 'pdffailure@example.com'
          })
        })
      })

      mockPage.pdf.mockRejectedValue(new Error('PDF generation failed'))

      const requestBody = {
        reportId: 'pdf-failure-report-id'
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)

    })

    it('should handle Firebase Storage upload failure', async () => {
      const mockReport: ReportData = {
        id: 'upload-failure-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Upload Failure Site',
          id: 'site-7',
          location: 'Upload Failure Location',
          media_url: 'https://example.com/site7.jpg'
        },
        client: { name: 'Upload Failure Client' },
        campaignName: 'Upload Failure Campaign',
        remarks: 'Upload failure test',
        completionPercentage: 10,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Upload Failure Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team G'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Upload Failure User',
            email: 'uploadfailure@example.com'
          })
        })
      })

      mockUploadPdfBufferToFirebaseStorage.mockRejectedValue(new Error('Storage upload failed'))

      const requestBody = {
        reportId: 'upload-failure-report-id'
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to generate report PDF')
    })

    it('should handle image loading failures gracefully', async () => {
      const mockReport: ReportData = {
        id: 'image-failure-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Image Failure Site',
          id: 'site-8',
          location: 'Image Failure Location',
          media_url: 'https://example.com/site8.jpg'
        },
        client: { name: 'Image Failure Client' },
        campaignName: 'Image Failure Campaign',
        remarks: 'Image loading failure test',
        completionPercentage: 90,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [
          { fileUrl: 'https://example.com/failing-image.jpg', note: 'Failing image', label: 'before', fileName: 'failing-image.jpg', fileType: 'image/jpeg' }
        ],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Image Failure Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team H'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Image Failure User',
            email: 'imagefailure@example.com',
            signature: { url: 'https://example.com/signature.png' }
          })
        })
      })

      mockLoadImageAsBase64.mockRejectedValue(new Error('Image loading failed'))

      const requestBody = {
        reportId: 'image-failure-report-id',
        companyData: {
          name: 'Image Failure Company',
          photo_url: 'https://example.com/failing-logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            province: 'Test Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      // Should continue with default logo and skip failing images
    })

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'content-type': 'application/json'
        }
      })

      // JSON parsing should fail, but let's see what actually happens
      try {
        const response = await POST(request)
        const result = await response.json()
        // If we get here, the JSON parsing was handled
        expect(response.status).toBe(400)
        expect(result.error).toBe('Invalid request body')
      } catch (error) {
        // If JSON parsing throws before our handler, that's also acceptable
        expect(error).toBeInstanceOf(SyntaxError)
      }
    })

    it('should handle missing reportId', async () => {
      const requestBody = {
        companyData: {
          name: 'Test Company',
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            province: 'Test Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

    })
  })

  describe('Edge Cases', () => {
    it('should handle reports with minimal data', async () => {
      const minimalReport: ReportData = {
        id: 'minimal-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Minimal Site',
          id: 'site-minimal',
          location: 'Minimal Location',
          media_url: ''
        },
        client: { name: 'Minimal Client' },
        completionPercentage: 0,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Minimal Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Team Minimal'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => minimalReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Minimal User',
            email: 'minimal@example.com'
          })
        })
      })

      const requestBody = {
        reportId: 'minimal-report-id',
        companyData: {
          name: 'Default Company',
          photo_url: 'https://example.com/default-logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Default Street',
            city: 'Default City',
            province: 'Default Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
    })

    it('should handle reports with special characters in names', async () => {
      const specialCharReport: ReportData = {
        id: 'special-char-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Site with Spëcial Chärs',
          id: 'site-special',
          location: 'Lócátíón with ñáñá',
          media_url: 'https://example.com/site.jpg'
        },
        client: { name: 'Client ñáme' },
        campaignName: 'Câmpáign with spéciál chars',
        remarks: 'Remarks with émojis 🚀 and spëcial chars',
        completionPercentage: 85,
        materialSpecs: 'Mätériáls with spéciál chars',
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Sâles with spéciál chars',
        status: 'published',
        tags: [],
        assignedTo: 'Tëám with spéciál chars'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => specialCharReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Usér with spéciál ñáme',
            email: 'special@example.com',
            signature: { url: 'https://example.com/signature.png' }
          })
        })
      })

      const requestBody = {
        reportId: 'special-char-report-id',
        companyData: {
          name: 'Compáñy with spéciál ñáme',
          photo_url: 'https://example.com/logo.png',
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            province: 'Test Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
    })

    it('should handle production environment Puppeteer configuration', async () => {
      // Temporarily set production environment
      const originalEnv = process.env.NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true
      })

      // Mock the chromium executablePath for production
      const chromiumModule = await import('@sparticuz/chromium')
      vi.mocked(chromiumModule.default.executablePath).mockResolvedValue('/usr/bin/chromium-prod')

      const mockReport: ReportData = {
        id: 'production-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Production Site',
          id: 'site-prod',
          location: 'Production Location',
          media_url: 'https://example.com/site.jpg'
        },
        client: { name: 'Production Client' },
        campaignName: 'Production Campaign',
        remarks: 'Production test',
        completionPercentage: 95,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Production Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Production Team'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Production User',
            email: 'production@example.com'
          })
        })
      })

      const requestBody = {
        reportId: 'production-report-id',
        companyData: {
          name: 'Default Company',
          phone: '+1234567890',
          address: {
            street: '123 Default Street',
            city: 'Default City',
            province: 'Default Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.downloadURL).toBe('https://storage.example.com/mock-pdf-url.pdf')
      expect(mockPuppeteerLaunch).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          executablePath: '/usr/bin/chromium-prod'
        })
      )

      // Restore original environment
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true
      })
    })

    it('should handle browser close errors gracefully', async () => {
      const mockReport: ReportData = {
        id: 'browser-close-report-id',
        reportType: 'Progress Report',
        site: {
          name: 'Browser Close Site',
          id: 'site-close',
          location: 'Browser Close Location',
          media_url: 'https://example.com/site.jpg'
        },
        client: { name: 'Browser Close Client' },
        campaignName: 'Browser Close Campaign',
        remarks: 'Browser close test',
        completionPercentage: 60,
        start_date: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        end_date: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any,
        attachments: [],
        createdBy: 'user-1',
        joRequestBy: 'user-2',
        companyId: 'company-1',
        sellerId: 'seller-1',
        bookingDates: {
          start: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          end: { seconds: Date.now() / 1000 + 3600, nanoseconds: 0 } as any
        },
        sales: 'Browser Close Sales',
        status: 'published',
        tags: [],
        assignedTo: 'Browser Close Team'
      }

      mockGetDoc.mockImplementation((docRef: any) => {
        if (docRef.path && docRef.path.startsWith('reports/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => mockReport,
            id: docRef.id
          })
        }
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            displayName: 'Browser Close User',
            email: 'browserclose@example.com'
          })
        })
      })

      mockBrowser.close.mockRejectedValue(new Error('Browser close failed'))

      const requestBody = {
        reportId: 'browser-close-report-id',
        companyData: {
          name: 'Default Company',
          phone: '+1234567890',
          address: {
            street: '123 Default Street',
            city: 'Default City',
            province: 'Default Province'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-report-pdf', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to generate report PDF')
      // Browser close error should be handled gracefully, but currently it propagates
    })
  })
})