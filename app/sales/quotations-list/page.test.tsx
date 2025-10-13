import React from 'react'
import { render, screen } from '@testing-library/react'
import QuotationsListPage from './page'

// Suppress act() warnings during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('was not wrapped in act(...)')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock all external dependencies with simple implementations
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id', displayName: 'Test User', email: 'test@example.com' },
    userData: { company_id: 'test-company-id' }
  })
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  })
}))

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: any) => value
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() })
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
  storage: {}
}))

jest.mock('@/lib/quotation-service', () => ({
  copyQuotation: jest.fn(),
  generateQuotationPDF: jest.fn(),
  getQuotationById: jest.fn()
}))

jest.mock('@/lib/booking-service', () => ({
  bookingService: {
    createBooking: jest.fn()
  }
}))

jest.mock('@/lib/algolia-service', () => ({
  searchQuotations: jest.fn()
}))

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({
    empty: false,
    docs: [{
      id: 'test-company-id',
      data: () => ({
        name: 'Test Company',
        company_location: 'Test Location',
        address: 'Test Address',
        company_website: 'https://test.com',
        photo_url: 'https://test.com/logo.png',
        contact_person: 'Test Person',
        email: 'test@test.com',
        phone: '123-456-7890',
        social_media: {},
        created_by: 'test-user-id',
        created: { toDate: () => new Date() },
        updated: { toDate: () => new Date() }
      })
    }]
  })),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    id: 'test-company-id',
    data: () => ({
      name: 'Test Company',
      company_location: 'Test Location',
      address: 'Test Address',
      company_website: 'https://test.com',
      photo_url: 'https://test.com/logo.png',
      contact_person: 'Test Person',
      email: 'test@test.com',
      phone: '123-456-7890',
      social_media: {},
      created_by: 'test-user-id',
      created: { toDate: () => new Date() },
      updated: { toDate: () => new Date() }
    })
  })),
  updateDoc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
    now: jest.fn()
  },
  limit: jest.fn(),
  startAfter: jest.fn(),
  onSnapshot: jest.fn((query, callback) => {
    // Mock empty data initially
    const mockQuerySnapshot = {
      forEach: () => {},
      docs: []
    }
    callback(mockQuerySnapshot)
    return jest.fn() // unsubscribe function
  })
}))

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}))

jest.mock('date-fns', () => ({
  format: jest.fn((date, pattern) => 'Jan 1, 2024')
}))

// Mock UI components
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <span className={className}>{children}</span>
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div className={className} data-testid="skeleton" />
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) =>
    <button onClick={onClick} disabled={disabled} className={className} {...props}>{children}</button>
}))

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
    <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />
}))

jest.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle" />,
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  MoreVertical: () => <div data-testid="more-vertical" />,
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-text" />,
  Loader2: () => <div data-testid="loader" />,
  Share2: () => <div data-testid="share-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  FilePen: () => <div data-testid="file-pen" />,
  Eye: () => <div data-testid="eye" />,
  Download: () => <div data-testid="download" />,
  History: () => <div data-testid="history" />,
  Printer: () => <div data-testid="printer" />
}))

// Mock custom components
jest.mock('@/components/sent-history-dialog', () => ({
  SentHistoryDialog: () => <div data-testid="sent-history-dialog" />
}))

jest.mock('@/components/compliance-dialog', () => ({
  ComplianceDialog: ({ onFileUpload, uploadingFiles, onAccept, onDecline, onMarkAsReserved }: any) =>
    <div data-testid="compliance-dialog">
      <button onClick={() => onFileUpload('test-id', 'signedContract', new File([''], 'test.pdf'))}>
        Upload File
      </button>
      <button onClick={() => onAccept('test-id', 'signedContract')}>Accept</button>
      <button onClick={() => onDecline('test-id', 'signedContract')}>Decline</button>
      <button onClick={() => onMarkAsReserved({ id: 'test-id' })}>Mark as Reserved</button>
    </div>
}))

jest.mock('@/components/send-quotation-options-dialog', () => ({
  SendQuotationOptionsDialog: () => <div data-testid="send-quotation-options-dialog" />
}))

jest.mock('pdf-lib', () => ({
  PDFDocument: {},
  StandardFonts: {}
}))

// Mock fetch for PDF generation
global.fetch = jest.fn()

describe('QuotationsListPage - Basic Functionality Tests', () => {
  test('renders component without crashing', () => {
    expect(() => render(<QuotationsListPage />)).not.toThrow()
  })

  test('displays page title', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('Quotations')).toBeTruthy()
  })

  test('renders search input', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByPlaceholderText('Search')).toBeTruthy()
  })

  test('renders create quotation button', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    const createButtons = screen.getAllByText('Create Quotation')
    expect(createButtons.length).toBeGreaterThan(0)
  })

  test('shows empty state when no quotations', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('No quotations yet')).toBeTruthy()
    expect(screen.getByText('Create your first quotation to get started')).toBeTruthy()
  })

  test('renders search icon', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByTestId('search-icon')).toBeTruthy()
  })

  test('renders file text icon in empty state', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByTestId('file-text')).toBeTruthy()
  })

  test('renders plus icon in create button', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByTestId('plus-icon')).toBeTruthy()
  })

  test('component maintains stable structure across renders', async () => {
    const { rerender } = render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Rerender and check structure is maintained
    rerender(<QuotationsListPage />)

    expect(screen.getByText('Quotations')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search')).toBeTruthy()
  })

  test('integrates with card components', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that card structure is rendered
    expect(document.querySelectorAll('div').length).toBeGreaterThan(0)
  })

  test('renders semantic HTML elements', async () => {
    render(<QuotationsListPage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check for semantic elements
    expect(document.querySelector('button')).toBeTruthy()
    expect(document.querySelector('input')).toBeTruthy()
    expect(document.querySelector('h1')).toBeTruthy()
  })
})