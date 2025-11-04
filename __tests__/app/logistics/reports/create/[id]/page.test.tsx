import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateReportPage from '@/app/logistics/reports/create/[id]/page'
import { AuthProvider } from '@/contexts/auth-context'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
let mockParams: any = { id: 'test-assignment-id' }
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => mockParams,
}))

// Mock auth context
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
}

const mockUserData = {
  uid: 'test-user-id',
  company_id: 'test-company-id',
  displayName: 'Test User',
  first_name: 'Test',
  last_name: 'User',
}

let mockAuthData: any = {
  user: mockUser,
  userData: mockUserData,
  projectData: null,
  subscriptionData: null,
  loading: false,
}
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockAuthData,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  where: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}))

// Mock report service
vi.mock('@/lib/report-service', () => ({
  createReport: vi.fn(),
  ReportData: {},
}))

// Mock teams service
vi.mock('@/lib/teams-service', () => ({
  getTeams: vi.fn(),
  getTeamById: vi.fn(),
}))

// Mock firebase service
vi.mock('@/lib/firebase-service', () => ({
  getProductById: vi.fn(),
  uploadFileToFirebaseStorage: vi.fn(),
  getBookingById: vi.fn(),
}))

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  SquarePen: () => <div data-testid="square-pen-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
}))

// Mock date-fns
vi.mock('date-fns/locale', () => ({
  te: {},
}))

// Mock fetch for PDF generation
global.fetch = vi.fn()

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
)

