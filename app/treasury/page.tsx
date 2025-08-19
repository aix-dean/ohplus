"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PieChart,
  BarChart3,
  FileText,
  Banknote,
} from "lucide-react"

export default function TreasuryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Treasury Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱8,750,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱2,500,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 flex items-center">
                <Banknote className="h-3 w-3 mr-1" />
                Credit line utilization: 35%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱125,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% from yesterday
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Portfolio</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱3,200,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +7.8% portfolio return
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Treasury Activities */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Treasury Activities</CardTitle>
            <CardDescription>Latest cash management and investment activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "TRS-001",
                  description: "Term Deposit Maturity",
                  amount: "₱500,000",
                  type: "Investment",
                  status: "Completed",
                  date: "2024-01-15",
                },
                {
                  id: "TRS-002",
                  description: "Foreign Exchange Transaction",
                  amount: "₱250,000",
                  type: "FX Trade",
                  status: "Pending",
                  date: "2024-01-14",
                },
                {
                  id: "TRS-003",
                  description: "Cash Sweep to Investment",
                  amount: "₱1,000,000",
                  type: "Transfer",
                  status: "Completed",
                  date: "2024-01-13",
                },
                {
                  id: "TRS-004",
                  description: "Credit Line Utilization",
                  amount: "₱750,000",
                  type: "Credit",
                  status: "Active",
                  date: "2024-01-12",
                },
              ].map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === "Investment"
                          ? "bg-green-100 text-green-600"
                          : activity.type === "FX Trade"
                            ? "bg-purple-100 text-purple-600"
                            : activity.type === "Transfer"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {activity.type === "Investment" ? (
                        <PieChart className="h-4 w-4" />
                      ) : activity.type === "FX Trade" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : activity.type === "Transfer" ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.id} • {activity.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{activity.amount}</p>
                    <Badge
                      variant={
                        activity.status === "Completed"
                          ? "default"
                          : activity.status === "Pending"
                            ? "secondary"
                            : activity.status === "Active"
                              ? "outline"
                              : "outline"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common treasury management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Cash Transfer
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <PieChart className="mr-2 h-4 w-4" />
              Investment Management
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              Credit Facilities
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              FX Trading
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Risk Analysis
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Treasury Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Treasury Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Forecast</CardTitle>
            <CardDescription>Projected cash inflows and outflows for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-8 w-8 mr-2" />
              Cash flow forecast chart would go here
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investment Performance</CardTitle>
            <CardDescription>Portfolio performance and asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <PieChart className="h-8 w-8 mr-2" />
              Investment performance chart would go here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
