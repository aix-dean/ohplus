import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ViewServiceAssignmentPage from '@/app/logistics/assignments/[id]/page'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'f8EalouBbTCALiTSzYHX' }),
}))

// Mock React's use hook for params
vi.mock('react', async () => {
  const actualReact = await vi.importActual('react')
  return {
    ...actualReact,
    use: vi.fn(() => {
      // For testing, return the resolved value immediately
      return { id: 'f8EalouBbTCALiTSzYHX' }
    }),
  }
})

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

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    userData: mockUserData,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock teams service
vi.mock('@/lib/teams-service', () => ({
  teamsService: {
    getAllTeams: vi.fn(),
  },
}))

// Mock PDF service
vi.mock('@/lib/pdf-service', () => ({
  generateServiceAssignmentDetailsPDF: vi.fn(),
}))

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}))

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ path: `${collection}/${id}` })),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="dropdown-menu-item">{children}</button>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}))

vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Printer: () => <div data-testid="printer-icon" />,
  Share: () => <div data-testid="share-icon" />,
  X: () => <div data-testid="x-icon" />,
  Download: () => <div data-testid="download-icon" />,
}))

// Mock custom components
vi.mock('@/components/logistics/assignments/view/ServiceAssignmentViewForm', () => ({
  ServiceAssignmentViewForm: vi.fn(),
}))

vi.mock('@/components/logistics/assignments/view/ServiceAssignmentSummaryBar', () => ({
  ServiceAssignmentSummaryBar: vi.fn(),
}))

