"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Package, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { lowStockMonitor } from "@/lib/low-stock-monitoring-service"

interface StockLevelIndicatorProps {
  stock: number
  maxStock?: number
  showProgress?: boolean
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StockLevelIndicator({
  stock,
  maxStock = 100,
  showProgress = false,
  showIcon = true,
  size = "md",
  className,
}: StockLevelIndicatorProps) {
  const stockStatus = lowStockMonitor.getStockStatus(stock)
  const percentage = Math.min((stock / maxStock) * 100, 100)

  const getStatusConfig = () => {
    switch (stockStatus) {
      case "critical":
        return {
          label: "Out of Stock",
          badgeClass: "bg-red-100 text-red-800 border-red-200",
          progressClass: "bg-red-500",
          icon: <AlertTriangle className="h-3 w-3" />,
          textColor: "text-red-700",
        }
      case "low":
        return {
          label: "Low Stock",
          badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
          progressClass: "bg-yellow-500",
          icon: <Package className="h-3 w-3" />,
          textColor: "text-yellow-700",
        }
      default:
        return {
          label: "In Stock",
          badgeClass: "bg-green-100 text-green-800 border-green-200",
          progressClass: "bg-green-500",
          icon: <CheckCircle className="h-3 w-3" />,
          textColor: "text-green-700",
        }
    }
  }

  const config = getStatusConfig()
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        {showIcon && config.icon}
        <Badge variant="outline" className={cn(config.badgeClass, sizeClasses[size])}>
          {stock} units
        </Badge>
        <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stock} units</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}
