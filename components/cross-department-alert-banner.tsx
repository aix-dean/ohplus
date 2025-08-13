"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, X, ExternalLink } from "lucide-react"
import { useLowStockAlertContext } from "@/contexts/low-stock-alert-context"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CrossDepartmentAlertBannerProps {
  className?: string
  compact?: boolean
}

export function CrossDepartmentAlertBanner({ className, compact = false }: CrossDepartmentAlertBannerProps) {
  const { alerts, hasAlerts, hasCriticalAlerts, criticalAlertsCount, alertsCount, dismissAlert } =
    useLowStockAlertContext()

  if (!hasAlerts) return null

  const criticalAlerts = alerts.filter((alert) => alert.alertLevel === "critical")
  const lowStockAlerts = alerts.filter((alert) => alert.alertLevel === "warning")

  return (
    <Alert
      className={cn(
        "border-l-4 mb-4",
        hasCriticalAlerts
          ? "border-l-red-500 bg-red-50 border-red-200"
          : "border-l-yellow-500 bg-yellow-50 border-yellow-200",
        className,
      )}
    >
      <div className="flex items-start space-x-3">
        {hasCriticalAlerts ? (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : (
          <Package className="h-5 w-5 text-yellow-600 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className={cn("font-semibold", hasCriticalAlerts ? "text-red-800" : "text-yellow-800")}>
              IT Inventory Alert
            </h4>
            <div className="flex items-center space-x-1">
              {criticalAlertsCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalAlertsCount} Critical
                </Badge>
              )}
              {lowStockAlerts.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {lowStockAlerts.length} Low Stock
                </Badge>
              )}
            </div>
          </div>

          <AlertDescription className={cn(hasCriticalAlerts ? "text-red-700" : "text-yellow-700")}>
            {compact ? (
              <span>
                {criticalAlertsCount > 0 && lowStockAlerts.length > 0
                  ? `${criticalAlertsCount} items out of stock, ${lowStockAlerts.length} items low on stock`
                  : criticalAlertsCount > 0
                    ? `${criticalAlertsCount} item${criticalAlertsCount > 1 ? "s" : ""} out of stock`
                    : `${lowStockAlerts.length} item${lowStockAlerts.length > 1 ? "s" : ""} low on stock`}
              </span>
            ) : (
              <div className="space-y-1">
                {criticalAlerts.length > 0 && (
                  <div>
                    <strong>Out of Stock:</strong>{" "}
                    {criticalAlerts.slice(0, 3).map((alert, index) => (
                      <span key={alert.id}>
                        {alert.itemName}
                        {index < Math.min(criticalAlerts.length, 3) - 1 && ", "}
                      </span>
                    ))}
                    {criticalAlerts.length > 3 && ` and ${criticalAlerts.length - 3} more`}
                  </div>
                )}
                {lowStockAlerts.length > 0 && (
                  <div>
                    <strong>Low Stock:</strong>{" "}
                    {lowStockAlerts.slice(0, 3).map((alert, index) => (
                      <span key={alert.id}>
                        {alert.itemName} ({alert.currentStock} units)
                        {index < Math.min(lowStockAlerts.length, 3) - 1 && ", "}
                      </span>
                    ))}
                    {lowStockAlerts.length > 3 && ` and ${lowStockAlerts.length - 3} more`}
                  </div>
                )}
              </div>
            )}
          </AlertDescription>

          <div className="flex items-center space-x-2 mt-3">
            <Button asChild size="sm" variant={hasCriticalAlerts ? "destructive" : "default"}>
              <Link href="/it/inventory" className="flex items-center space-x-1">
                <ExternalLink className="h-3 w-3" />
                <span>View IT Inventory</span>
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Dismiss all current alerts
                alerts.forEach((alert) => dismissAlert(alert.id))
              }}
              className="text-xs"
            >
              Dismiss All
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Dismiss all current alerts
            alerts.forEach((alert) => dismissAlert(alert.id))
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
