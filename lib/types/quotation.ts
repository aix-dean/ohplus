export interface QuotationProduct {
  id: string
  name: string
  location?: string
  site_code?: string
  price: number // This is the monthly price from the product
  type?: string
}

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  products: QuotationProduct[] // Array of products included in the quotation
  start_date: string
  end_date: string
  total_amount: number // This will be the sum of (product.price / 30) * duration_days for all products
  duration_days: number // Duration for the entire quotation
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed"
  created: any
  updated?: any
  created_by?: string
  created_by_first_name?: string
  created_by_last_name?: string
  client_name?: string
  client_email?: string
  client_id?: string
  campaignId?: string
  proposalId?: string
  valid_until?: any
  seller_id?: string
}
