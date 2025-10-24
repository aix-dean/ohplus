
// Mock useParams to return synchronous value
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: vi.fn(() => ({ id: 'test-product-id' })),
  notFound: vi.fn(),
}))

import React, { Suspense } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import BusinessProductDetailPage from './page'

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    userData: { first_name: 'Test', last_name: 'User', email: 'test@example.com' },
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props }),
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    const Component = () => React.createElement('div', null, 'Dynamic Component')
    Component.displayName = 'DynamicComponent'
    return Component
  },
}))

vi.mock('@/lib/google-maps-loader', () => ({
  loadGoogleMaps: vi.fn(),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => React.createElement('div', props, children),
  TabsList: ({ children, ...props }: any) => React.createElement('div', props, children),
  TabsTrigger: ({ children, ...props }: any) => React.createElement('div', props, children),
  TabsContent: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) =>
    React.createElement('button', { onClick, ...props }, children),
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ ...props }: any) => React.createElement('input', { type: 'checkbox', ...props }),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) =>
    React.createElement('span', { 'data-testid': 'badge', ...props }, children),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? React.createElement('div', { 'data-testid': 'dialog', role: 'dialog' }, children) : null,
  DialogContent: ({ children, ...props }: any) => React.createElement('div', props, children),
  DialogHeader: ({ children, ...props }: any) => React.createElement('div', props, children),
  DialogTitle: ({ children, ...props }: any) => React.createElement('div', props, children),
}))

vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => React.createElement('table', props, children),
  TableBody: ({ children, ...props }: any) => React.createElement('tbody', props, children),
  TableCell: ({ children, ...props }: any) => React.createElement('td', props, children),
  TableHead: ({ children, ...props }: any) => React.createElement('th', props, children),
  TableHeader: ({ children, ...props }: any) => React.createElement('thead', props, children),
  TableRow: ({ children, ...props }: any) => React.createElement('tr', props, children),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ ...props }: any) => React.createElement('div', { 'data-testid': 'skeleton', ...props }),
}))

vi.mock('@/components/service-assignment-details-dialog', () => ({
  ServiceAssignmentDetailsDialog: () => React.createElement('div', null, 'Service Assignment Details Dialog'),
}))

vi.mock('@/components/alarm-setting-dialog', () => ({
  AlarmSettingDialog: () => React.createElement('div', null, 'Alarm Setting Dialog'),
}))

vi.mock('@/components/illumination-index-card-dialog', () => ({
  IlluminationIndexCardDialog: () => React.createElement('div', null, 'Illumination Index Card Dialog'),
}))

vi.mock('@/components/display-index-card-dialog', () => ({
  DisplayIndexCardDialog: () => React.createElement('div', null, 'Display Index Card Dialog'),
}))

vi.mock('@/components/delete-confirmation-dialog', () => ({
  DeleteConfirmationDialog: () => React.createElement('div', null, 'Delete Confirmation Dialog'),
}))

vi.mock('@/components/google-places-autocomplete', () => ({
  GooglePlacesAutocomplete: ({ value, onChange, ...props }: any) =>
    React.createElement('input', {
      value,
      onChange: (e: any) => onChange(e.target.value),
      ...props
    }),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => React.createElement('input', props),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => React.createElement('label', props, children),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => React.createElement('div', { 'data-testid': 'select' },
    React.createElement('select', {
      value,
      onChange: (e: any) => onValueChange(e.target.value)
    }, children)
  ),
  SelectContent: ({ children }: any) => React.createElement(React.Fragment, null, children),
  SelectItem: ({ children, value }: any) => React.createElement('option', { value }, children),
  SelectTrigger: ({ children }: any) => React.createElement(React.Fragment, null, children),
  SelectValue: ({ placeholder }: any) => React.createElement('span', null, placeholder),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }: any) => React.createElement('textarea', props),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => React.createElement('div', null, children),
  DropdownMenuContent: ({ children }: any) => React.createElement('div', null, children),
  DropdownMenuItem: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
  DropdownMenuTrigger: ({ children }: any) => React.createElement('div', null, children),
}))

