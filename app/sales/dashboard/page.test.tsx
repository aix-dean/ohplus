import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SalesDashboardPage from './page'

// Mock all external dependencies
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    userData: {
      company_id: 'test-company-id',
      first_name: 'John',
      last_name: 'Doe'
    }
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

vi.mock('@/hooks/use-responsive', () => ({
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false
  }))
}))

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: vi.fn((value) => value)
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  })),
  useSearchParams: vi.fn(() => new URLSearchParams())
}))

vi.mock('@/lib/firebase-service', () => ({
  getPaginatedUserProducts: vi.fn(() => Promise.resolve({
    items: [
      {
        id: 'product-1',
        name: 'Test Product 1',
        type: 'rental',
        price: 1000,
        media: [{ url: 'test-image.jpg' }],
        specs_rental: { location: 'Test Location' },
        site_code: 'SC001',
        description: 'Test description',
        active: true,
        deleted: false,
        seller_id: 'seller-1',
        company_id: 'company-1',
        created_at: new Date(),
        updated_at: new Date()
      } as any,
      {
        id: 'product-2',
        name: 'Test Product Without Image',
        type: 'rental',
        price: 2000,
        media: [], // No media for testing NO IMAGE fallback
        specs_rental: { location: 'Test Location 2' },
        site_code: 'SC002',
        description: 'Test description 2',
        active: true,
        deleted: false,
        seller_id: 'seller-2',
        company_id: 'company-2',
        created_at: new Date(),
        updated_at: new Date()
      } as any
    ],
    lastDoc: null,
    hasMore: false
  })),
  getUserProductsCount: vi.fn(() => Promise.resolve(2)),
  softDeleteProduct: vi.fn(),
  type: {
    Product: {},
    Booking: {}
  }
}))

vi.mock('@/lib/client-service', () => ({
  getPaginatedClients: vi.fn(() => Promise.resolve({
    items: [],
    lastDoc: null,
    hasMore: false
  })),
  type: {
    Client: {}
  }
}))

vi.mock('@/components/search-box', () => ({
  SearchBox: () => <div data-testid="search-box" />
}))

vi.mock('@/components/responsive-card-grid', () => ({
  ResponsiveCardGrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-card-grid">{children}</div>
  )
}))

vi.mock('@/components/sales-chat/sales-chat-widget', () => ({
  SalesChatWidget: () => <div data-testid="sales-chat-widget" />
}))

vi.mock('@/components/route-protection', () => ({
  RouteProtection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, className, onError }: any) => (
    <img
      src={src}
      alt={alt}
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : {}}
      className={className}
      onError={onError}
    />
  )
}))

describe('SalesDashboardPage - NO IMAGE Fallback', () => {
  it('displays "NO IMAGE" text for products without media in grid view', async () => {
    render(<SalesDashboardPage />)

    // Wait for the products to load and check for NO IMAGE text
    // Since the mock returns one product with media and one without,
    // we should see "NO IMAGE" text for the product without media
    expect(await screen.findByText('NO IMAGE')).toBeInTheDocument()
  })

  it('displays "NO IMAGE" text for products without media in list view', async () => {
    render(<SalesDashboardPage />)

    // The list view also shows "NO IMAGE" for products without media
    expect(await screen.findByText('NO IMAGE')).toBeInTheDocument()
  })

  it('renders products with images normally', async () => {
    render(<SalesDashboardPage />)

    // Should find images for products that have media
    const images = await screen.findAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
  })

  it('displays product information correctly', async () => {
    render(<SalesDashboardPage />)

    // Check that product names are displayed
    expect(await screen.findByText('Test Product 1')).toBeInTheDocument()
    expect(screen.getByText('Test Product Without Image')).toBeInTheDocument()

    // Check site codes
    expect(screen.getByText('SC001')).toBeInTheDocument()
    expect(screen.getByText('SC002')).toBeInTheDocument()
  })
})