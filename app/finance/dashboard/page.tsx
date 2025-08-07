'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Calculator, PieChart, Calendar, Search, Plus, Download, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function FinanceDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Mock data for financial metrics
  const financialMetrics = [
    {
      title: 'Total Revenue',
      value: '₱2,450,000',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total Expenses',
      value: '₱1,850,000',
      change: '+8.2%',
      trend: 'up',
      icon: TrendingDown,
      color: 'text-red-600'
    },
    {
      title: 'Net Profit',
      value: '₱600,000',
      change: '+18.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Cash Flow',
      value: '₱450,000',
      change: '+5.3%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-blue-600'
    }
  ]

  // Mock data for recent transactions
  const recentTransactions = [
    {
      id: 1,
      description: 'LED Billboard Installation - SM Mall',
      amount: 150000,
      type: 'income',
      date: '2024-01-15',
      status: 'completed',
      category: 'Installation Services'
    },
    {
      id: 2,
      description: 'Equipment Purchase - LED Panels',
      amount: -85000,
      type: 'expense',
      date: '2024-01-14',
      status: 'completed',
      category: 'Equipment'
    },
    {
      id: 3,
      description: 'Monthly Maintenance - Ayala Center',
      amount: 25000,
      type: 'income',
      date: '2024-01-13',
      status: 'pending',
      category: 'Maintenance'
    },
    {
      id: 4,
      description: 'Office Rent Payment',
      amount: -45000,
      type: 'expense',
      date: '2024-01-12',
      status: 'completed',
      category: 'Operating Expenses'
    },
    {
      id: 5,
      description: 'Digital Signage Project - BGC',
      amount: 200000,
      type: 'income',
      date: '2024-01-11',
      status: 'completed',
      category: 'Project Revenue'
    }
  ]

  // Mock data for upcoming payments
  const upcomingPayments = [
    {
      id: 1,
      description: 'Supplier Payment - LED Components',
      amount: 120000,
      dueDate: '2024-01-20',
      priority: 'high',
      vendor: 'TechSupply Corp'
    },
    {
      id: 2,
      description: 'Employee Salaries',
      amount: 180000,
      dueDate: '2024-01-25',
      priority: 'high',
      vendor: 'Payroll'
    },
    {
      id: 3,
      description: 'Utility Bills',
      amount: 15000,
      dueDate: '2024-01-22',
      priority: 'medium',
      vendor: 'Various Utilities'
    },
    {
      id: 4,
      description: 'Insurance Premium',
      amount: 35000,
      dueDate: '2024-01-28',
      priority: 'medium',
      vendor: 'Insurance Co.'
    }
  ]

  const quickActions = [
    {
      title: 'Generate Report',
      description: 'Create financial reports',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => console.log('Generate Report')
    },
    {
      title: 'Budget Planning',
      description: 'Plan and manage budgets',
      icon: Calculator,
      color: 'bg-green-500',
      action: () => console.log('Budget Planning')
    },
    {
      title: 'Expense Management',
      description: 'Track and categorize expenses',
      icon: CreditCard,
      color: 'bg-orange-500',
      action: () => console.log('Expense Management')
    },
    {
      title: 'Financial Analytics',
      description: 'View detailed analytics',
      icon: PieChart,
      color: 'bg-purple-500',
      action: () => console.log('Financial Analytics')
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your financial performance and manage transactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                )}
                {metric.change} from last {selectedPeriod}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest financial transactions and activities
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className={`h-4 w-4 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">View All Transactions</Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>
              Payments due in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={
                      payment.priority === 'high' ? 'destructive' : 
                      payment.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {payment.priority} priority
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Due {formatDate(payment.dueDate)}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{payment.description}</p>
                  <p className="text-xs text-muted-foreground mb-2">{payment.vendor}</p>
                  <p className="font-semibold text-red-600">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Payment Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common financial tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
