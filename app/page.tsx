"use client"

import { DashboardRedirect } from "@/components/dashboard-redirect"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user, loading } = useAuth()

  return <DashboardRedirect user={user} loading={loading} />
}
