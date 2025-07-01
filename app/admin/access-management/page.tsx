"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Lock, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // For Notification section mock
import { ChevronLeft, ChevronRight, Sparkles, ClipboardList, FileText, Package, LayoutDashboard } from "lucide-react" // For Notification/To Go/To Do/Intelligence sections mock
import Link from "next/link" // For side nav links

// Replicating the mock "Notification", "To Go", "To Do", "Intelligence" sections that were duplicated
function AdminPageSidebarMock() {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 shadow-sm p-3 space-y-4">
      {/* Notification Section */}
      <div className="bg-[#3399FF] rounded-lg p-3 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Notification</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-white/20 text-white text-xs">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-white/30 rounded-full mb-1"></div>
              <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
            </div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-white/20 text-white text-xs">SM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-white/30 rounded-full mb-1"></div>
              <div className="h-2 bg-white/20 rounded-full w-2/3"></div>
            </div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
        </div>
      </div>

      {/* To Go Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">To Go</h3>
        </div>
        <div className="p-1">
          {[
            { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
            { title: "Bulletin Board", href: "/admin/bulletin-board", icon: ClipboardList },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Icon className="h-4 w-4 mr-3 text-gray-500" />
                <span className="flex-1">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* To Do Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-3 py-2 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700">To Do</h3>
        </div>
        <div className="p-1">
          {[
            { title: "Documents", href: "/admin/documents", icon: FileText },
            { title: "Inventory", href: "/admin/inventory", icon: Package },
            { title: "User Management", href: "/admin/access-management", icon: Users },
            { title: "Subscription", href: "/settings/subscription", icon: FileText },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full ${item.title === "User Management" ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Icon
                  className={`h-4 w-4 mr-3 ${item.title === "User Management" ? "text-gray-700" : "text-gray-500"}`}
                />
                <span className="flex-1">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Intelligence Section */}
      <div className="bg-[#9933FF] rounded-lg p-3 text-white">
        <div className="flex items-center space-x-2 mb-3">
          <h3 className="text-sm font-medium">Intelligence</h3>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="relative">
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="h-12 bg-white/20 rounded-md"></div>
              <div className="h-12 bg-white/20 rounded-md"></div>
            </div>
            <button className="p-1 hover:bg-white/10 rounded transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
        </div>
      </div>
    </div>
  )
}

export default function AccessManagementPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 w-full">
      {/* The problematic duplicate sidebar mock below is removed. */}
      {/* Original comment: <AdminPageSidebarMock /> */}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Access Management</h1>
        <Button>
          <Lock className="mr-2 h-4 w-4" />
          Initialize Default Permissions
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Assign roles to users to control their access to different parts of the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-9 pr-4 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                  {/* Placeholder for user rows */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* TabsContent for Roles and Permissions would go here */}
      </Tabs>
    </div>
  )
}
