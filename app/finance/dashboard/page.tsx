"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, PieChart, Calendar, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function FinanceDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Finance Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
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
            <div className="text-2xl font-bold">₱2,450,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱485,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                23 pending
              </span>
              invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱890,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                +3.2%
              </span>
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱1,560,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +18.7%
              </span>
              profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the past 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="space-y-4">
                  {[
                    { month: "Jan", amount: 2100000, growth: 12 },
                    { month: "Feb", amount: 2250000, growth: 15 },
                    { month: "Mar", amount: 2180000, growth: -3 },
                    { month: "Apr", amount: 2350000, growth: 8 },
                    { month: "May", amount: 2420000, growth: 11 },
                    { month: "Jun", amount: 2450000, growth: 12 }
                  ].map((data, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 text-sm font-medium">{data.month}</div>
                      <div className="flex-1">
                        <Progress value={(data.amount / 2500000) * 100} className="h-2" />
                      </div>
                      <div className="w-20 text-sm text-right">₱{(data.amount / 1000000).toFixed(1)}M</div>
                      <div className={`w-16 text-xs text-right ${data.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.growth > 0 ? '+' : ''}{data.growth}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "payment", client: "Summit Media", amount: 125000, status: "completed" },
                    { type: "invoice", client: "GTS Holdings", amount: 89000, status: "pending" },
                    { type: "expense", client: "Equipment Rental", amount: -45000, status: "completed" },
                    { type: "payment", client: "HDI Admix", amount: 156000, status: "completed" },
                    { type: "invoice", client: "Moving Walls", amount: 78000, status: "overdue" }
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-500' :
                        transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{transaction.client}</p>
                        <p className="text-xs text-muted-foreground capitalize">{transaction.type}</p>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}₱{Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Track and manage all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "INV-001", client: "Summit Media", amount: 125000, status: "paid", dueDate: "2024-01-15" },
                  { id: "INV-002", client: "GTS Holdings", amount: 89000, status: "pending", dueDate: "2024-01-20" },
                  { id: "INV-003", client: "HDI Admix", amount: 156000, status: "paid", dueDate: "2024-01-18" },
                  { id: "INV-004", client: "Moving Walls", amount: 78000, status: "overdue", dueDate: "2024-01-10" },
                  { id: "INV-005", client: "Vistar Media", amount: 92000, status: "pending", dueDate: "2024-01-25" }
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{invoice.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">₱{invoice.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                      </div>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' :
                        invoice.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {invoice.status === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {invoice.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {invoice.status === 'overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {invoice.status}
                      </Badge>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking</CardTitle>
              <CardDescription>Monitor operational expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: "Equipment Rental", amount: 245000, percentage: 28, trend: "up" },
                  { category: "Staff Salaries", amount: 320000, percentage: 36, trend: "stable" },
                  { category: "Utilities", amount: 85000, percentage: 10, trend: "down" },
                  { category: "Maintenance", amount: 125000, percentage: 14, trend: "up" },
                  { category: "Marketing", amount: 95000, percentage: 11, trend: "stable" },
                  { category: "Other", amount: 20000, percentage: 2, trend: "down" }
                ].map((expense, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{expense.category}</span>
                        <span className="text-sm text-muted-foreground">₱{expense.amount.toLocaleString()}</span>
                      </div>
                      <Progress value={expense.percentage} className="h-2" />
                    </div>
                    <div className={`text-xs ${
                      expense.trend === 'up' ? 'text-red-600' :
                      expense.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {expense.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                      {expense.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                      {expense.trend === 'stable' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate comprehensive financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Profit & Loss Statement
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Cash Flow Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Balance Sheet
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Tax Summary
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start">
                  <Receipt className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <PieChart className="mr-2 h-4 w-4" />
                  Budget Planning
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
