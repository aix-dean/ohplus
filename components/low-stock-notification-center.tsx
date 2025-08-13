"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AlertTriangle, Bell, BellOff, Package, Volume2, VolumeX, Clock, Building, User, Tag } from "lucide-react"
import { useLowStockAlerts } from "@/hooks/use-low-stock-alerts"
import { notificationSound } from "@/lib/notification-sound-service"
import { lowStockMonitor, type LowStockAlert } from "@/lib/low-stock-monitoring-service"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface LowStockNotificationCenterProps {
  className?: string
}

export function LowStockNotificationCenter({ className }: LowStockNotificationCenterProps) {
  const { alerts, loading, alertsCount, criticalAlertsCount, hasAlerts } = useLowStockAlerts()
  const [isOpen, setIsOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastAlertCount, setLastAlertCount] = useState(0)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)

  // Initialize sound settings
  useEffect(() => {
    const enabled = notificationSound.isEnabledCheck()
    setSoundEnabled(enabled)
    notificationSound.setEnabled(enabled)
  }, [])

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

      let title = "Low Stock Alert"
      let description = ""

      if (criticalCount > 0 && warningCount > 0) {
        title = "Critical Stock Alert"
        description = `${criticalCount} items out of stock, ${warningCount} items low on stock`
      } else if (criticalCount > 0) {
        title = "Critical Stock Alert"
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
  const handleSoundToggle = async (enabled: boolean) => {
    setSoundEnabled(enabled)
    notificationSound.setEnabled(enabled)

    // Initialize audio context on first enable
    if (enabled) {
      await notificationSound.initializeOnUserInteraction()
    }

    toast({
      title: enabled ? "Sound Enabled" : "Sound Disabled",
      description: `Low stock alert sounds are now ${enabled ? "enabled" : "disabled"}`,
    })
  }

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(timestamp)
  }

  // Get alert icon and color
  const getAlertDisplay = (alert: LowStockAlert) => {
    if (alert.alertLevel === "critical") {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        badgeClass: "bg-red-100 text-red-800 border-red-200",
        cardClass: "border-red-200 bg-red-50/50",
      }
    }
    return {
      icon: <Package className="h-4 w-4" />,
      badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cardClass: "border-yellow-200 bg-yellow-50/50",
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative",
            hasAlerts && "border-orange-200 bg-orange-50 hover:bg-orange-100",
            criticalAlertsCount > 0 && "border-red-200 bg-red-50 hover:bg-red-100",
            className,
          )}
        >
          {hasAlerts ? (
            <Bell className={cn("h-4 w-4", criticalAlertsCount > 0 ? "text-red-600" : "text-orange-600")} />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          {hasAlerts && (
            <Badge
              variant="secondary"
              className={cn(
                "absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs",
                criticalAlertsCount > 0 ? "bg-red-600 text-white" : "bg-orange-600 text-white",
              )}
            >
              {alertsCount}
            </Badge>
          )}
          <span className="ml-2 hidden sm:inline">
            {hasAlerts ? `${alertsCount} Alert${alertsCount > 1 ? "s" : ""}` : "No Alerts"}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Low Stock Alerts</span>
            {hasAlerts && (
              <Badge variant={criticalAlertsCount > 0 ? "destructive" : "secondary"}>{alertsCount} Active</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Real-time monitoring of IT inventory stock levels. Alerts are triggered when items reach 3 units or below.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Sound Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span>Sound Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm text-muted-foreground">Play sound alerts when stock levels are low</p>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Active Alerts</h3>
              {hasAlerts && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Test sound
                    if (soundEnabled) {
                      notificationSound.playWarningSound()
                    }
                  }}
                  className="text-xs"
                >
                  Test Sound
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !hasAlerts ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No low stock alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">All IT inventory items are well stocked</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const display = getAlertDisplay(alert)
                    return (
                      <Card key={alert.id} className={cn("transition-colors", display.cardClass)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between space-x-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                {display.icon}
                                <h4 className="text-sm font-medium truncate">{alert.itemName}</h4>
                                <Badge variant="outline" className={display.badgeClass}>
                                  {alert.alertLevel === "critical" ? "Out of Stock" : "Low Stock"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Package className="h-3 w-3" />
                                  <span>{alert.currentStock} units</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{alert.category}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Building className="h-3 w-3" />
                                  <span>{alert.department}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">
                                    {lowStockMonitor.getUserDisplayName(alert.assignedTo)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Alert triggered at {formatTime(alert.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