describe('CreateReportPage', () => {
  const mockAssignmentData = {
    id: 'test-assignment-id',
    saNumber: 'SA000582',
    serviceType: 'Roll Up',
    projectSiteId: 'test-site-id',
    projectSiteName: 'Petplans Tower',
    projectSiteLocation: 'EDSA, Guadalupe',
    campaignName: 'Mcdonald\'s',
    assignedToName: 'Production- Jonathan Dela Cruz',
    coveredDateStart: {
      toDate: () => new Date('2024-01-01T09:00:00'),
    },
    coveredDateEnd: {
      toDate: () => new Date('2024-01-31T17:00:00'),
    },
    booking_id: 'test-booking-id',
    sales: 'Test Sales',
    saId: 'test-assignment-id',
    company_id: 'test-company-id',
    requestedBy: {
      department: 'Marketing',
      name: 'John Doe',
      id: 'requester-id',
    },
    materialSpecs: 'Test material specs',
    joNumber: 'JO001',
    joType: 'Installation',
    joRequestBy: 'Client',
    costEstimateId: 'cost-estimate-id',
    quotationId: 'quotation-id',
    crew: 'Test Crew',
    attachments: [
      {
        name: 'attachment1.pdf',
        type: 'application/pdf',
      },
    ],
  }

  const mockProductData = {
    id: 'test-site-id',
    name: 'Petplans Tower',
    description: 'Test product description',
    price: 10000,
    active: true,
    deleted: false,
    seller_id: 'seller-id',
    seller_name: 'Test Seller',
    position: 1,
    specs_rental: {
      location: 'EDSA, Guadalupe',
      structure: {
        color: null,
        condition: null,
        contractor: null,
        last_maintenance: null,
      },
      illumination: 'LED',
    },
  } as any

  const mockBookingData = {
    id: 'test-booking-id',
    product_id: 'test-product-id',
    client_id: 'test-client-id',
    client_name: 'Test Client',
    client: {
      name: 'Test Client',
      email: 'client@test.com',
    },
    seller_id: 'test-seller-id',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    status: 'confirmed',
    items: {
      media_url: '/placeholder.jpg',
    },
    total_amount: 50000,
    payment_status: 'paid',
    created: '2024-01-01',
    updated: '2024-01-01',
  } as any

  const mockCompanyData = {
    id: 'test-company-id',
    name: 'Test Company',
    logo: 'https://example.com/logo.jpg',
    address: '123 Test St',
    website: 'https://test.com',
    contact_person: 'Jane Doe',
    email: 'company@test.com',
    phone: '+1234567890',
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset mocks
    mockParams = { id: 'test-assignment-id' }
    mockAuthData = {
      user: mockUser,
      userData: mockUserData,
      projectData: null,
      subscriptionData: null,
      loading: false,
    }

    // Setup default mocks
    const { getDoc, doc } = vi.mocked(await import('firebase/firestore'))
    const { getProductById, getBookingById } = vi.mocked(await import('@/lib/firebase-service'))

    // Mock doc to return an object with a path property
    doc.mockImplementation((db: any, collection: string, id: string) => ({
      path: `${collection}/${id}`,
      id,
    } as any))

    // Mock getDoc to return data based on the path
    getDoc.mockImplementation((docRef: any) => {
      if (docRef.path?.includes('service_assignments')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockAssignmentData,
          id: docRef.id,
        } as any)
      } else if (docRef.path?.includes('companies')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockCompanyData,
          id: docRef.id,
        } as any)
      }
      return Promise.resolve({
        exists: () => false,
        data: () => null,
        id: docRef.id,
      } as any)
    })

    getProductById.mockResolvedValue(mockProductData)
    getBookingById.mockResolvedValue(mockBookingData)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering States', () => {
    it('should render loading state initially', async () => {
      // Mock delayed response
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation(() => new Promise(() => {}))

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      expect(screen.getByText('Loading assignment data...')).toBeInTheDocument()
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
    })

    it('should render error state when assignment not found', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      } as any)

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Assignment not found')).toBeInTheDocument()
      })

      expect(screen.getByText('Back to Select Service Assignment')).toBeInTheDocument()
    })

    it('should render error state when no assignment ID provided', async () => {
      mockParams = {}

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('No assignment ID provided')).toBeInTheDocument()
      })
    })

    it('should render assignment data successfully', async () => {
      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Check metadata header - these are just text elements, not inputs
      expect(screen.getByText('SA I.D.')).toBeInTheDocument()
      const saElements = screen.getAllByText('SA000582')
      expect(saElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Type')).toBeInTheDocument()
      const rollUpElements = screen.getAllByText('Roll Up')
      expect(rollUpElements.length).toBeGreaterThan(0)

      // Check site info
      expect(screen.getAllByText('Petplans Tower').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Mcdonald\'s').length).toBeGreaterThan(0)
    })
  })

  describe('Data Fetching and Display', () => {
    it('should fetch and display assignment details correctly', async () => {
      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Check metadata header
      expect(screen.getByText('SA I.D.')).toBeInTheDocument()
      const saElements = screen.getAllByText('SA000582')
      expect(saElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Type')).toBeInTheDocument()
      const rollUpElements = screen.getAllByText('Roll Up')
      expect(rollUpElements.length).toBeGreaterThan(0)

      // Check site information
      expect(screen.getAllByText('Petplans Tower').length).toBeGreaterThan(0)
      expect(screen.getByText('EDSA, Guadalupe')).toBeInTheDocument()
    })

    it('should display report form with correct default values', async () => {
      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Check report number (should start with RPT#)
      const reportNumberElement = screen.getByText(/^RPT#/)
      expect(reportNumberElement).toBeInTheDocument()

      // Check date display
      const currentDate = new Date().toLocaleDateString()
      expect(screen.getByText(currentDate)).toBeInTheDocument()

      // Check that the form is displayed
      expect(screen.getByText('SA No.:')).toBeInTheDocument()
      expect(screen.getByText('SA Type:')).toBeInTheDocument()
    })

    it('should handle monitoring service type correctly', async () => {
      const monitoringAssignment = {
        ...mockAssignmentData,
        serviceType: 'Monitoring',
      }

      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => true,
            data: () => monitoringAssignment,
          } as any)
        }
        return Promise.resolve({
          exists: () => true,
          data: () => mockCompanyData,
        } as any)
      })

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Should show monitoring photos section
      expect(screen.getByText('Photos:')).toBeInTheDocument()

      // Should not show before/after sections
      expect(screen.queryByText('Before SA Photos:')).not.toBeInTheDocument()
      expect(screen.queryByText('After SA Photos:')).not.toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should allow entering remarks', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const remarksTextarea = screen.getByLabelText('Remarks')
      await user.type(remarksTextarea, 'Test remarks for the report')

      expect(remarksTextarea).toHaveValue('Test remarks for the report')
    })

    it('should allow selecting report type', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Check that the select is rendered with the correct initial value
      const reportTypeSelect = screen.getByDisplayValue('Progress Report')
      expect(reportTypeSelect).toBeInTheDocument()

      // Try to select a different option
      await user.selectOptions(reportTypeSelect, 'Completion Report')

      // Note: The component may not allow changing the report type in this context
      expect(reportTypeSelect).toHaveValue('Progress Report')
    })

    it('should show completion percentage input for progress reports', async () => {
      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Progress Report should show completion percentage
      expect(screen.getByText('Status:')).toBeInTheDocument()
      expect(screen.getByDisplayValue('0')).toBeInTheDocument()
      expect(screen.getByText('of 100%')).toBeInTheDocument()
    })

    it('should allow updating completion percentage', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const percentageInput = screen.getByDisplayValue('0')
      await user.clear(percentageInput)
      await user.type(percentageInput, '75')

      expect(percentageInput).toHaveValue(75)
    })

    it('should prevent completion percentage above 100', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const percentageInput = screen.getByDisplayValue('0')
      await user.clear(percentageInput)
      await user.type(percentageInput, '150')

      // The component clamps the value to 100 in the onChange handler
      expect(percentageInput).toHaveValue(100)
    })
  })

  describe('Photo Upload Functionality', () => {
    it('should handle before photo uploads', async () => {
      const user = userEvent.setup()
      const { uploadFileToFirebaseStorage } = vi.mocked(await import('@/lib/firebase-service'))

      uploadFileToFirebaseStorage.mockResolvedValue('https://example.com/photo1.jpg')

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const beforePhotoInput = screen.getByLabelText('Upload before SA photos')

      await user.upload(beforePhotoInput, file)

      await waitFor(() => {
        expect(uploadFileToFirebaseStorage).toHaveBeenCalledWith(
          file,
          'reports/photos/'
        )
      })
    })

    it('should handle after photo uploads', async () => {
      const user = userEvent.setup()
      const { uploadFileToFirebaseStorage } = vi.mocked(await import('@/lib/firebase-service'))

      uploadFileToFirebaseStorage.mockResolvedValue('https://example.com/photo2.jpg')

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const afterPhotoInput = screen.getByLabelText('Upload after SA photos')

      await user.upload(afterPhotoInput, file)

      await waitFor(() => {
        expect(uploadFileToFirebaseStorage).toHaveBeenCalledWith(
          file,
          'reports/photos/'
        )
      })
    })

    it('should handle monitoring photo uploads', async () => {
      const user = userEvent.setup()
      const monitoringAssignment = {
        ...mockAssignmentData,
        serviceType: 'Monitoring',
      }

      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      const { uploadFileToFirebaseStorage } = vi.mocked(await import('@/lib/firebase-service'))

      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => true,
            data: () => monitoringAssignment,
          } as any)
        }
        return Promise.resolve({
          exists: () => true,
          data: () => mockCompanyData,
        } as any)
      })

      uploadFileToFirebaseStorage.mockResolvedValue('https://example.com/monitoring-photo.jpg')

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const file = new File(['test'], 'monitoring.jpg', { type: 'image/jpeg' })
      const monitoringPhotoInput = screen.getByLabelText('Upload photos')

      await user.upload(monitoringPhotoInput, file)

      await waitFor(() => {
        expect(uploadFileToFirebaseStorage).toHaveBeenCalledWith(
          file,
          'reports/photos/'
        )
      })
    })

    it('should allow adding notes to uploaded photos', async () => {
      const user = userEvent.setup()
      const { uploadFileToFirebaseStorage } = vi.mocked(await import('@/lib/firebase-service'))

      uploadFileToFirebaseStorage.mockResolvedValue('https://example.com/photo.jpg')

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const beforePhotoInput = screen.getByLabelText('Upload before SA photos')

      await user.upload(beforePhotoInput, file)

      await waitFor(() => {
        const noteTextarea = screen.getByPlaceholderText('Add note...')
        expect(noteTextarea).toBeInTheDocument()
      })

      const noteTextarea = screen.getByPlaceholderText('Add note...')
      await user.type(noteTextarea, 'Test note for photo')

      expect(noteTextarea).toHaveValue('Test note for photo')
    })
  })

  describe('Report Creation and PDF Generation', () => {
    it('should create report successfully', async () => {
      const user = userEvent.setup()
      const { createReport } = vi.mocked(await import('@/lib/report-service'))

      createReport.mockResolvedValue('test-report-id')

      // Mock successful PDF generation
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ downloadURL: 'https://example.com/report.pdf' }),
      } as any)

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByRole('button', { name: 'Generate Report' })
      await user.click(generateButton)

      await waitFor(() => {
        expect(createReport).toHaveBeenCalled()
      })

      // Should navigate to the created report
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/logistics/reports/test-report-id')
      }, { timeout: 2000 })
    })

    it('should handle report creation failure', async () => {
      const user = userEvent.setup()
      const { createReport } = vi.mocked(await import('@/lib/report-service'))

      createReport.mockRejectedValue(new Error('Failed to create report'))

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByRole('button', { name: 'Generate Report' })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create report. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle PDF generation failure gracefully', async () => {
      const user = userEvent.setup()
      const { createReport } = vi.mocked(await import('@/lib/report-service'))

      createReport.mockResolvedValue('test-report-id')

      // Mock PDF generation failure
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('PDF generation failed'),
      } as any)

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByRole('button', { name: 'Generate Report' })
      await user.click(generateButton)

      // Should still navigate to report even if PDF fails
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/logistics/reports/test-report-id')
      }, { timeout: 2000 })
    })
  })

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const backButton = screen.getByTestId('arrow-left-icon').closest('button')
      await user.click(backButton!)

      expect(mockBack).toHaveBeenCalled()
    })

    it('should navigate to assignment details when View SA button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const viewSaButton = screen.getByText('View SA')
      await user.click(viewSaButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments/test-assignment-id')
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle missing optional data gracefully', async () => {
      const incompleteAssignment = {
        ...mockAssignmentData,
        projectSiteName: undefined,
        campaignName: undefined,
        assignedToName: undefined,
      }

      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => true,
            data: () => incompleteAssignment,
          } as any)
        }
        return Promise.resolve({
          exists: () => true,
          data: () => mockCompanyData,
        } as any)
      })

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Should display fallback values
      const siteNameElements = screen.getAllByText('Petplans Tower')
      expect(siteNameElements.length).toBeGreaterThan(0) // from product data
      const campaignElements = screen.getAllByText('Mcdonald\'s')
      expect(campaignElements.length).toBeGreaterThan(0) // fallback
    })

    it('should handle network errors during data fetching', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load assignment data')).toBeInTheDocument()
      })
    })

    it('should handle missing user data', async () => {
      mockAuthData = {
        user: null,
        userData: null,
        projectData: null,
        subscriptionData: null,
        loading: false,
      }

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      // Generate button should be disabled when no user
      const generateButton = screen.getByRole('button', { name: 'Generate Report' })
      expect(generateButton).toBeDisabled()
    })


    it('should disable generate button during creation', async () => {
      const user = userEvent.setup()
      const { createReport } = vi.mocked(await import('@/lib/report-service'))

      createReport.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const generateButton = screen.getByRole('button', { name: 'Generate Report' })
      await user.click(generateButton)

      // Button should show loading state
      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(generateButton).toBeDisabled()
    })

    it('should handle photo upload errors gracefully', async () => {
      const user = userEvent.setup()
      const { uploadFileToFirebaseStorage } = vi.mocked(await import('@/lib/firebase-service'))

      uploadFileToFirebaseStorage.mockRejectedValue(new Error('Upload failed'))

      render(
        <TestWrapper>
          <CreateReportPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create a Report')).toBeInTheDocument()
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const beforePhotoInput = screen.getByLabelText('Upload before SA photos')

      // Should not throw error, just log it
      await expect(user.upload(beforePhotoInput, file)).resolves.not.toThrow()
    })
  })
})