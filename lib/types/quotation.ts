export interface MediaItem {
  distance?: string
  isVideo?: boolean
  type?: string // e.g., "Video", "Image"
  url?: string
  name?: string
  price?: number // This price seems to be for the media item itself, not the product.
}

export interface SpecsRental {
  audience_type?: string
  audience_types?: string[] // e.g., ["General Public"]
  elevation?: number
  height?: number
  location?: string // e.g., "manila"
  traffic_count?: number
  width?: number
  type?: string // e.g., "RENTAL"
}

export interface QuotationProduct {
  id: string
  name: string
  location: string
  price: number // Monthly price
  site_code?: string
  type?: string // e.g., "LED Billboard", "Static Billboard"
  description?: string // Added for product description
  health_percentage?: number // Added from image
  light?: boolean // Added from image
  media?: MediaItem[] // Added from image
  specs_rental?: SpecsRental // Added from image
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
