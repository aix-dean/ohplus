import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProposalDetailsPage from '../[id]/page'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn()
  }))
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn()
}))

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}))

// Mock proposal service
vi.mock('@/lib/proposal-service', () => ({
  getProposalById: vi.fn(),
  updateProposal: vi.fn()
}))

// Mock other dependencies
vi.mock('@/lib/firebase-service', () => ({
  getPaginatedUserProducts: vi.fn(),
  getUserProductsCount: vi.fn(),
  softDeleteProduct: vi.fn()
}))

vi.mock('@/lib/client-service', () => ({
  getPaginatedClients: vi.fn()
}))

vi.mock('@/lib/google-maps-loader', () => ({
  loadGoogleMaps: vi.fn()
}))

vi.mock('@/lib/static-maps', () => ({
  generateStaticMapUrl: vi.fn(() => 'mock-map-url')
}))

describe('ProposalDetailsPage', () => {
  const mockParams = { id: 'test-proposal-id' }
  const mockRouter = { push: vi.fn(), replace: vi.fn() }
  const mockUserData = {
    uid: 'user-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '+1234567890'
  }

  const mockProposal = {
    id: 'test-proposal-id',
    title: 'Test Proposal',
    client: {
      id: 'client-1',
      company: 'Test Company',
      contactPerson: 'Jane Smith',
      email: 'jane@test.com',
      phone: '+0987654321'
    },
    products: [
      {
        id: 'product-1',
        ID: 'product-1',
        name: 'Test Billboard',
        location: 'Test Location, Manila, Philippines',
        categories: ['billboard'],
        price: 1500,
        specs_rental: {
          height: 10,
          width: 20,
          traffic_count: 50000
        }
      }
    ],
    fieldVisibility: {
      'product-1': {
        location: true,
        dimension: true,
        type: true,
        traffic: true,
        srp: true
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mocks
    vi.mocked(useParams).mockReturnValue(mockParams)
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useAuth).mockReturnValue({ userData: mockUserData })
    vi.mocked(useToast).mockReturnValue({ toast: vi.fn() })
  })

  describe('Field Visibility', () => {
    it('should initialize field visibility from proposal data', async () => {
      const { getProposalById } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(mockProposal)

      render(<ProposalDetailsPage />)

      await waitFor(() => {
        expect(getProposalById).toHaveBeenCalledWith('test-proposal-id')
      })
    })

    it('should display all fields when in edit mode', async () => {
      const { getProposalById } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(mockProposal)

      render(<ProposalDetailsPage />)

      // Wait for proposal to load
      await waitFor(() => {
        expect(screen.getByText('Test Billboard')).toBeInTheDocument()
      })

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // All fields should be visible in edit mode
      expect(screen.getByDisplayValue('Test Location, Manila, Philippines')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument() // height
      expect(screen.getByDisplayValue('20')).toBeInTheDocument() // width
      expect(screen.getByDisplayValue('50000')).toBeInTheDocument() // traffic
      expect(screen.getByDisplayValue('1500')).toBeInTheDocument() // price
    })

    it('should hide fields in view mode when fieldVisibility is false', async () => {
      const proposalWithHiddenFields = {
        ...mockProposal,
        fieldVisibility: {
          'product-1': {
            location: false, // Hidden
            dimension: true,
            type: true,
            traffic: false, // Hidden
            srp: true
          }
        }
      }

      const { getProposalById } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(proposalWithHiddenFields)

      render(<ProposalDetailsPage />)

      // Wait for proposal to load
      await waitFor(() => {
        expect(screen.getByText('Test Billboard')).toBeInTheDocument()
      })

      // Location should be hidden (no location text visible)
      expect(screen.queryByText('Test Location, Manila, Philippines')).not.toBeInTheDocument()

      // Traffic count should be hidden
      expect(screen.queryByText('50,000')).not.toBeInTheDocument()

      // But dimension and SRP should be visible
      expect(screen.getByText('10ft (H) x 20ft (W)')).toBeInTheDocument()
      expect(screen.getByText('₱1,500.00 per month')).toBeInTheDocument()
    })

    it('should show X buttons only in edit mode', async () => {
      const { getProposalById } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(mockProposal)

      render(<ProposalDetailsPage />)

      // Wait for proposal to load
      await waitFor(() => {
        expect(screen.getByText('Test Billboard')).toBeInTheDocument()
      })

      // X buttons should not be visible in view mode
      const xButtons = screen.queryAllByRole('button', { name: /hide/i })
      expect(xButtons).toHaveLength(0)

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // X buttons should now be visible
      await waitFor(() => {
        const xButtonsAfterEdit = screen.getAllByRole('button', { name: /hide/i })
        expect(xButtonsAfterEdit.length).toBeGreaterThan(0)
      })
    })

    it('should toggle field visibility when X button is clicked', async () => {
      const { getProposalById, updateProposal } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(mockProposal)
      vi.mocked(updateProposal).mockResolvedValue()

      render(<ProposalDetailsPage />)

      // Wait for proposal to load and enter edit mode
      await waitFor(() => {
        expect(screen.getByText('Test Billboard')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // Wait for edit mode to activate
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Location, Manila, Philippines')).toBeInTheDocument()
      })

      // Find and click the location hide button
      const hideButtons = screen.getAllByRole('button', { name: /hide location field/i })
      const locationHideButton = hideButtons.find(button =>
        button.getAttribute('title')?.includes('Location')
      )

      if (locationHideButton) {
        fireEvent.click(locationHideButton)

        // Button should now show "Show Location field"
        expect(locationHideButton).toHaveAttribute('title', 'Show Location field')
      }
    })
  })

  describe('Location Display', () => {
    it('should truncate long location addresses', async () => {
      const proposalWithLongLocation = {
        ...mockProposal,
        products: [{
          ...mockProposal.products[0],
          location: 'This is a very long location address that should be truncated when displayed in the proposal page interface'
        }]
      }

      const { getProposalById } = await import('@/lib/proposal-service')
      vi.mocked(getProposalById).mockResolvedValue(proposalWithLongLocation)

      render(<ProposalDetailsPage />)

      // Wait for proposal to load
      await waitFor(() => {
        expect(screen.getByText('Test Billboard')).toBeInTheDocument()
      })

      // Location should be truncated
      const locationElement = screen.getByText(/this is a very long location address/i)
      expect(locationElement).toHaveClass('truncate')
      expect(locationElement).toHaveAttribute('title', proposalWithLongLocation.products[0].location)
    })
  })
})