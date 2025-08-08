"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Receipt, CreditCard, TrendingUp, Wallet, Banknote } from 'lucide-react'

export default function AccountingDashboardPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounting Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Track sales records, collections, and encashments at a glance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-[#ff3333] text-white hover:bg-[#cc2929]">
              <Link href="/accounting/sales-record">Sales Record</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/accounting/sales-and-collection">Sales and Collection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/accounting/encashment">Encashment</Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">₱0.00</div>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Collections</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">₱0.00</div>
              <Wallet className="h-5 w-5 text-amber-600" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Encashment Queue</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-2xl font-bold">0</div>
              <Banknote className="h-5 w-5 text-blue-600" />
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-700" />
                <CardTitle className="text-base">Sales Record</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                View and manage all sales entries. Export data for reconciliation.
              </p>
              <div>
                <Button asChild>
                  <Link href="/accounting/sales-record">Go to Sales Record</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-700" />
                <CardTitle className="text-base">Sales and Collection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Track receivables and collections. Match invoices and payments.
              </p>
              <div>
                <Button asChild variant="outline">
                  <Link href="/accounting/sales-and-collection">Open Collections</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-700" />
                <CardTitle className="text-base">Encashment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Process and log encashments with proper authorization workflow.
              </p>
              <div>
                <Button asChild variant="outline">
                  <Link href="/accounting/encashment">Manage Encashment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
