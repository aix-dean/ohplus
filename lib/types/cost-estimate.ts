export interface CostEstimateLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: "media_cost" | "production_cost" | "installation_cost" | "maintenance_cost" | "other"
}

export interface CostEstimate {
  id: string
  proposalId: string
  title: string
  lineItems: CostEstimateLineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  notes: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: "draft" | "sent" | "viewed" | "approved" | "rejected"
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  password?: string
}

export interface CostEstimateTemplate {
  id: string
  name: string
  description: string
  defaultLineItems: Omit<CostEstimateLineItem, "id" | "totalPrice">[]
  isDefault: boolean
}
