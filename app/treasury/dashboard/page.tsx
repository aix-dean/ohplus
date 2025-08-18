"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Banknote, Building2, TrendingUp, BarChart3, Shield, Vault } from "lucide-react"

export default function TreasuryDashboardPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Treasury Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage cash flow, investments, and financial risk.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
              <Link href="/treasury/cash-management">Cash Management</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/treasury/bank-accounts">Bank Accounts</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/treasury/investments">Investments</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Management</CardTitle>
              <Banknote className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Monitor daily cash positions and flows.</p>
              <Button asChild size="sm">
                <Link href="/treasury/cash-management">Open</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Bank Accounts</CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Manage bank relationships and accounts.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/treasury/bank-accounts">Open</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Investments</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Track investment portfolios and returns.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/treasury/investments">Open</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Liquidity Planning</CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Forecast cash needs and optimize liquidity.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/treasury/liquidity">Open</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Risk Management</CardTitle>
              <Shield className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Assess and mitigate financial risks.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/treasury/risk">Open</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Treasury Overview</CardTitle>
              <Vault className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Comprehensive treasury analytics and reports.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/treasury/overview">View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator />
        <p className="text-xs text-muted-foreground">
          Treasury functions help optimize cash flow, manage financial risks, and ensure adequate liquidity for
          operations.
        </p>
      </div>
    </div>
  )
}
