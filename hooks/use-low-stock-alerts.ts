"use client"

import { useState, useEffect } from "react"
import { lowStockMonitor, type LowStockAlert } from "@/lib/low-stock-monitoring-service"
import { useAuth } from "@/contexts/auth-context"

export function useLowStockAlerts() {
  const { userData } = useAuth()
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userData?.company_id) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const initializeMonitoring = async () => {
      try {
        setLoading(true)
        setError(null)

        // Start monitoring for the company
        await lowStockMonitor.startMonitoring(userData.company_id)

        // Subscribe to alerts
        unsubscribe = lowStockMonitor.onAlertsChanged((newAlerts) => {
          setAlerts(newAlerts)
          setLoading(false)
        })
      } catch (err) {
        console.error("Error initializing low stock monitoring:", err)
        setError("Failed to initialize stock monitoring")
        setLoading(false)
      }
    }

    initializeMonitoring()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userData?.company_id])

  return {
    alerts,
    loading,
    error,
    alertsCount: alerts.length,
    criticalAlertsCount: alerts.filter((alert) => alert.alertLevel === "critical").length,
    hasAlerts: alerts.length > 0,
    hasCriticalAlerts: alerts.some((alert) => alert.alertLevel === "critical"),
  }
}
