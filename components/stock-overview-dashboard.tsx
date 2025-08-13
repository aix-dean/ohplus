"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Package, CheckCircle, TrendingDown } from "lucide-react"
import { useRealTimeStock } from "@/hooks/use-real-time-stock"
import { cn } from "@/lib/utils"

interface StockOverviewDashboardProps {
  className?: string
}

export function StockOverviewDashboard({ className }: StockOverviewDashboardProps) {
  const { stockItems, loading, getStockStats } = useRealTimeStock()
  const stats = getStockStats()

  if (loading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">Active inventory items</p>
        </CardContent>
      </Card>

      {/* Well Stocked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Well Stocked</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.wellStockedCount}</div>
          <p className="text-xs text-muted-foreground">Items with adequate stock</p>
        </CardContent>
      </Card>

      {/* Low Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <TrendingDown className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
          <p className="text-xs text-muted-foreground">Items needing restocking</p>
          {stats.totalItems > 0 && (
            <div className="mt-2">
              <Progress value={stats.lowStockPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.lowStockPercentage.toFixed(1)}% of inventory</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</div>
          <p className="text-xs text-muted-foreground">Items requiring immediate attention</p>
          {stats.outOfStockCount > 0 && (
            <Badge variant="destructive" className="mt-2">
              Urgent Action Required
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
