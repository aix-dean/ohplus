import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BusinessProductDetailPage from '@/app/business/inventory/[id]/page'

// Mock useParams for this specific test
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-product-id' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('BusinessProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    render(<BusinessProductDetailPage />)
    // Basic smoke test - component should render without crashing
    // It should show loading state initially
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
  })

  it('displays loading skeleton initially', () => {
    render(<BusinessProductDetailPage />)
    // Should show skeleton while loading
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3)
  })
})