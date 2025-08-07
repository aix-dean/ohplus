"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, PieChart, BarChart3, FileText, Calendar, AlertCircle } from 'lucide-react'

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                    +20.1% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,850,000</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2% from last month
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
                <div className="text-2xl font-bold">₱600,000</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15.3% from last month
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱320,000</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    12 pending invoices
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16" />
                  <span className="ml-2">Revenue chart would go here</span>
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
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Payment Received</p>
                      <p className="text-sm text-muted-foreground">ABC Corp - Billboard Campaign</p>
                    </div>
                    <div className="ml-auto font-medium text-green-600">+₱125,000</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Equipment Purchase</p>
                      <p className="text-sm text-muted-foreground">LED Display Units</p>
                    </div>
                    <div className="ml-auto font-medium text-red-600">-₱85,000</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Service Payment</p>
                      <p className="text-sm text-muted-foreground">XYZ Marketing - Digital Ads</p>
                    </div>
                    <div className="ml-auto font-medium text-green-600">+₱45,000</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Billboard Revenue</CardTitle>
                <CardDescription>Static and LED billboard income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,850,000</div>
                <Badge variant="secondary" className="mt-2">75% of total revenue</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Digital Advertising</CardTitle>
                <CardDescription>Online and digital campaign revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱450,000</div>
                <Badge variant="secondary" className="mt-2">18% of total revenue</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Services</CardTitle>
                <CardDescription>Consulting and additional services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱150,000</div>
                <Badge variant="secondary" className="mt-2">7% of total revenue</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Operational Costs</CardTitle>
                <CardDescription>Daily operations and maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱850,000</div>
                <Badge variant="destructive" className="mt-2">46% of total expenses</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff Salaries</CardTitle>
                <CardDescription>Employee compensation and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱650,000</div>
                <Badge variant="destructive" className="mt-2">35% of total expenses</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment & Technology</CardTitle>
                <CardDescription>Hardware and software investments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱350,000</div>
                <Badge variant="destructive" className="mt-2">19% of total expenses</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate and download financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Monthly P&L Statement
                </Button>
                <Button className="w-full" variant="outline">
                  <PieChart className="mr-2 h-4 w-4" />
                  Cash Flow Report
                </Button>
                <Button className="w-full" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Revenue Analysis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common financial tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">
                  <Receipt className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
                <Button className="w-full" variant="outline">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Record Expense
                </Button>
                <Button className="w-full" variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Track Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
