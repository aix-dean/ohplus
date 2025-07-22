export interface QuotationItem {
  product_id: string
  product_name: string
  product_location?: string
  site_code?: string
  price: number // Price per day for this specific item
  duration_days: number // Duration for this specific item
  item_total_amount: number // Total amount for this specific item
  type?: string
  media_url?: string
}

export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  // Removed single product fields, now using 'items' array
  items: QuotationItem[] // Array of products included in the quotation
  total_amount: number // Overall total for all items
  duration_days: number // Overall duration (assuming all items have the same duration)
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
  seller_id?: string // Added seller_id for pagination
}
