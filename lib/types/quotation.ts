export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  product_id: string
  product_name: string
  product_location?: string
  site_code?: string
  start_date: string
  end_date: string
  price: number
  total_amount: number
  duration_days: number
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed"
  created: any
  updated?: any
  created_by?: string
  created_by_first_name?: string
  created_by_last_name?: string
  client_name?: string
  client_email?: string
  client_id?: string // Added client_id
  campaignId?: string
  proposalId?: string
  valid_until?: any
}
