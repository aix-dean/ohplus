import type { Timestamp } from "firebase/firestore"

export interface QuotationProduct {
  id: string
  name: string
  type: string
  location: string
  price: number
  site_code?: string
  imageUrl?: string // Added imageUrl
  description?: string // Added description
}

export interface Quotation {
  id?: string
  quotation_number: string
  client_name: string
  client_email: string
  start_date: string // ISO string
  end_date: string // ISO string
  valid_until: string // ISO string
  products: QuotationProduct[]
  total_amount: number
  duration_days: number
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired"
  notes?: string
  created?: Timestamp
  updated?: Timestamp
  createdBy?: string
  updatedBy?: string
  quotation_request_id?: string
  proposalId?: string
  campaignId?: string
}
