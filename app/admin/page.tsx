"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Download,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  FileText,
  Package,
  FileCheck,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return <div className="p-8">Loading admin dashboard...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your system and monitor performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <RefreshCcw size={14} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Download size={14} />
            <span>Export</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Settings size={14} />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Reservations"
          value="124"
          change="+12%"
          trend="up"
          icon={<User size={18} />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Sites"
          value="48"
          change="+5%"
          trend="up"
          icon={<Package size={18} />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Revenue"
          value="₱1,245,000"
          change="+18%"
          trend="up"
          icon={<FileText size={18} />}
          isLoading={isLoading}
        />
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current status of system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Health</span>
                <span className="font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Usage</span>
                <span className="font-medium">64%</span>
              </div>
              <Progress value={64} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Users</span>
                <span className="font-medium">24</span>
              </div>
              <Progress value={24} max={100} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center">
                <div className="text-green-500">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-medium">Database</span>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center">
                <div className="text-green-500">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-medium">API</span>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center">
                <div className="text-amber-500">
                  <AlertCircle size={18} />
                </div>
                <span className="text-xs font-medium">Storage</span>
                <span className="text-xs text-muted-foreground">Degraded</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg border p-2 text-center">
                <div className="text-green-500">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-medium">Backups</span>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1">
                  <User size={12} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">John Doe created an account</p>
                </div>
                <div className="text-xs text-muted-foreground">2h ago</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-green-100 p-1">
                  <Package size={12} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New site added</p>
                  <p className="text-xs text-muted-foreground">Billboard at Main Street</p>
                </div>
                <div className="text-xs text-muted-foreground">5h ago</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-amber-100 p-1">
                  <FileCheck size={12} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Content approved</p>
                  <p className="text-xs text-muted-foreground">Summer campaign materials</p>
                </div>
                <div className="text-xs text-muted-foreground">Yesterday</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-purple-100 p-1">
                  <Settings size={12} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System updated</p>
                  <p className="text-xs text-muted-foreground">Version 2.4.0 deployed</p>
                </div>
                <div className="text-xs text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-between">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  <span>Manage Users</span>
                </span>
                <ArrowUpRight size={14} />
              </Button>
              <Button variant="outline" className="justify-between">
                <span className="flex items-center gap-2">
                  <Package size={16} />
                  <span>Manage Products</span>
                </span>
                <ArrowUpRight size={14} />
              </Button>
              <Button variant="outline" className="justify-between">
                <span className="flex items-center gap-2">
                  <FileText size={16} />
                  <span>View Reports</span>
                </span>
                <ArrowUpRight size={14} />
              </Button>
              <Button variant="outline" className="justify-between">
                <span className="flex items-center gap-2">
                  <Settings size={16} />
                  <span>System Settings</span>
                </span>
                <ArrowUpRight size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Items requiring administrator review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-1.5">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">User Registration</p>
                  <p className="text-xs text-muted-foreground">2 new users awaiting approval</p>
                </div>
              </div>
              <Button size="sm">Review</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-1.5">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Content Submission</p>
                  <p className="text-xs text-muted-foreground">5 items awaiting review</p>
                </div>
              </div>
              <Button size="sm">Review</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-1.5">
                  <Clock size={14} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Site Registration</p>
                  <p className="text-xs text-muted-foreground">1 new site awaiting approval</p>
                </div>
              </div>
              <Button size="sm">Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  isLoading,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ReactNode
  isLoading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {isLoading ? (
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <>
                  {trend === "up" ? (
                    <ArrowUpRight size={14} className="text-green-500" />
                  ) : trend === "down" ? (
                    <ArrowDownRight size={14} className="text-red-500" />
                  ) : (
                    <span className="w-3.5 h-3.5">—</span>
                  )}
                  <span
                    className={`text-xs font-medium ${
                      trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {change} from last month
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="bg-primary/10 p-2 rounded-md">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
