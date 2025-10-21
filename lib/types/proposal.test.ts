import { describe, it, expect } from 'vitest'
import type { Proposal, ProposalContactInfo } from './proposal'

describe('Proposal Types', () => {
  describe('ProposalContactInfo', () => {
    it('should have required fields', () => {
      const contactInfo: ProposalContactInfo = {
        heading: 'Contact Us!',
        name: 'John Doe',
        role: 'Sales Manager',
        phone: '+1234567890',
        email: 'john@example.com'
      }

      expect(contactInfo.heading).toBe('Contact Us!')
      expect(contactInfo.name).toBe('John Doe')
      expect(contactInfo.role).toBe('Sales Manager')
      expect(contactInfo.phone).toBe('+1234567890')
      expect(contactInfo.email).toBe('john@example.com')
    })
  })

  describe('Proposal', () => {
    it('should support fieldVisibility per product', () => {
      const proposal: Partial<Proposal> = {
        id: 'test-proposal',
        fieldVisibility: {
          'product-1': {
            location: true,
            dimension: false,
            type: true,
            traffic: true,
            srp: false
          },
          'product-2': {
            location: false,
            dimension: true,
            type: true,
            traffic: false,
            srp: true
          }
        }
      }

      expect(proposal.fieldVisibility?.['product-1']?.location).toBe(true)
      expect(proposal.fieldVisibility?.['product-1']?.dimension).toBe(false)
      expect(proposal.fieldVisibility?.['product-2']?.location).toBe(false)
      expect(proposal.fieldVisibility?.['product-2']?.srp).toBe(true)
    })

    it('should handle undefined fieldVisibility', () => {
      const proposal: Partial<Proposal> = {
        id: 'test-proposal'
      }

      expect(proposal.fieldVisibility).toBeUndefined()
    })

    it('should support all required Proposal fields', () => {
      const proposal: Proposal = {
        id: 'test-id',
        title: 'Test Proposal',
        client: {
          id: 'client-1',
          company: 'Test Company',
          contactPerson: 'John Doe',
          name: 'John Doe',
          email: 'john@test.com',
          phone: '+1234567890'
        },
        products: [],
        totalAmount: 1000,
        validUntil: new Date(),
        createdBy: 'user-1',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(proposal.id).toBe('test-id')
      expect(proposal.title).toBe('Test Proposal')
      expect(proposal.status).toBe('draft')
    })
  })
})