import React from 'react'
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => React.createElement('img', { src, alt, ...props }),
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    userData: { company_id: 'test-company-id' },
  }),
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock cost estimate service
const mockCreateDirectCostEstimate = vi.fn()
const mockCreateMultipleCostEstimates = vi.fn()
vi.mock('@/lib/cost-estimate-service', () => ({
  createDirectCostEstimate: mockCreateDirectCostEstimate,
  createMultipleCostEstimates: mockCreateMultipleCostEstimates,
}))

// Mock firebase service
const mockGetProductById = vi.fn()
const mockGetProductBookings = vi.fn()
vi.mock('@/lib/firebase-service', () => ({
  getProductById: mockGetProductById,
  getProductBookings: mockGetProductBookings,
}))

// Mock client service
const mockGetClientById = vi.fn()
vi.mock('@/lib/client-service', () => ({
  getClientById: mockGetClientById,
}))

// Export mocks for use in tests
;(globalThis as any).mockCreateDirectCostEstimate = mockCreateDirectCostEstimate
;(globalThis as any).mockCreateMultipleCostEstimates = mockCreateMultipleCostEstimates
;(globalThis as any).mockGetProductById = mockGetProductById
;(globalThis as any).mockGetProductBookings = mockGetProductBookings
;(globalThis as any).mockGetClientById = mockGetClientById

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => React.createElement('div', { className, 'data-testid': 'skeleton' }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CalendarIcon: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader-icon' }),
}))