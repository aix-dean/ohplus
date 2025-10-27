import { describe, it, expect } from 'vitest'
import { generateProposalPassword } from './proposal-service'

describe('Proposal Service', () => {
  describe('generateProposalPassword', () => {
    it('should generate an 8-digit password', () => {
      const password = generateProposalPassword()
      expect(password).toMatch(/^\d{8}$/)
      expect(password.length).toBe(8)
    })

    it('should generate different passwords on multiple calls', () => {
      const password1 = generateProposalPassword()
      const password2 = generateProposalPassword()
      expect(password1).not.toBe(password2)
    })
  })
})