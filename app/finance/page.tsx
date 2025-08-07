"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, PieChart, BarChart3, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function FinancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly")

  // Mock data for demonstration
  const financialMetrics = {
    totalRevenue: 2450000,
    monthlyGrowth: 12.5,
    totalExpenses: 1850000,
    netProfit: 600000,
    profitMargin: 24.5,
    pendingInvoices: 15,
    overduePayments: 3
  }

  const recentTransactions = [
    { id: 1, type: "income", description: "Billboard Campaign - SM Mall", amount: 125000, date: "2024-01-15", status: "completed" },
    { id: 2, type: "expense", description: "LED Panel Maintenance", amount: -25000, date: "2024-01-14", status: "completed" },
    { id: 3, type: "income", description: "Digital Display - Ayala Center", amount: 89000, date: "2024-01-13", status: "pending" },
    { id: 4, type: "expense", description: "Electricity Bills - Q1", amount: -45000, date: "2024-01-12", status: "completed" },
    { id: 5, type: "income", description: "Static Billboard - EDSA", amount: 67000, date: "2024-01-11", status: "completed" }
  ]

  const upcomingPayments = [
    { id: 1, vendor: "LED Tech Solutions", amount: 150000, dueDate: "2024-01-20", type: "Equipment" },
    { id: 2, vendor: "Manila Electric Co.", amount: 85000, dueDate: "2024-01-22", type: "Utilities" },
    { id: 3, vendor: "Site Maintenance Corp", amount: 45000, dueDate: "2024-01-25", type: "Maintenance" }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your financial performance and manage cash flow
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Review
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{financialMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                +{financialMetrics.monthlyGrowth}% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{financialMetrics.netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.profitMargin}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{financialMetrics.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <TrendingDown className="mr-1 h-3 w-3" />
                +5.2% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialMetrics.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {financialMetrics.overduePayments} overdue payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue Chart Placeholder */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Revenue chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Payments due in the next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{payment.vendor}</p>
                        <p className="text-xs text-muted-foreground">{payment.type}</p>
                        <p className="text-xs text-muted-foreground">Due: {payment.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₱{payment.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial transactions and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className={`h-4 w-4 ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : ''}₱{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status === 'completed' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Manage and track your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Invoice Management</h3>
                <p className="text-muted-foreground mb-4">
                  Create, send, and track invoices for your advertising campaigns
                </p>
                <div className="flex justify-center space-x-2">
                  <Button>Create Invoice</Button>
                  <Button variant="outline">View All Invoices</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">Profit & Loss</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comprehensive P&L statement for the selected period
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Cash Flow</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track cash inflows and outflows over time
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">Tax Summary</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tax-related transactions and summaries
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Generate Report
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
