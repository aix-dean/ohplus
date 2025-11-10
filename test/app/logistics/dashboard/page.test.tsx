import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogisticsDashboardPage from '@/app/logistics/dashboard/page'
import { Menu } from 'lucide-react'

// Mock dependencies
const mockPush = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/app/logistics/dashboard/all-sites', () => ({
  default: ({ searchQuery, contentTypeFilter, viewMode }: any) => (
    <div data-testid="all-sites-tab" data-search={searchQuery} data-filter={contentTypeFilter} data-view={viewMode}>
      AllSitesTab - search: {searchQuery}, filter: {contentTypeFilter}, view: {viewMode}
    </div>
  ),
}))

vi.mock('@/components/route-protection', () => ({
  RouteProtection: ({ children, requiredRoles }: any) => (
    <div data-testid="route-protection" data-required-roles={requiredRoles}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, className, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input type="text" {...props} />,
}))

vi.mock('lucide-react', () => {
  // Create a generic icon component factory
  const createIconMock = (testId: string) => () => React.createElement('div', { 'data-testid': testId })

  return {
    Search: createIconMock("search-icon"),
    List: createIconMock("list-icon"),
    Grid3X3: createIconMock("grid-icon"),
    X: createIconMock("x-icon"),
    Loader2: createIconMock("loader-icon"),
    LayoutGrid: createIconMock("layout-grid-icon"),
    Plus: createIconMock("plus-icon"),
    Upload: createIconMock("upload-icon"),
    ImageIcon: createIconMock("image-icon"),
    Eye: createIconMock("eye-icon"),
    FileText: createIconMock("file-text-icon"),
    AlertCircle: createIconMock("alert-circle-icon"),
    Menu: createIconMock("menu-icon"),
    // Add more common icons that might be used
    CalendarIcon: createIconMock("calendar-icon"),
  }
})

describe('LogisticsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user-id' },
      userData: {
        company_id: 'test-company-id',
        first_name: 'John',
      },
    })
  })

  describe('Initial Rendering', () => {
    it('renders the dashboard with route protection', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.getByTestId('route-protection')).toBeInTheDocument()
      expect(screen.getByTestId('route-protection')).toHaveAttribute('data-required-roles', 'logistics')
    })

    it('displays user name in header when userData has first_name', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.getByText("John's Dashboard")).toBeInTheDocument()
    })

    it('displays "Dashboard" when userData has no first_name', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-id' },
        userData: { company_id: 'test-company-id' },
      })

      render(<LogisticsDashboardPage />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('renders search input with placeholder', () => {
      render(<LogisticsDashboardPage />)

      const searchInput = screen.getByPlaceholderText('Search')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveValue('')
    })

    it('renders view toggle buttons', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.getByTestId('menu-icon').closest('button')).toBeInTheDocument()
      expect(screen.getByTestId('layout-grid-icon').closest('button')).toBeInTheDocument()
    })

    it('renders tab buttons', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.getByText('Static')).toBeInTheDocument()
      expect(screen.getByText('Digital')).toBeInTheDocument()
    })

    it('renders action buttons', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.getByText('Service Assignment')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('renders AllSitesTab with default props', () => {
      render(<LogisticsDashboardPage />)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toBeInTheDocument()
      expect(allSitesTab).toHaveTextContent('AllSitesTab - search: , filter: Static, view: grid')
    })
  })

  describe('Search Functionality', () => {
    it('updates search query when typing in search input', async () => {
      render(<LogisticsDashboardPage />)

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: 'test search' } })

      await waitFor(() => {
        const allSitesTab = screen.getByTestId('all-sites-tab')
        expect(allSitesTab).toHaveTextContent('AllSitesTab - search: test search, filter: Static, view: grid')
      })
    })

    it('shows clear button when search query is not empty', () => {
      render(<LogisticsDashboardPage />)

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })

    it('clears search query when clear button is clicked', () => {
      render(<LogisticsDashboardPage />)

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      const clearButton = screen.getByTestId('x-icon').closest('button')
      fireEvent.click(clearButton!)

      expect(searchInput).toHaveValue('')
    })

    it('hides clear button when search query is empty', () => {
      render(<LogisticsDashboardPage />)

      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument()
    })
  })

  describe('View Mode Toggle', () => {
    it('starts in grid view by default', () => {
      render(<LogisticsDashboardPage />)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toHaveTextContent('view: grid')
    })

    it('switches to list view when list button is clicked', () => {
      render(<LogisticsDashboardPage />)

      const listButton = screen.getByTestId('menu-icon').closest('button')
      fireEvent.click(listButton!)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toHaveTextContent('view: list')
    })

    it('switches back to grid view when grid button is clicked', () => {
      render(<LogisticsDashboardPage />)

      // Switch to list first
      const listButton = screen.getByTestId('menu-icon').closest('button')
      fireEvent.click(listButton!)

      // Switch back to grid
      const gridButton = screen.getByTestId('layout-grid-icon').closest('button')
      fireEvent.click(gridButton!)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toHaveTextContent('view: grid')
    })
  })

  describe('Tab Switching', () => {
    it('starts with Static tab active', () => {
      render(<LogisticsDashboardPage />)

      const staticTab = screen.getByText('Static').closest('button')
      const digitalTab = screen.getByText('Digital').closest('button')

      expect(staticTab).toHaveClass('bg-green-500')
      expect(digitalTab).toHaveClass('border')
    })

    it('switches to Digital tab and updates filter when Digital tab is clicked', () => {
      render(<LogisticsDashboardPage />)

      const digitalTab = screen.getByText('Digital').closest('button')
      fireEvent.click(digitalTab!)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toHaveTextContent('filter: Dynamic')

      // Check active tab styling
      expect(digitalTab).toHaveClass('bg-green-500')
      expect(screen.getByText('Static').closest('button')).toHaveClass('border')
    })

    it('switches back to Static tab when Static tab is clicked', () => {
      render(<LogisticsDashboardPage />)

      // Switch to Digital first
      const digitalTab = screen.getByText('Digital').closest('button')
      fireEvent.click(digitalTab!)

      // Switch back to Static
      const staticTab = screen.getByText('Static').closest('button')
      fireEvent.click(staticTab!)

      const allSitesTab = screen.getByTestId('all-sites-tab')
      expect(allSitesTab).toHaveTextContent('filter: Static')
    })
  })

  describe('Navigation Buttons', () => {
    it('navigates to service assignment page when Service Assignment button is clicked', () => {
      render(<LogisticsDashboardPage />)

      const serviceButton = screen.getByText('Service Assignment')
      fireEvent.click(serviceButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments/create')
    })

    it('navigates to reports page when Reports button is clicked', () => {
      render(<LogisticsDashboardPage />)

      const reportsButton = screen.getByText('Reports')
      fireEvent.click(reportsButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/reports/select-service-assignment')
    })

    it('shows loading text and disables buttons during navigation', async () => {
      render(<LogisticsDashboardPage />)

      const serviceButton = screen.getByText('Service Assignment')
      fireEvent.click(serviceButton)

      // Button should show loading text
      expect(screen.getByText('Service Assiment..')).toBeInTheDocument()
      expect(serviceButton).toBeDisabled()

      // Wait for timeout to complete
      await waitFor(() => {
        expect(screen.getByText('Service Assignment')).toBeInTheDocument()
      }, { timeout: 1500 })
    })

    it('handles button clicks correctly', () => {
      render(<LogisticsDashboardPage />)

      const serviceButton = screen.getByText('Service Assignment')
      fireEvent.click(serviceButton)

      expect(mockPush).toHaveBeenCalledWith('/logistics/assignments/create')
    })
  })

  describe('Edge Cases', () => {
    it('handles missing userData gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        userData: null,
      })

      render(<LogisticsDashboardPage />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('handles userData without first_name', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-id' },
        userData: { company_id: 'test-company-id', last_name: 'Doe' },
      })

      render(<LogisticsDashboardPage />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('capitalizes first letter of first_name correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'test-user-id' },
        userData: {
          company_id: 'test-company-id',
          first_name: 'jane',
        },
      })

      render(<LogisticsDashboardPage />)

      expect(screen.getByText("Jane's Dashboard")).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<LogisticsDashboardPage />)

      // Search input should be accessible
      const searchInput = screen.getByPlaceholderText('Search')
      expect(searchInput).toHaveAttribute('type', 'text')

      // Buttons should be properly labeled
      const serviceButton = screen.getByText('Service Assignment')
      expect(serviceButton).toBeInTheDocument()

      const reportsButton = screen.getByText('Reports')
      expect(reportsButton).toBeInTheDocument()
    })

    it('maintains focus management during interactions', () => {
      render(<LogisticsDashboardPage />)

      const searchInput = screen.getByPlaceholderText('Search')
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)

      // Clear button should be keyboard accessible
      fireEvent.change(searchInput, { target: { value: 'test' } })
      const clearButton = screen.getByTestId('x-icon').closest('button')
      clearButton!.focus()
      expect(document.activeElement).toBe(clearButton)
    })
  })
})