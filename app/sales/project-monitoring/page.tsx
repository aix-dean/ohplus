"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Filter,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  MoreVertical,
  Activity,
  Target,
  Users,
} from "lucide-react"
import { format, differenceInDays } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data structure for projects
interface Project {
  id: string
  title: string
  client: {
    company: string
    contactPerson: string
  }
  status: "planning" | "in_progress" | "review" | "completed" | "on_hold" | "overdue"
  progress: number
  startDate: Date
  endDate: Date
  budget: number
  teamMembers: number
  priority: "low" | "medium" | "high" | "critical"
  createdAt: Date
}

// Mock data - in a real app, this would come from your database
const mockProjects: Project[] = [
  {
    id: "proj_001",
    title: "Digital Marketing Campaign Q1",
    client: {
      company: "TechCorp Solutions",
      contactPerson: "John Smith",
    },
    status: "in_progress",
    progress: 65,
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-03-30"),
    budget: 150000,
    teamMembers: 5,
    priority: "high",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "proj_002",
    title: "Brand Identity Redesign",
    client: {
      company: "StartupXYZ",
      contactPerson: "Sarah Johnson",
    },
    status: "review",
    progress: 90,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-28"),
    budget: 75000,
    teamMembers: 3,
    priority: "medium",
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "proj_003",
    title: "Website Development Project",
    client: {
      company: "Local Business Inc",
      contactPerson: "Mike Davis",
    },
    status: "overdue",
    progress: 45,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-02-15"),
    budget: 200000,
    teamMembers: 8,
    priority: "critical",
    createdAt: new Date("2023-12-20"),
  },
]

export default function ProjectMonitoringPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    if (user?.uid) {
      loadProjects()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, statusFilter, priorityFilter])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setProjects(mockProjects)
    } catch (error) {
      console.error("Error loading projects:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.client.company.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((project) => project.priority === priorityFilter)
    }

    setFilteredProjects(filtered)
  }

  const getStatusConfig = (status: Project["status"]) => {
    switch (status) {
      case "planning":
        return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock, label: "Planning" }
      case "in_progress":
        return { color: "bg-green-100 text-green-800 border-green-200", icon: Activity, label: "In Progress" }
      case "review":
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Eye, label: "Under Review" }
      case "completed":
        return { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, label: "Completed" }
      case "on_hold":
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock, label: "On Hold" }
      case "overdue":
        return { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, label: "Overdue" }
      default:
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock, label: "Unknown" }
    }
  }

  const getPriorityConfig = (priority: Project["priority"]) => {
    switch (priority) {
      case "low":
        return { color: "bg-gray-100 text-gray-800", label: "Low" }
      case "medium":
        return { color: "bg-blue-100 text-blue-800", label: "Medium" }
      case "high":
        return { color: "bg-orange-100 text-orange-800", label: "High" }
      case "critical":
        return { color: "bg-red-100 text-red-800", label: "Critical" }
      default:
        return { color: "bg-gray-100 text-gray-800", label: "Unknown" }
    }
  }

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date()
    const days = differenceInDays(endDate, today)
    return days
  }

  const getProgressColor = (progress: number, status: string) => {
    if (status === "overdue") return "bg-red-500"
    if (progress >= 90) return "bg-green-500"
    if (progress >= 70) return "bg-blue-500"
    if (progress >= 40) return "bg-yellow-500"
    return "bg-gray-300"
  }

  const formatDate = (date: Date) => {
    return format(date, "MMM d, yyyy")
  }

  const handleViewProject = (projectId: string) => {
    // In a real app, this would navigate to project details
    console.log("View project:", projectId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Project Monitoring</h1>
              <p className="text-lg text-gray-600">
                Track project progress, deadlines, and team performance across all active campaigns
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="border shadow-sm bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search projects, clients, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-12 border-gray-200 bg-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-48 h-12 border-gray-200 bg-white">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {loading ? (
          <Card className="border shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-bold text-gray-900 py-4">Project</TableHead>
                  <TableHead className="font-bold text-gray-900">Client</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="font-bold text-gray-900">Progress</TableHead>
                  <TableHead className="font-bold text-gray-900">Priority</TableHead>
                  <TableHead className="font-bold text-gray-900">Deadline</TableHead>
                  <TableHead className="font-bold text-gray-900">Budget</TableHead>
                  <TableHead className="font-bold text-gray-900">Team</TableHead>
                  <TableHead className="font-bold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-gray-100">
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-28 mb-1" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card className="border shadow-sm bg-white">
            <CardContent className="text-center py-20">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Target className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "No projects found"
                  : "No projects to monitor"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find what you're looking for"
                  : "Start by creating projects from your proposals and campaigns to monitor their progress"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-bold text-gray-900 py-4">Project</TableHead>
                  <TableHead className="font-bold text-gray-900">Client</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="font-bold text-gray-900">Progress</TableHead>
                  <TableHead className="font-bold text-gray-900">Priority</TableHead>
                  <TableHead className="font-bold text-gray-900">Deadline</TableHead>
                  <TableHead className="font-bold text-gray-900 text-right">Budget</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center">Team</TableHead>
                  <TableHead className="font-bold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const statusConfig = getStatusConfig(project.status)
                  const priorityConfig = getPriorityConfig(project.priority)
                  const StatusIcon = statusConfig.icon
                  const daysRemaining = getDaysRemaining(project.endDate)

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 group"
                      onClick={() => handleViewProject(project.id)}
                    >
                      <TableCell className="py-4">
                        <div>
                          <div className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {project.title}
                          </div>
                          <div className="text-sm text-gray-500">ID: {project.id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{project.client.company}</div>
                            <div className="text-sm text-gray-500">{project.client.contactPerson}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`${statusConfig.color} border font-medium px-3 py-1`}>
                          <StatusIcon className="mr-2 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress, project.status)}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`${priorityConfig.color} border font-medium px-3 py-1`}>
                          {priorityConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(project.endDate)}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              daysRemaining < 0
                                ? "text-red-600"
                                : daysRemaining <= 7
                                  ? "text-orange-600"
                                  : "text-gray-500"
                            }`}
                          >
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} days overdue`
                              : daysRemaining === 0
                                ? "Due today"
                                : `${daysRemaining} days remaining`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="font-bold text-gray-900 text-lg">₱{project.budget.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{project.teamMembers}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <TrendingUp className="mr-2 h-4 w-4" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
