"use client"

import { TableHeader } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { RegistrationSuccessDialog } from "@/components/registration-success-dialog"
import { OnboardingTour } from "@/components/onboarding-tour"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowUpRight, CreditCard, DollarSign, Users, Activity } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart" // Corrected import path for Chart components
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export default function AdminDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false)
  const [registeredFirstName, setRegisteredFirstName] = useState("")
  const [triggerOnboardingTour, setTriggerOnboardingTour] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  useEffect(() => {
    const registered = searchParams.get("registered")
    const firstName = searchParams.get("firstName") // Assuming you might pass firstName via query param
    if (registered === "true") {
      setShowRegistrationSuccess(true)
      setRegisteredFirstName(firstName || "User")
      // Clear the query parameter to prevent dialog from showing on refresh
      router.replace("/admin/dashboard", undefined, { shallow: true })
    }
  }, [searchParams, router])

  const handleCloseRegistrationSuccess = () => {
    setShowRegistrationSuccess(false)
  }

  const handleStartOnboardingTour = () => {
    setShowRegistrationSuccess(false) // Close the success dialog
    setTriggerOnboardingTour(true) // Trigger the onboarding tour
  }

  // Placeholder data for charts and tables (replace with actual data fetching)
  const salesData = [
    { month: "Jan", sales: 1890 },
    { month: "Feb", sales: 2300 },
    { month: "Mar", sales: 2800 },
    { month: "Apr", sales: 2200 },
    { month: "May", sales: 3000 },
    { month: "Jun", sales: 2700 },
  ]

  const recentOrders = [
    { id: "ORD001", customer: "Alice Smith", amount: "$250.00", status: "Pending" },
    { id: "ORD002", customer: "Bob Johnson", amount: "$150.00", status: "Completed" },
    { id: "ORD003", customer: "Charlie Brown", amount: "$300.00", status: "Processing" },
    { id: "ORD004", customer: "Diana Prince", amount: "$100.00", status: "Cancelled" },
  ]

  interface Department {
    id: string
    name: string
    headerColor: string
    contentBgColor: string
    members: string[]
    metricLabel?: string
    metricValue?: string
    badgeCount?: number
    href?: string
  }

  function DepartmentCard({ department }: { department: Department }) {
    const cardContent = (
      <>
        <CardHeader className={cn("relative p-4 rounded-t-lg", department.headerColor)}>
          <CardTitle className="text-white text-lg font-semibold flex justify-between items-center">
            {department.name}
            {department.badgeCount !== undefined && (
              <Badge className="bg-white text-gray-800 rounded-full px-2 py-0.5 text-xs font-bold">
                {department.badgeCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cn("p-4 rounded-b-lg flex flex-col justify-between flex-grow", department.contentBgColor)}
        >
          <div>
            {department.members.map((member, index) => (
              <p key={index} className="text-sm text-gray-700 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {member}
              </p>
            ))}
            {department.metricLabel && department.metricValue && (
              <div className="mt-4 text-sm">
                <p className="text-gray-500">{department.metricLabel}</p>
                <p className="font-bold text-gray-800">{department.metricValue}</p>
              </div>
            )}
          </div>
          <Button variant="outline" className="mt-4 w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" /> Add Widget
          </Button>
        </CardContent>
      </>
    )

    if (department.href) {
      return (
        <Link href={department.href} passHref>
          <Card className="h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
            {cardContent}
          </Card>
        </Link>
      )
    }

    return <Card className="h-full flex flex-col overflow-hidden">{cardContent}</Card>
  }

  const departmentData: Department[] = [
    {
      id: "sales",
      name: "Sales",
      headerColor: "bg-department-sales-red",
      contentBgColor: "bg-card-content-sales",
      members: ["Noemi", "Matthew"],
      metricLabel: "Monthly Revenue",
      metricValue: "4,000,000",
      badgeCount: 2,
      href: "/sales/dashboard",
    },
    {
      id: "logistics",
      name: "Logistics/ Operations",
      headerColor: "bg-department-logistics-blue",
      contentBgColor: "bg-card-content-logistics",
      members: ["Chona", "May"],
      metricLabel: "Total Service Assignments",
      metricValue: "5",
      badgeCount: 1,
      href: "/logistics/dashboard",
    },
    {
      id: "accounting",
      name: "Accounting",
      headerColor: "bg-department-accounting-purple",
      contentBgColor: "bg-card-content-accounting",
      members: ["Chairman"],
    },
    {
      id: "treasury",
      name: "Treasury",
      headerColor: "bg-department-treasury-green",
      contentBgColor: "bg-card-content-treasury",
      members: ["Juvy"],
    },
    {
      id: "it",
      name: "I.T.",
      headerColor: "bg-department-it-teal",
      contentBgColor: "bg-card-content-it",
      members: ["Emmerson"],
    },
    {
      id: "fleet",
      name: "Fleet",
      headerColor: "bg-department-fleet-gray",
      contentBgColor: "bg-card-content-fleet",
      members: ["Jonathan"],
    },
    {
      id: "creatives",
      name: "Creatives/Contents",
      headerColor: "bg-department-creatives-orange",
      contentBgColor: "bg-card-content-creatives",
      members: ["Eda"],
    },
    {
      id: "finance",
      name: "Finance",
      headerColor: "bg-department-finance-green",
      contentBgColor: "bg-card-content-finance",
      members: ["Juvy"],
    },
    {
      id: "media",
      name: "Media/ Procurement",
      headerColor: "bg-department-media-lightblue",
      contentBgColor: "bg-card-content-media",
      members: ["Zen"],
    },
    {
      id: "businessDev",
      name: "Business Dev.",
      headerColor: "bg-department-businessdev-darkpurple",
      contentBgColor: "bg-card-content-businessdev",
      members: ["Nikki"],
    },
    {
      id: "legal",
      name: "Legal",
      headerColor: "bg-department-legal-darkred",
      contentBgColor: "bg-card-content-legal",
      members: ["Chona"],
      badgeCount: 2,
    },
    {
      id: "corporate",
      name: "Corporate",
      headerColor: "bg-department-corporate-lightblue",
      contentBgColor: "bg-card-content-corporate",
      members: ["Anthony"],
      badgeCount: 1,
    },
    {
      id: "hr",
      name: "Human Resources",
      headerColor: "bg-department-hr-pink",
      contentBgColor: "bg-card-content-hr",
      members: ["Vanessa"],
      badgeCount: 1,
    },
    {
      id: "specialTeam",
      name: "Special Team",
      headerColor: "bg-department-specialteam-lightpurple",
      contentBgColor: "bg-card-content-specialteam",
      members: ["Mark"],
    },
    {
      id: "marketing",
      name: "Marketing",
      headerColor: "bg-department-marketing-red",
      contentBgColor: "bg-card-content-marketing",
      members: ["John"],
    },
    {
      id: "addDepartment",
      name: "+ Add New Department",
      headerColor: "bg-department-add-darkgray",
      contentBgColor: "bg-card-content-add",
      members: [],
    },
  ]

  const filteredDepartments = departmentData.filter((department) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      department.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      department.members.some((member) => member.toLowerCase().includes(lowerCaseSearchTerm))
    )
  })

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <Card className="sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle>Your Orders</CardTitle>
                  <CardDescription className="max-w-lg text-balance leading-relaxed">
                    Introducing our new dashboard for a more streamlined experience.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>Create New Order</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+2350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales Over Time</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-sm bg-transparent">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">View All</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>This Month</DropdownMenuItem>
                      <DropdownMenuItem>This Year</DropdownMenuItem>
                      <DropdownMenuItem>All Time</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      sales: {
                        label: "Sales",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <LineChart data={salesData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.customer}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="grid gap-4 md:gap-8">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-start bg-muted/50">
                <div className="grid gap-0.5">
                  <CardTitle className="group flex items-center gap-2 text-lg">Order #SP001</CardTitle>
                  <CardDescription>Date: November 23, 2023</CardDescription>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-8 gap-1 bg-transparent">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Pay Now</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="outline" className="h-8 w-8 bg-transparent">
                        <span className="sr-only">More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Export</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Trash</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-6 text-sm">
                <div className="grid gap-3">
                  <div className="font-semibold">Order Details</div>
                  <ul className="grid gap-3">
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">LED Billboard (x1)</span>
                      <span>$250.00</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Installation Service (x1)</span>
                      <span>$50.00</span>
                    </li>
                  </ul>
                  <Separator className="my-2" />
                  <ul className="grid gap-3">
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>$300.00</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>$5.00</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>$25.00</span>
                    </li>
                    <li className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span>$330.00</span>
                    </li>
                  </ul>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  <div className="font-semibold">Customer Information</div>
                  <dl className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Customer</dt>
                      <dd>Liam Johnson</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>
                        <a href="mailto:">liam@example.com</a>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>
                        <a href="tel:">+1 234 567 890</a>
                      </dd>
                    </div>
                  </dl>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  <div className="font-semibold">Shipping Information</div>
                  <dl className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd>
                        123 Main St.
                        <br />
                        Anytown, CA 12345
                      </dd>
                    </div>
                  </dl>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  <div className="font-semibold">Payment Information</div>
                  <dl className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Card</dt>
                      <dd>**** **** **** 4242</dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <RegistrationSuccessDialog
        isOpen={showRegistrationSuccess}
        firstName={registeredFirstName}
        onClose={handleCloseRegistrationSuccess}
        onStartTour={handleStartOnboardingTour}
      />
      <OnboardingTour triggerTour={triggerOnboardingTour} />
    </div>
  )
}