vi.mock('react-day-picker', () => ({
  DayPicker: ({ 'aria-label': ariaLabel, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'day-picker', 'aria-label': ariaLabel, ...props }, 'Calendar Component'),
}))

vi.mock('date-fns', () => ({
  format: (date: Date) => date.toISOString().split('T')[0],
}))

vi.mock('lucide-react', () => ({
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }, 'Calendar Icon'),
  MapPin: () => React.createElement('div', null, 'MapPin Icon'),
  AlertTriangle: () => React.createElement('div', null, 'AlertTriangle Icon'),
  Shield: () => React.createElement('div', null, 'Shield Icon'),
  Zap: () => React.createElement('div', null, 'Zap Icon'),
  Users: () => React.createElement('div', null, 'Users Icon'),
  Settings: () => React.createElement('div', null, 'Settings Icon'),
  Eye: () => React.createElement('div', null, 'Eye Icon'),
  History: () => React.createElement('div', null, 'History Icon'),
  FileCheck: () => React.createElement('div', null, 'FileCheck Icon'),
  ArrowLeft: () => React.createElement('div', null, 'ArrowLeft Icon'),
  MoreVertical: () => React.createElement('div', null, 'MoreVertical Icon'),
  Edit: () => React.createElement('div', null, 'Edit Icon'),
  Bell: () => React.createElement('div', null, 'Bell Icon'),
  Sun: () => React.createElement('div', null, 'Sun Icon'),
  Play: () => React.createElement('div', null, 'Play Icon'),
  ChevronDown: () => React.createElement('div', null, 'ChevronDown Icon'),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }, 'Loader Icon'),
  Pencil: () => React.createElement('div', null, 'Pencil Icon'),
  Trash2: () => React.createElement('div', null, 'Trash2 Icon'),
  FileText: () => React.createElement('div', null, 'FileText Icon'),
  Mail: () => React.createElement('div', null, 'Mail Icon'),
  CheckCircle: () => React.createElement('div', null, 'CheckCircle Icon'),
  XCircle: () => React.createElement('div', null, 'XCircle Icon'),
  AlertCircle: () => React.createElement('div', null, 'AlertCircle Icon'),
  Clock3: () => React.createElement('div', null, 'Clock3 Icon'),
  Upload: () => React.createElement('div', null, 'Upload Icon'),
}))

const mockProduct = {
  id: 'test-product-id',
  name: 'Test Billboard',
  content_type: 'static',
  categories: ['Billboard'],
  specs_rental: {
    location: 'Test Location',
    width: 10,
    height: 5,
  },
  media: [{ url: 'test-image.jpg', isVideo: false }],
}

const mockBookings = [
  {
    id: 'booking-1',
    project_name: 'Test Project 1',
    client: { name: 'Test Client 1' },
    start_date: { seconds: new Date('2024-01-01').getTime() / 1000, nanoseconds: 0 },
    end_date: { seconds: new Date('2024-01-05').getTime() / 1000, nanoseconds: 0 },
    status: 'COMPLETED',
    total_cost: 5000,
  },
  {
    id: 'booking-2',
    project_name: 'Test Project 2',
    client: { name: 'Test Client 2' },
    start_date: { seconds: new Date('2024-01-10').getTime() / 1000, nanoseconds: 0 },
    end_date: { seconds: new Date('2024-01-15').getTime() / 1000, nanoseconds: 0 },
    status: 'RESERVED',
    total_cost: 7500,
  },
]

const mockBookingsSnapshot = {
  forEach: vi.fn((callback) => {
    mockBookings.forEach((booking, index) => {
      callback({
        id: booking.id,
        data: () => booking
      })
    })
  })
}

