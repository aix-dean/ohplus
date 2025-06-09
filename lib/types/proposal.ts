export type Proposal = {
  id: string
  title: string
  description: string
  clientName: string
  clientEmail: string
  freelancerId: string
  rate: number
  rateType: "hourly" | "fixed"
  estimatedHours?: number
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "accepted"
    | "declined"
    | "cost_estimate_pending"
    | "cost_estimate_approved"
    | "cost_estimate_rejected"
  createdAt: Date
  updatedAt: Date
}
