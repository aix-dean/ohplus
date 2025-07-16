import type { Timestamp } from "firebase/firestore"

export type JobOrderType = "Installation" | "Maintenance" | "Repair" | "Dismantling" | "Other"
export type JobOrderStatus = "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled"

export interface JobOrder {
  id: string
  joNumber: string
  siteName: string
  siteLocation: string
  joType: JobOrderType
  requestedBy: string
  assignTo: string
  dateRequested: string
  deadline: string
  jobDescription: string
  message: string
  attachments: string[]
  status: JobOrderStatus
  created: Timestamp
  updated: Timestamp
  created_by: string
  company_id: string
  quotation_id: string
}
