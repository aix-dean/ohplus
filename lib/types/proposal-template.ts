export type ProposalTemplate = {
  id?: string
  name: string
  description?: string
  title: string
  client: {
    company?: string
    contactPerson?: string
    email?: string
    phone?: string
    address?: string
    industry?: string
    targetAudience?: string
    campaignObjective?: string
    designation?: string
  }
  products: Array<{
    id: string
    name: string
    type: string
    price: number
    location: string
    site_code?: string
    description?: string
  }>
  totalAmount: number
  validUntil?: Date
  notes?: string
  customMessage?: string
  createdBy: string
  companyId?: string | null
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}
