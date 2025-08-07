"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ChevronDown, DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart, BarChart3, FileText, Calendar, Users, AlertCircle } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RouteProtection } from "@/components/route-protection"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function FinanceDashboardPage() {
  const { userData } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("This Month")

  // Sample financial data
  const financialMetrics = [
    {
      title: "Total Revenue",
      value: "₱2,450,000",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Expenses",
      value: "₱1,850,000",
      change: "+8.2%",
      trend: "up",
      icon: CreditCard,
      color: "text-red-600"
    },
    {
      title: "Net Profit",
      value: "₱600,000",
      change: "+18.7%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Cash Flow",
      value: "₱320,000",
      change: "-5.3%",
      trend: "down",
      icon: BarChart3,
      color: "text-blue-600"
    }
  ]

  const recentTransactions = [
    {
      id: "TXN-001",
      description: "LED Billboard Installation - SM Mall",
      amount: "₱450,000",
      type: "income",
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "TXN-002",
      description: "Equipment Purchase - LED Panels",
      amount: "₱280,000",
      type: "expense",
      date: "2024-01-14",
      status: "completed"
    },
    {
      id: "TXN-003",
      description: "Monthly Rent - Office Space",
      amount: "₱85,000",
      type: "expense",
      date: "2024-01-13",
      status: "pending"
    },
    {
      id: "TXN-004",
      description: "Digital Advertising Campaign",
      amount: "₱320,000",
      type: "income",
      date: "2024-01-12",
      status: "completed"
    }
  ]

  const upcomingPayments = [
    {
      id: "PAY-001",
      description: "Supplier Payment - LED Components",
      amount: "₱150,000",
      dueDate: "2024-01-20",
      priority: "high"
    },
    {
      id: "PAY-002",
      description: "Employee Salaries",
      amount: "₱420,000",
      dueDate: "2024-01-25",
      priority: "high"
    },
    {
      id: "PAY-003",
      description: "Utility Bills",
      amount: "₱35,000",
      dueDate: "2024-01-28",
      priority: "medium"
    }
  ]

  return (
    <RouteProtection requiredRoles="finance">
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold">
              {userData?.first_name
                ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Finance Dashboard`
                : "Finance Dashboard"}
            </h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    {selectedPeriod} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedPeriod("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("This Month")}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("This Quarter")}>This Quarter</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedPeriod("This Year")}>This Year</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Financial Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialMetrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </CardTitle>
                    <Icon className={cn("h-4 w-4", metric.color)} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>
                        {metric.change}
                      </span>
                      <span className="ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.description}</span>
                            <Badge 
                              variant={transaction.status === "completed" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.id} • {transaction.date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-semibold",
                            transaction.type === "income" ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === "income" ? "+" : "-"}{transaction.amount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Transactions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Payments */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingPayments.map((payment) => (
                      <div key={payment.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{payment.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {payment.dueDate}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.priority === "high" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge 
                              variant={payment.priority === "high" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {payment.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="font-semibold text-red-600 mt-2">
                          {payment.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Payments
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium">Financial Reports</h3>
                <p className="text-sm text-gray-500">Generate detailed reports</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-medium">Budget Planning</h3>
                <p className="text-sm text-gray-500">Plan and track budgets</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium">Expense Management</h3>
                <p className="text-sm text-gray-500">Track and categorize expenses</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-gray-500">View financial analytics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RouteProtection>
  )
}
