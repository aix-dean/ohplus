"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { lowStockMonitor, type LowStockAlert } from "@/lib/low-stock-monitoring-service"
import { notificationSound } from "@/lib/notification-sound-service"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface LowStockAlertContextType {
  alerts: LowStockAlert[]
  alertsCount: number
  criticalAlertsCount: number
  hasAlerts: boolean
  hasCriticalAlerts: boolean
  loading: boolean
  error: string | null
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  dismissAlert: (alertId: string) => void
  refreshAlerts: () => void
}

const LowStockAlertContext = createContext<LowStockAlertContextType | undefined>(undefined)

export function useLowStockAlertContext() {
  const context = useContext(LowStockAlertContext)
  if (context === undefined) {
    throw new Error("useLowStockAlertContext must be used within a LowStockAlertProvider")
  }
  return context
}

interface LowStockAlertProviderProps {
  children: React.ReactNode
}

export function LowStockAlertProvider({ children }: LowStockAlertProviderProps) {
  const { userData } = useAuth()
  const [alerts, setAlerts] = useState<LowStockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabledState] = useState(true)
  const [lastAlertCount, setLastAlertCount] = useState(0)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Initialize sound settings
  useEffect(() => {
    const enabled = notificationSound.isEnabledCheck()
    setSoundEnabledState(enabled)
    notificationSound.setEnabled(enabled)
  }, [])

  // Initialize monitoring when user data is available
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
          // Filter out dismissed alerts
          const activeAlerts = newAlerts.filter((alert) => !dismissedAlerts.has(alert.id))
          setAlerts(activeAlerts)
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
  }, [userData?.company_id, dismissedAlerts])

  // Handle new alerts and play sounds
  useEffect(() => {
    if (loading || alerts.length === 0) return

    // Check if we have new alerts
    if (alerts.length > lastAlertCount && lastAlertCount > 0 && !hasPlayedSound) {
      const newAlerts = alerts.slice(lastAlertCount)
      const hasCritical = newAlerts.some((alert) => alert.alertLevel === "critical")

      // Play appropriate sound
      if (soundEnabled) {
        if (hasCritical) {
          notificationSound.playCriticalSound()
        } else {
          notificationSound.playWarningSound()
        }
      }

      // Show toast notification
      const criticalCount = newAlerts.filter((alert) => alert.alertLevel === "critical").length
      const warningCount = newAlerts.length - criticalCount

      let title = "IT Stock Alert"
      let description = ""

      if (criticalCount > 0 && warningCount > 0) {
        title = "Critical IT Stock Alert"
        description = `${criticalCount} items out of stock, ${warningCount} items low on stock`
      } else if (criticalCount > 0) {
        title = "Critical IT Stock Alert"
        description = `${criticalCount} item${criticalCount > 1 ? "s" : ""} out of stock`
      } else {
        description = `${warningCount} item${warningCount > 1 ? "s" : ""} low on stock`
      }

      toast({
        title,
        description,
        variant: hasCritical ? "destructive" : "default",
      })

      setHasPlayedSound(true)
      // Reset the flag after a delay to allow for new alerts
      setTimeout(() => setHasPlayedSound(false), 5000)
    }

    setLastAlertCount(alerts.length)
  }, [alerts, lastAlertCount, soundEnabled, loading, hasPlayedSound])

  // Handle sound toggle
  const setSoundEnabled = async (enabled: boolean) => {
    setSoundEnabledState(enabled)
    notificationSound.setEnabled(enabled)

    // Initialize audio context on first enable
    if (enabled) {
      await notificationSound.initializeOnUserInteraction()
    }
  }

  // Dismiss an alert
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  // Refresh alerts
  const refreshAlerts = () => {
    setDismissedAlerts(new Set())
    // The monitoring service will automatically refresh
  }

  const contextValue: LowStockAlertContextType = {
    alerts,
    alertsCount: alerts.length,
    criticalAlertsCount: alerts.filter((alert) => alert.alertLevel === "critical").length,
    hasAlerts: alerts.length > 0,
    hasCriticalAlerts: alerts.some((alert) => alert.alertLevel === "critical"),
    loading,
    error,
    soundEnabled,
    setSoundEnabled,
    dismissAlert,
    refreshAlerts,
  }

  return <LowStockAlertContext.Provider value={contextValue}>{children}</LowStockAlertContext.Provider>
}
