"use client"

import { useState } from "react"
import { Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/access-management/user-management"
import { RoleManagement } from "@/components/access-management/role-management"
import { PermissionManagement } from "@/components/access-management/permission-management"

export default function AccessManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-bold">Access Management</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users, roles, or permissions..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  Filter: {selectedFilter} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedFilter("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Inactive")}>Inactive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Admins")}>Admins</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("Editors")}>Editors</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs for User, Role, and Permission Management */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement searchTerm={searchTerm} filter={selectedFilter} />
          </TabsContent>
          <TabsContent value="roles">
            <RoleManagement searchTerm={searchTerm} filter={selectedFilter} />
          </TabsContent>
          <TabsContent value="permissions">
            <PermissionManagement searchTerm={searchTerm} filter={selectedFilter} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