// Test wrapper component that provides synchronous params
const TestWrapper = () => {
  return <BusinessProductDetailPage params={Promise.resolve({ id: 'test-product-id' })} />
}

describe('BusinessProductDetailPage - Site Calendar Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set mock return values for globally mocked functions
    ;(globalThis as any).mockGetProductById.mockResolvedValue(mockProduct)
    ;(globalThis as any).mockGetProductBookings.mockResolvedValue(mockBookings)

    // Mock Firebase Firestore calls used in the component
    ;(globalThis as any).mockCollection.mockReturnValue('bookings-collection')
    ;(globalThis as any).mockQuery.mockReturnValue('bookings-query')
    ;(globalThis as any).mockWhere.mockReturnValue('bookings-query')
    ;(globalThis as any).mockOrderBy.mockReturnValue('bookings-query')
    ;(globalThis as any).mockGetDocs.mockResolvedValue(mockBookingsSnapshot)
  })

  const renderWithSuspense = (component: React.ReactElement) => {
    return render(
      <Suspense fallback={<div>Loading...</div>}>
        {component}
      </Suspense>
    )
  }

  describe('Site Calendar Modal Functionality', () => {
    it('renders Site Calendar button', async () => {
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      // Wait for the loading skeleton to disappear and actual content to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      })

      // Now check for the Site Calendar button
      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })
    })

    it('opens modal when Site Calendar button is clicked', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')

      // Click the button and wait for state update
      await act(async () => {
        await user.click(calendarButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByText('Site Calendar - Test Billboard')).toBeInTheDocument()
      })
    })

    it('displays loading state while fetching bookings', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')
    
      // Make the fetch async to test loading state
      ;(globalThis as any).mockGetDocs.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(mockBookingsSnapshot), 0)
      }))
    
      // Click and check for loading state
      await act(() => {
        fireEvent.click(calendarButton)
      })
    
      // Wait for modal to open and loading state
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByText('Loading calendar...')).toBeInTheDocument()
      })
    })

    it('displays calendar with booked dates after loading', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')
      await user.click(calendarButton)

      // Wait for modal to open and loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })

      // Wait for calendar content to load (loading state should disappear)
      await waitFor(() => {
        expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByTestId('day-picker')).toBeInTheDocument()
        expect(screen.getByText('Current Bookings')).toBeInTheDocument()
      })

      const modal = screen.getByTestId('dialog')

      // Check that bookings are displayed
      expect(within(modal).getByText('Test Project 1')).toBeInTheDocument()
      expect(within(modal).getByText('Test Client 1')).toBeInTheDocument()
      expect(within(modal).getByText('Test Project 2')).toBeInTheDocument()
      expect(within(modal).getByText('Test Client 2')).toBeInTheDocument()
    })

    it('displays legend with booked and available date indicators', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')
      await user.click(calendarButton)

      await waitFor(() => {
        expect(screen.getByText('Booked Dates')).toBeInTheDocument()
        expect(screen.getByText('Available Dates')).toBeInTheDocument()
      })
    })

    it('displays correct status badges for bookings', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      // Wait for content to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')
      await user.click(calendarButton)

      // Wait for modal to open and loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.queryByText('Loading calendar...')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge')
        expect(badges).toHaveLength(2)
        expect(badges[0]).toHaveTextContent('Completed')
        expect(badges[1]).toHaveTextContent('Ongoing')
      })
    })

    it('calendar has proper ARIA label for accessibility', async () => {
      const user = userEvent.setup()
      await act(async () => {
        renderWithSuspense(<TestWrapper />)
      })

      await waitFor(() => {
        expect(screen.getByText('Site Calendar')).toBeInTheDocument()
      })

      const calendarButton = screen.getByText('Site Calendar')
      await user.click(calendarButton)

      await waitFor(() => {
        const dayPicker = screen.getByTestId('day-picker')
        expect(dayPicker).toHaveAttribute('aria-label', 'Site booking calendar')
      })
    })
  })
})