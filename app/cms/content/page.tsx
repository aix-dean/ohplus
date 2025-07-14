"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Upload,
  FileText,
  ImageIcon,
  Video,
  Calendar,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// Mock content data
const mockContent = [
  {
    id: "1",
    title: "Samsung Galaxy S24 Campaign",
    type: "video",
    status: "published",
    duration: "30s",
    size: "15.2 MB",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    thumbnail: "/led-billboard-1.png",
    tags: ["electronics", "smartphone", "samsung"],
    displays: ["EDSA Shaw", "Ayala Triangle"],
  },
  {
    id: "2",
    title: "Jollibee Holiday Special",
    type: "image",
    status: "draft",
    duration: "15s",
    size: "8.5 MB",
    createdAt: "2024-01-18",
    updatedAt: "2024-01-18",
    thumbnail: "/led-billboard-2.png",
    tags: ["food", "restaurant", "holiday"],
    displays: [],
  },
  {
    id: "3",
    title: "Nike Air Max Promotion",
    type: "video",
    status: "scheduled",
    duration: "45s",
    size: "22.1 MB",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-19",
    thumbnail: "/led-billboard-3.png",
    tags: ["sports", "shoes", "nike"],
    displays: ["BGC Central"],
  },
  {
    id: "4",
    title: "McDonald's New Menu",
    type: "image",
    status: "published",
    duration: "20s",
    size: "12.3 MB",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-21",
    thumbnail: "/led-billboard-4.png",
    tags: ["food", "restaurant", "mcdonalds"],
    displays: ["SM MOA", "EDSA Shaw"],
  },
]

export default function ContentPage() {
  const [content, setContent] = useState(mockContent)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const router = useRouter()
  const { toast } = useToast()

  // Filter content
  const filteredContent = content.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleContentAction = (contentId: string, action: string) => {
    const contentItem = content.find(c => c.id === contentId)
    if (!contentItem) return

    switch (action) {
      case "view":
        router.push(`/cms/content/${contentId}`)
        break
      case "edit":
        router.push(`/cms/content/${contentId}/edit`)
        break
      case "duplicate":
        const duplicated = {
          ...contentItem,
          id: Date.now().toString(),
          title: `${contentItem.title} (Copy)`,
          status: "draft",
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }
        setContent(prev => [duplicated, ...prev])
        toast({
          title: "Content Duplicated",
          description: `${contentItem.title} has been duplicated.`,
        })
        break
      case "delete":
        setContent(prev => prev.filter(c => c.id !== contentId))
        toast({
          title: "Content Deleted",
          description: `${contentItem.title} has been deleted.`,
        })
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200"
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "archived":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600">Manage your digital advertising content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => router.push("/cms/content/new")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Content
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {/* Content Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-all duration-200">
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  <Image
                    src={item.thumbnail || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm">
                    {getTypeIcon(item.type)}
                    <span className="text-xs font-medium capitalize">{item.type}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.duration} • {item.size}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleContentAction(item.id, "view")}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleContentAction(item.id, "edit")}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleContentAction(item.id, "duplicate")}>
                        <FileText className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleContentAction(item.id, "delete")}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      Created: {item.createdAt}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated: {item.updatedAt}
                    </div>
                  </div>

                  {item.displays.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Displays: </span>
                      {item.displays.join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Content</th>
                    <th className="text-left p-4 font-medium text-gray-900">Type</th>
                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                    <th className="text-left p-4 font-medium text-gray-900">Duration</th>
                    <th className="text-left p-4 font-medium text-gray-900">Displays</th>
                    <th className="text-left p-4 font-medium text-gray-900">Updated</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={item.thumbnail || "/placeholder.svg"}
                              alt={item.title}
                              width={48}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.size}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center\
