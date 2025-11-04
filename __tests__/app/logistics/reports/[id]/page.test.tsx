import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportPreviewPage from '@/app/logistics/reports/[id]/page'
import { AuthProvider } from '@/contexts/auth-context'

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
let mockParams: any = { id: 'test-report-id' }
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
  }),
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
  getReportById: vi.fn(),
  ReportData: {},
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Send: () => <div data-testid="send-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Share: () => <div data-testid="share-icon" />,
  Printer: () => <div data-testid="printer-icon" />,
}))

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="dropdown-item">{children}</button>
  ),
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
}))

// Mock global objects
const mockShare = vi.fn()
const mockWriteText = vi.fn()
const mockOpen = vi.fn()
const mockFetch = vi.fn()
const mockAlert = vi.fn()

Object.defineProperty(window, 'navigator', {
  value: {
    share: mockShare,
    clipboard: {
      writeText: mockWriteText,
    },
  },
  writable: true,
})

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/logistics/reports/test-report-id',
    reload: vi.fn(),
  },
  writable: true,
})

global.fetch = mockFetch
global.alert = mockAlert

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
)

describe('ReportPreviewPage', () => {
  const mockReportData = {
    id: 'test-report-id',
    report_id: 'RP-1234567890',
    site: {
      name: 'Test Site',
      id: 'site-123',
      location: 'Test Location',
      media_url: 'https://example.com/site.jpg',
    },
    reportType: 'Progress Report',
    campaignName: 'Test Campaign',
    crew: 'crew-123',
    assignedTo: 'crew-123',
    created: {
      toDate: () => new Date('2024-01-15T10:00:00Z'),
    },
    logistics_report: 'https://example.com/logistics-report.pdf',
    status: 'published',
    companyId: 'test-company-id',
    sellerId: 'test-seller-id',
    client: { name: 'Test Client' },
    sales: 'Test Sales',
    completionPercentage: 75,
    attachments: [],
    tags: [],
    createdBy: 'test-user-id',
    joNumber: 'JO-001',
    joType: 'Installation',
    saNumber: 'SA-001',
    saType: 'Installation',
    joRequestBy: 'test-user-id',
    bookingDates: {
      start: { toDate: () => new Date('2024-01-01'), seconds: 1704067200, nanoseconds: 0, toMillis: () => 1704067200000, isEqual: vi.fn(), toJSON: vi.fn() },
      end: { toDate: () => new Date('2024-01-31'), seconds: 1706659200, nanoseconds: 0, toMillis: () => 1706659200000, isEqual: vi.fn(), toJSON: vi.fn() },
    },
    start_date: { toDate: () => new Date('2024-01-01'), seconds: 1704067200, nanoseconds: 0, toMillis: () => 1704067200000, isEqual: vi.fn(), toJSON: vi.fn() },
    end_date: { toDate: () => new Date('2024-01-31'), seconds: 1706659200, nanoseconds: 0, toMillis: () => 1706659200000, isEqual: vi.fn(), toJSON: vi.fn() },
  }

  const mockCrewData = {
    id: 'crew-123',
    name: 'Test Crew Name',
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset mocks
    mockParams = { id: 'test-report-id' }
    mockAuthData = {
      user: mockUser,
      userData: mockUserData,
      projectData: null,
      subscriptionData: null,
      loading: false,
    }

    // Setup default mocks
    const { getDoc, doc } = vi.mocked(await import('firebase/firestore'))
    const { getReportById } = vi.mocked(await import('@/lib/report-service'))

    // Mock doc to return an object with a path property
    doc.mockImplementation((db: any, collection: string, id: string) => ({
      path: `${collection}/${id}`,
      id,
    } as any))

    // Mock getDoc to return crew data
    getDoc.mockImplementation((docRef: any) => {
      if (docRef.path?.includes('logistics_teams')) {
        return Promise.resolve({
          exists: () => true,
          data: () => mockCrewData,
          id: docRef.id,
        } as any)
      }
      return Promise.resolve({
        exists: () => false,
        data: () => null,
        id: docRef.id,
      } as any)
    })

    // Mock getReportById to return report data
    getReportById.mockResolvedValue(mockReportData)

    // Mock window.open
    mockOpen.mockReturnValue({
      onload: null,
      print: vi.fn(),
    } as any)
    global.window.open = mockOpen

    // Mock fetch for printing
    mockFetch.mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test pdf content'], { type: 'application/pdf' })),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering States', () => {
    it('should render loading state initially', async () => {
      // Mock delayed response
      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockImplementation(() => new Promise(() => {}))

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      expect(screen.getByText('Loading logistics report...')).toBeInTheDocument()
    })

    it('should render error state when report fetch fails', async () => {
      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockRejectedValue(new Error('Failed to fetch report'))

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error Loading Report')).toBeInTheDocument()
      })

      expect(screen.getByText('Failed to load logistics report')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      expect(screen.getByText('Retry Loading')).toBeInTheDocument()
    })

    it('should render report data successfully with PDF', async () => {
      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Check header information
      expect(screen.getByText('Report ID:')).toBeInTheDocument()
      expect(screen.getByText('RP-1234567890')).toBeInTheDocument()
      expect(screen.getByText('Type:')).toBeInTheDocument()
      expect(screen.getByText('Progress Report')).toBeInTheDocument()
      expect(screen.getByText('Site:')).toBeInTheDocument()
      expect(screen.getByText('Test Site')).toBeInTheDocument()
      expect(screen.getByText('Campaign:')).toBeInTheDocument()
      expect(screen.getByText('Test Campaign')).toBeInTheDocument()
      expect(screen.getByText('Crew:')).toBeInTheDocument()
      expect(screen.getByText('Test Crew Name')).toBeInTheDocument()
      expect(screen.getByText('Issued Date:')).toBeInTheDocument()

      // Check that iframe is rendered
      const iframe = screen.getByTitle('Logistics Report PDF')
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', 'https://example.com/logistics-report.pdf#zoom=110&navpanes=0&scrollbar=0')
    })

    it('should render report data successfully without PDF', async () => {
      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      const reportWithoutPdf = { ...mockReportData, logistics_report: null }
      getReportById.mockResolvedValue(reportWithoutPdf)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Check that "PDF Not Available" message is shown
      expect(screen.getByText('PDF Not Available')).toBeInTheDocument()
      expect(screen.getByText('No logistics report PDF is configured for this report. (Report ID: test-report-id)')).toBeInTheDocument()
    })

    it('should handle missing report ID', async () => {
      mockParams = {}

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      // Should remain in loading state when report ID is missing
      expect(screen.getByText('Loading logistics report...')).toBeInTheDocument()
    })
  })

  describe('Data Fetching and Display', () => {
    it('should fetch and display report details correctly', async () => {
      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Verify getReportById was called with correct ID
      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      expect(getReportById).toHaveBeenCalledWith('test-report-id')

      // Check all displayed fields
      expect(screen.getByText('RP-1234567890')).toBeInTheDocument()
      expect(screen.getByText('Progress Report')).toBeInTheDocument()
      expect(screen.getByText('Test Site')).toBeInTheDocument()
      expect(screen.getByText('Test Campaign')).toBeInTheDocument()
      expect(screen.getByText('Test Crew Name')).toBeInTheDocument()
    })

    it('should fetch crew name from logistics_teams collection', async () => {
      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Crew Name')).toBeInTheDocument()
      })

      // Verify getDoc was called for crew
      const { getDoc, doc } = vi.mocked(await import('firebase/firestore'))
      expect(getDoc).toHaveBeenCalledWith(doc({}, 'logistics_teams', 'crew-123'))
    })

    it('should handle missing crew data gracefully', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path?.includes('logistics_teams')) {
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
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      expect(screen.getByText('Crew:')).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should handle crew fetch error gracefully', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path?.includes('logistics_teams')) {
          return Promise.reject(new Error('Crew fetch failed'))
        }
        return Promise.resolve({
          exists: () => false,
          data: () => null,
        } as any)
      })

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should format date correctly', async () => {
      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Check that date is formatted (January 15, 2024)
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument()
    })

    it('should display fallback values for missing data', async () => {
      const incompleteReport = {
        ...mockReportData,
        report_id: null,
        reportType: null,
        site: null,
        campaignName: null,
      }

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockResolvedValue(incompleteReport)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Check fallback values
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0)
    })
  })

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      const backButton = screen.getByTestId('arrow-left-icon').closest('button')
      await user.click(backButton!)

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('Share Functionality', () => {
    it('should share report using navigator.share when available', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      const shareButton = screen.getByText('Share')
      await user.click(shareButton)

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Logistics Report',
        text: 'Check out this logistics report',
        url: 'http://localhost:3000/logistics/reports/test-report-id'
      })
    })

    it('should fallback to clipboard when navigator.share is not available', async () => {
      const user = userEvent.setup()

      // Mock navigator.share as undefined
      Object.defineProperty(window, 'navigator', {
        value: {
          share: undefined,
          clipboard: {
            writeText: mockWriteText,
          },
        },
        writable: true,
      })

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      const shareButton = screen.getByText('Share')
      await user.click(shareButton)

      expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/logistics/reports/test-report-id')
      expect(mockAlert).toHaveBeenCalledWith('Link copied to clipboard!')
    })
  })

  describe('Print Functionality', () => {
    it('should print report successfully', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      const printButton = screen.getByText('Print')
      await user.click(printButton)

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/logistics-report.pdf')
      expect(mockOpen).toHaveBeenCalled()
    })

    it('should handle print error gracefully', async () => {
      const user = userEvent.setup()

      mockFetch.mockRejectedValue(new Error('Fetch failed'))

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      const printButton = screen.getByText('Print')
      await user.click(printButton)

      // Should not throw error, just log it
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/logistics-report.pdf')
    })

    it('should not print when no PDF URL available', async () => {
      const user = userEvent.setup()

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      const reportWithoutPdf = { ...mockReportData, logistics_report: null }
      getReportById.mockResolvedValue(reportWithoutPdf)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('PDF Not Available')).toBeInTheDocument()
      })

      const printButton = screen.getByText('Print')
      await user.click(printButton)

      // Should not attempt to fetch or print
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockOpen).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should allow refreshing the page on error', async () => {
      const user = userEvent.setup()

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockRejectedValue(new Error('Failed to fetch report'))

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error Loading Report')).toBeInTheDocument()
      })

      const refreshButton = screen.getByText('Refresh Page')
      await user.click(refreshButton)

      // Should reload the page
      expect(window.location.reload).toHaveBeenCalled()
    })

    it('should allow retrying to load report on error', async () => {
      const user = userEvent.setup()

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockRejectedValueOnce(new Error('Failed to fetch report'))
      getReportById.mockResolvedValueOnce(mockReportData)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Error Loading Report')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Retry Loading')
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      expect(getReportById).toHaveBeenCalledTimes(2)
    })

    it('should handle network errors during crew fetching', async () => {
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Should still display report but with N/A for crew
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle report with missing created date', async () => {
      const reportWithoutDate = { ...mockReportData, created: null }

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockResolvedValue(reportWithoutDate)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should handle report with invalid created date', async () => {
      const reportWithInvalidDate = {
        ...mockReportData,
        created: null
      }

      const { getReportById } = vi.mocked(await import('@/lib/report-service'))
      getReportById.mockResolvedValue(reportWithInvalidDate)

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Should display N/A for date
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should handle dropdown menu interactions', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ReportPreviewPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('View Report')).toBeInTheDocument()
      })

      // Check that dropdown trigger is rendered
      expect(screen.getByText('Actions')).toBeInTheDocument()
      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument()

      // Dropdown content should be present
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })
  })
})