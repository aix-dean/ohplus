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
  dateRequested: any // Can be Date, Timestamp, or string
  deadline: any // Can be Date, Timestamp, or string
  jobDescription: string
  message: string
  attachments: string[]
  status: JobOrderStatus
  created: any // Firestore Timestamp
  updated: any // Firestore Timestamp
  created_by: string
  company_id: string
  quotation_id?: string
  client_id?: string
}
