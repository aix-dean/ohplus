export interface Subscription {
  id: string
  licenseKey: string
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  uid: string
  startDate: Date
  endDate: Date
  status: SubscriptionStatus
  maxProducts: number
  trialEndDate: Date | null
  companyId: string | null
  createdAt: Date
  updatedAt: Date
}
