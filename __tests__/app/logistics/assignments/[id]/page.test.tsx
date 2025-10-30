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
  useParams: () => ({ id: 'test-assignment-id' }),
}))

// Mock React's use hook for params
vi.mock('react', async () => {
  const actualReact = await vi.importActual('react')
  return {
    ...actualReact,
    use: vi.fn(() => {
      // For testing, return the resolved value immediately
      return { id: 'test-assignment-id' }
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
  ServiceAssignmentViewForm: ({ assignmentData }: any) => (
    <div data-testid="service-assignment-view-form">
      {assignmentData?.saNumber || 'No assignment data'}
    </div>
  ),
}))

vi.mock('@/components/logistics/assignments/view/ServiceAssignmentSummaryBar', () => ({
  ServiceAssignmentSummaryBar: ({ onCancelSA }: any) => (
    <div data-testid="service-assignment-summary-bar">
      <button onClick={onCancelSA} data-testid="cancel-sa-button">Cancel SA</button>
    </div>
  ),
}))

vi.mock('@/components/logistics/assignments/CreateReportDialog', () => ({
  CreateReportDialog: ({ open }: { open: boolean }) => (
    open ? <div data-testid="create-report-dialog">Create Report Dialog</div> : null
  ),
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

describe('ViewServiceAssignmentPage - Cancel SA Functionality', () => {
  const mockAssignmentData = {
    id: 'test-assignment-id',
    saNumber: 'SA-001',
    serviceType: 'Installation',
    projectSiteName: 'Test Site',
    status: 'Active',
    created: new Date(),
    jobOrderId: 'test-job-order-id',
  }

  const mockJobOrderData = {
    id: 'test-job-order-id',
    title: 'Test Job Order',
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup default mocks
    const { getDoc, doc, collection, query, where, orderBy, limit, getDocs, updateDoc, serverTimestamp } = vi.mocked(await import('firebase/firestore'))
    const { generateServiceAssignmentDetailsPDF } = vi.mocked(await import('@/lib/pdf-service'))

    // Mock assignment fetch
    getDoc.mockImplementation((docRef: any) => {
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
    getDocs.mockResolvedValue({
      forEach: (callback: any) => {
        callback({
          id: 'product-1',
          data: () => ({
            name: 'Test Product',
            deleted: false,
          }),
        })
      },
    } as any)

    // Mock teams fetch
    const mockedTeamsService = vi.mocked(await import('@/lib/teams-service'))
    mockedTeamsService.teamsService.getAllTeams = vi.fn().mockResolvedValue([
      {
        id: 'team-1',
        name: 'Test Team',
        status: 'active',
      },
    ])

    // Mock PDF generation
    generateServiceAssignmentDetailsPDF.mockResolvedValue('mock-pdf-base64')

    // Mock updateDoc for cancellation
    updateDoc.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Cancel SA Button Interaction', () => {
    it('should render the Cancel SA button in the actions dropdown', async () => {
      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).toHaveTextContent('Cancel SA')
    })

    it('should call handleCancelSA when Cancel SA button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      // Verify updateDoc was called with correct parameters
      const { updateDoc, doc, serverTimestamp } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        doc(expect.any(Object), 'service_assignments', 'test-assignment-id'),
        {
          status: 'Cancelled',
          cancellation_date: serverTimestamp(),
          cancelled_by_uid: 'test-user-id',
        }
      )
    })
  })

  describe('Successful Cancellation Flow', () => {
    it('should update service_assignments data with status "Cancelled"', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'Cancelled',
        })
      )
    })

    it('should add cancellation_date with serverTimestamp', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      const { updateDoc, serverTimestamp } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          cancellation_date: serverTimestamp(),
        })
      )
    })

    it('should add cancelled_by_uid with current user ID', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          cancelled_by_uid: 'test-user-id',
        })
      )
    })

    it('should display success toast message', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Service assignment has been cancelled successfully.',
      })
    })

    it('should navigate to /logistics/assignments after successful cancellation', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
    })
  })

  describe('Error Handling During Cancellation', () => {
    it('should display error toast when cancellation fails', async () => {
      const user = userEvent.setup()

      // Mock updateDoc to reject
      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      updateDoc.mockRejectedValue(new Error('Database error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to cancel service assignment. Please try again.',
        variant: 'destructive',
      })
    })

    it('should not navigate when cancellation fails', async () => {
      const user = userEvent.setup()

      // Mock updateDoc to reject
      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      updateDoc.mockRejectedValue(new Error('Database error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock updateDoc to reject with network error
      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      updateDoc.mockRejectedValue(new Error('Network error'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to cancel service assignment. Please try again.',
        variant: 'destructive',
      })
    })
  })

  describe('Edge Cases', () => {
    it('should not proceed with cancellation when assignmentId is missing', async () => {
      // Mock params to return undefined id
      vi.mocked(await import('react')).use.mockReturnValue({ id: undefined })

      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).not.toHaveBeenCalled()
      expect(mockToast).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not proceed with cancellation when user is not authenticated', async () => {
      // Mock auth to return no user
      vi.mocked(await import('@/contexts/auth-context')).useAuth.mockReturnValue({
        user: null,
        userData: null,
        projectData: null,
        subscriptionData: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUserData: vi.fn(),
        refreshProjectData: vi.fn(),
        refreshSubscriptionData: vi.fn(),
      } as any)

      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).not.toHaveBeenCalled()
      expect(mockToast).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle cancellation of already cancelled assignments', async () => {
      const user = userEvent.setup()

      // Mock assignment data with already cancelled status
      const cancelledAssignment = { ...mockAssignmentData, status: 'Cancelled' }
      const { getDoc } = vi.mocked(await import('firebase/firestore'))
      getDoc.mockImplementation((docRef: any) => {
        if (docRef.path.includes('service_assignments')) {
          return Promise.resolve({
            exists: () => true,
            data: () => cancelledAssignment,
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
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      await act(async () => {
        await user.click(cancelButton)
      })

      // Should still attempt to update (though in practice this might not be desired)
      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalled()
    })

    it('should handle rapid multiple clicks on cancel button', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-sa-button')

      // Click multiple times rapidly
      await act(async () => {
        await user.click(cancelButton)
        await user.click(cancelButton)
        await user.click(cancelButton)
      })

      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      // Should only be called once (assuming the function has proper guards)
      expect(updateDoc).toHaveBeenCalledTimes(1)
    })
  })

  describe('Complete User Flow Integration', () => {
    it('should complete the full cancel SA workflow successfully', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      // Verify initial state
      expect(screen.getByTestId('cancel-sa-button')).toBeInTheDocument()

      // Click cancel button
      const cancelButton = screen.getByTestId('cancel-sa-button')
      await act(async () => {
        await user.click(cancelButton)
      })

      // Verify the update call
      const { updateDoc, serverTimestamp } = vi.mocked(await import('firebase/firestore'))
      expect(updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        {
          status: 'Cancelled',
          cancellation_date: serverTimestamp(),
          cancelled_by_uid: 'test-user-id',
        }
      )

      // Verify success toast
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Service assignment has been cancelled successfully.',
      })

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments')
    })

    it('should handle the complete error flow', async () => {
      const user = userEvent.setup()

      // Mock updateDoc to reject
      const { updateDoc } = vi.mocked(await import('firebase/firestore'))
      updateDoc.mockRejectedValue(new Error('Database connection failed'))

      render(
        <TestWrapper>
          <ViewServiceAssignmentPage />
        </TestWrapper>
      )

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('service-assignment-summary-bar')).toBeInTheDocument()
      })

      // Click cancel button
      const cancelButton = screen.getByTestId('cancel-sa-button')
      await act(async () => {
        await user.click(cancelButton)
      })

      // Verify error toast
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to cancel service assignment. Please try again.',
        variant: 'destructive',
      })

      // Verify no navigation occurred
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})