vi.mock('@/components/logistics/assignments/CreateReportDialog', () => ({
  CreateReportDialog: vi.fn(),
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'January 1, 2024'),
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    {children}
    <Toaster />
  </AuthProvider>
)

// Mock implementations for components - moved to beforeEach

// Mock data
const mockAssignmentData = {
  id: 'f8EalouBbTCALiTSzYHX',
  saNumber: 'SA-001',
  serviceType: 'Installation',
  projectSiteName: 'Test Site',
  projectSiteLocation: 'Test Location',
  status: 'Active',
  created: new Date(),
  jobOrderId: 'test-job-order-id',
  assignedTo: 'test-user-id',
  assignedToName: 'Test User',
  serviceDuration: 8,
  priority: 'High',
  equipmentRequired: 'Ladder, Tools',
  materialSpecs: 'Digital materials',
  crew: 'team-1',
  illuminationNits: '2000',
  gondola: 'Yes',
  technology: 'LED',
  sales: 'John Doe',
  remarks: 'Urgent installation',
  message: 'Please complete ASAP',
  jobDescription: 'Install billboard',
  requestedBy: {
    name: 'Jane Smith',
    department: 'Operations'
  },
  coveredDateStart: new Date('2024-01-01'),
  coveredDateEnd: new Date('2024-01-02'),
  alarmDate: new Date('2024-01-01'),
  alarmTime: '08:00',
  pdfUrl: 'https://example.com/test.pdf',
  serviceExpenses: [
    { name: 'Labor', amount: '5000' },
    { name: 'Materials', amount: '2000' }
  ]
}

const mockJobOrderData = {
  id: 'test-job-order-id',
  joNumber: 'JO-001',
  title: 'Test Job Order',
  siteName: 'Test Site',
  siteCode: 'TS001',
  siteLocation: 'Test Location',
  siteType: 'Billboard',
  siteSize: '10x20',
  requestedBy: 'Jane Smith',
  assignTo: 'Test User',
  dateRequested: new Date(),
  deadline: new Date(),
  clientCompany: 'Test Company',
  clientName: 'John Client',
  quotationNumber: 'Q-001',
  totalAmount: 7000,
  vatAmount: 700,
  contractDuration: '1 month',
  jobDescription: 'Install billboard',
  remarks: 'Urgent',
  attachments: [
    { url: 'https://example.com/image1.jpg', name: 'site-image1.jpg' }
  ],
  siteImageUrl: 'https://example.com/site-image.jpg',
  poMo: true,
  projectFa: true,
  signedQuotation: true,
  joType: 'Installation',
  status: 'Active'
}

const mockProducts = [
  {
    id: 'product-1',
    name: 'Test Product',
    site_code: 'TP001',
    deleted: false,
    specs_rental: {
      location: 'Test Location',
      traffic_count: 10000,
      elevation: 50,
      height: 10,
      width: 20,
      material: 'Digital',
      illumination: 'LED',
      gondola: true,
      technology: 'LED'
    }
  }
]

const mockTeams = [
  {
    id: 'team-1',
    name: 'Test Team',
    description: 'Test team description',
    teamType: 'installation' as const,
    status: 'active' as const,
    leaderId: 'leader-1',
    leaderName: 'Team Leader',
    members: [],
    specializations: ['Installation'],
    location: 'Test Location',
    contactNumber: '123-456-7890',
    email: 'team@test.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user-id',
    company_id: 'test-company-id'
  }
]

describe('ViewServiceAssignmentPage - Comprehensive Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup default mocks
    const { getDoc, doc, collection, query, where, orderBy, limit, getDocs, updateDoc, serverTimestamp } = await import('firebase/firestore')
    const { generateServiceAssignmentDetailsPDF } = await import('@/lib/pdf-service')

    // Mock assignment fetch
    vi.mocked(getDoc).mockImplementation((docRef: any) => {
      if (docRef.path.includes('service_assignments')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockAssignmentData,
        } as any)
      } else if (docRef.path.includes('job_orders')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockJobOrderData,
        } as any)
      }
      return Promise.resolve({
        exists: () => false,
        data: () => null,
      } as any)
    })

    // Mock products fetch
    vi.mocked(getDocs).mockResolvedValue({
      forEach: (callback: any) => {
        mockProducts.forEach((product, index) => {
          callback({
            id: product.id,
            data: () => product,
          })
        })
      },
    } as any)

    // Mock teams fetch
    const mockedTeamsService = await import('@/lib/teams-service')
    vi.mocked(mockedTeamsService.teamsService.getAllTeams).mockResolvedValue(mockTeams)

    // Mock PDF generation
    vi.mocked(generateServiceAssignmentDetailsPDF).mockResolvedValue('mock-pdf-base64')

    // Mock updateDoc for cancellation
    vi.mocked(updateDoc).mockResolvedValue(undefined)

    // Setup component mocks
    const { ServiceAssignmentViewForm } = vi.mocked(await import('@/components/logistics/assignments/view/ServiceAssignmentViewForm'))
    const { ServiceAssignmentSummaryBar } = vi.mocked(await import('@/components/logistics/assignments/view/ServiceAssignmentSummaryBar'))
    const { CreateReportDialog } = vi.mocked(await import('@/components/logistics/assignments/CreateReportDialog'))

    ServiceAssignmentViewForm.mockImplementation(({ assignmentData }: any) => (
      <div data-testid="service-assignment-view-form">
        {assignmentData?.saNumber || 'No assignment data'}
      </div>
    ))

    ServiceAssignmentSummaryBar.mockImplementation(({ onCancelSA, onPrint, onDownload, onCreateReport }: any) => (
      <div data-testid="service-assignment-summary-bar">
        <button onClick={onCancelSA} data-testid="cancel-sa-button">Cancel SA</button>
        <button onClick={onPrint} data-testid="print-button">Print</button>
        <button onClick={onDownload} data-testid="download-button">Download</button>
        <button onClick={onCreateReport} data-testid="create-report-button">Create Report</button>
      </div>
    ))

    CreateReportDialog.mockImplementation(({ open, onOpenChange, assignmentId }: any) => (
      open ? <div data-testid="create-report-dialog">Create Report Dialog</div> : undefined
    ))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Page Loading and Data Fetching', () => {
    it('should display loading state initially', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading assignment...')).toBeInTheDocument()
    })

    it('should fetch assignment data with correct ID', async () => {
      const { getDoc, doc } = vi.mocked(await import('firebase/firestore'))

      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalledWith(doc(expect.any(Object), 'service_assignments', 'f8EalouBbTCALiTSzYHX'))
      })
    })

    it('should fetch job order data when jobOrderId is present', async () => {
      const { getDoc, doc } = vi.mocked(await import('firebase/firestore'))

      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalledWith(doc(expect.any(Object), 'job_orders', 'test-job-order-id'))
      })
    })

    it('should fetch products data', async () => {
      const { getDocs, collection, query, where, orderBy, limit } = vi.mocked(await import('firebase/firestore'))

      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled()
        expect(query).toHaveBeenCalledWith(
          collection(expect.any(Object), 'products'),
          where('deleted', '==', false),
          orderBy('name', 'asc'),
          limit(100)
        )
      })
    })

    it('should fetch teams data', async () => {
      const mockedTeamsService = vi.mocked(await import('@/lib/teams-service'))

      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(mockedTeamsService.teamsService.getAllTeams).toHaveBeenCalled()
      })
    })

    it('should render assignment data after loading', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ViewServiceAssignmentPage />
          </TestWrapper>
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      expect(screen.getByText('View Service Assignment')).toBeInTheDocument()
      expect(screen.getByTestId('service-assignment-view-form')).toBeInTheDocument()
    })
  })

  describe('Rendering Assignment Data in ServiceAssignmentViewForm', () => {
    it('should pass correct props to ServiceAssignmentViewForm', async () => {
      const { ServiceAssignmentViewForm } = vi.mocked(await import('@/components/logistics/assignments/view/ServiceAssignmentViewForm'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(ServiceAssignmentViewForm).toHaveBeenCalledWith(
          expect.objectContaining({
            assignmentData: mockAssignmentData,
            products: mockProducts,
            teams: mockTeams,
            jobOrderData: mockJobOrderData,
          }),
          undefined
        )
      })
    })

    it('should display assignment SA number in the form', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-view-form')).toHaveTextContent('SA-001')
      })
    })
  })

  describe('PDF Loading from URL and Fallback Generation', () => {
    it('should attempt to load PDF from URL when available', async () => {
      // Mock fetch for PDF URL loading
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/pdf' }),
        blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
      })

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://example.com/test.pdf',
          expect.objectContaining({
            method: 'GET',
            headers: { 'Accept': 'application/pdf' },
            signal: expect.any(AbortSignal)
          })
        )
      })
    })

    it('should fallback to PDF generation when URL fetch fails', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const { generateServiceAssignmentDetailsPDF } = vi.mocked(await import('@/lib/pdf-service'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(generateServiceAssignmentDetailsPDF).toHaveBeenCalledWith(
          mockAssignmentData,
          mockJobOrderData,
          mockProducts,
          mockTeams,
          true
        )
      })
    })

    it('should generate PDF when no URL is available', async () => {
      // Mock assignment without pdfUrl
      const assignmentWithoutUrl = { ...mockAssignmentData, pdfUrl: null }
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => true,
            data: () => assignmentWithoutUrl,
          } as any)
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      const { generateServiceAssignmentDetailsPDF } = vi.mocked(await import('@/lib/pdf-service'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(generateServiceAssignmentDetailsPDF).toHaveBeenCalled()
      })
    })

    it('should handle PDF generation errors gracefully', async () => {
      const { generateServiceAssignmentDetailsPDF } = vi.mocked(await import('@/lib/pdf-service'))
      generateServiceAssignmentDetailsPDF.mockRejectedValue(new Error('PDF generation failed'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load PDF file. Please try refreshing the page.',
          variant: 'destructive'
        })
      })
    })
  })

  describe('Print and Download PDF Functionality', () => {
    it('should handle print functionality', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('print-button')).toBeInTheDocument()
      })

      const printButton = screen.getByTestId('print-button')
      fireEvent.click(printButton)

      expect(global.window.open).toHaveBeenCalled()
    })

    it('should handle download functionality', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('download-button')).toBeInTheDocument()
      })

      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  describe('Create Report Dialog Opening', () => {
    it('should open create report dialog when button is clicked', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('create-report-button')).toBeInTheDocument()
      })

      const createReportButton = screen.getByTestId('create-report-button')
      fireEvent.click(createReportButton)

      expect(screen.getByTestId('create-report-dialog')).toBeInTheDocument()
    })

    it('should pass correct props to CreateReportDialog', async () => {
      const { CreateReportDialog } = vi.mocked(await import('@/components/logistics/assignments/CreateReportDialog'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(CreateReportDialog).toHaveBeenCalledWith(
          expect.objectContaining({
            assignmentId: 'f8EalouBbTCALiTSzYHX',
            open: false,
            onOpenChange: expect.any(Function)
          }),
          undefined
        )
      })
    })
  })

  describe('Cancel SA Functionality with Specific ID', () => {
    it('should cancel service assignment with correct ID', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('cancel-sa-button')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')
      await user.click(cancelButton)

      const { updateDoc, doc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        doc(expect.any(Object), 'service_assignments', 'f8EalouBbTCALiTSzYHX'),
        expect.objectContaining({
          status: 'Cancelled',
          cancelled_by_uid: 'test-user-id'
        })
      )
    })

    it('should display success message after cancellation', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('cancel-sa-button')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')
      await user.click(cancelButton)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Service assignment has been cancelled successfully.',
      })
    })

    it('should navigate to assignments list after successful cancellation', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('cancel-sa-button')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')
      await user.click(cancelButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
    })
  })

  describe('Error Handling for Data Fetching Failures', () => {
    it('should handle assignment fetch error', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockRejectedValue(new Error('Database error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load service assignment.',
          variant: 'destructive'
        })
      })
    })

    it('should handle assignment not found', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => false,
            data: () => null,
          } as any)
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Assignment not found',
          description: 'The service assignment you\'re looking for doesn\'t exist.',
          variant: 'destructive'
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
    })

    it('should handle products fetch error gracefully', async () => {
      const { getDocs } = vi.mocked(await import('firebase/firestore'))
      getDocs.mockRejectedValue(new Error('Products fetch error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })
    })

    it('should handle teams fetch error gracefully', async () => {
      const mockedTeamsService = await import('@/lib/teams-service')
      vi.mocked(mockedTeamsService.teamsService.getAllTeams).mockRejectedValue(new Error('Teams fetch error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation (Back Button, Success Redirects)', () => {
    it('should navigate back when back button is clicked', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
      })

      const backButton = screen.getByTestId('arrow-left-icon').closest('button')
      expect(backButton).toBeInTheDocument()

      fireEvent.click(backButton!)
      expect(mockBack).toHaveBeenCalled()
    })

    it('should redirect to assignments list on successful cancellation', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('cancel-sa-button')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')
      await user.click(cancelButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
    })
  })

  describe('Loading States and UI Feedback', () => {
    it('should show loading state during initial data fetch', () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading assignment...')).toBeInTheDocument()
    })

    it('should hide loading state after data is loaded', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument()
      })

      expect(screen.queryByText('Loading assignment...')).not.toBeInTheDocument()
    })

    it('should show assignment not found when data is null', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      } as any)

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Assignment not found')).toBeInTheDocument()
      })
    })
  })

  describe('Assignment Not Found Scenarios', () => {
    it('should display not found message when assignment does not exist', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => false,
            data: () => null,
          } as any)
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Assignment not found')).toBeInTheDocument()
      })
    })

    it('should redirect to assignments list when assignment not found', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => false,
            data: () => null,
          } as any)
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
      })
    })

    it('should show error toast when assignment not found', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => false,
            data: () => null,
          } as any)
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Assignment not found',
          description: 'The service assignment you\'re looking for doesn\'t exist.',
          variant: 'destructive'
        })
      })
    })
  })
})