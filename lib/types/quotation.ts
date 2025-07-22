export interface QuotationItem {
  product_id: string
  product_name: string
  product_location?: string
  site_code?: string
  price: number // This will be the monthly price from the product
  duration_days: number // Duration for this specific item
  item_total_amount: number // Calculated total for this specific item
  type?: string // e.g., "LED", "Static"
  media_url?: string // Primary image URL for the product
  start_date: string // Start date for this item's booking
  end_date: string // End date for this item's booking
}

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  items: QuotationItem[] // Array of products included in the quotation
  total_amount: number // Overall total for all items
  duration_days: number // Overall duration for the quotation (consistent across items)
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
