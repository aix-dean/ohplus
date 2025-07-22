export interface QuotationProduct {
  id: string
  name: string
  location: string
  price: number // Monthly price
  site_code?: string
  type?: string // e.g., "LED Billboard", "Static Billboard"
}

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  start_date: string
  end_date: string
  total_amount: number
  duration_days: number
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed"
  created: any // Firebase Timestamp
  updated?: any // Firebase Timestamp
  created_by?: string
  created_by_first_name?: string
  created_by_last_name?: string
  client_name?: string
  client_email?: string
  client_id?: string
  campaignId?: string
  proposalId?: string
  valid_until?: any // Firebase Timestamp
  seller_id?: string
  products: QuotationProduct[] // Array of products
}
