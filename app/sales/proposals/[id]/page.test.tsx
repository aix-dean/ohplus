import { describe, it, expect, vi } from 'vitest'

// Mock all the dependencies at the top level
vi.mock('next/navigation')
vi.mock('@/contexts/auth-context')
vi.mock('@/hooks/use-toast')
vi.mock('@/lib/proposal-service')
vi.mock('@/lib/client-service')
vi.mock('@/components/proposal-history')
vi.mock('@/components/ui/button')
vi.mock('@/components/ui/select')
vi.mock('lucide-react')
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
}))

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
  tenantAuth: {},
  storage: {},
  TENANT_ID: 'test-tenant',
}))

describe('ProposalDetailsPage', () => {
  it('can be imported without errors', async () => {
    // This is a basic smoke test to ensure the component can be imported
    // without syntax errors or missing dependencies
    const { default: ProposalDetailsPage } = await import('./page')
    expect(ProposalDetailsPage).toBeDefined()
    expect(typeof ProposalDetailsPage).toBe('function')
  }, 10000)

  it('has required exports', async () => {
    const module = await import('./page')
    expect(module.default).toBeDefined()
  })
})