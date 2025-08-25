"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Loader2,
  FileText,
  Grid3X3,
  Edit,
  Download,
  Plus,
  X,
  ImageIcon,
  Upload,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { getProposalById } from "@/lib/proposal-service"
import {
  getProposalTemplatesByCompanyId,
  createProposalTemplate,
  uploadFileToFirebaseStorage,
} from "@/lib/firebase-service"
import type { Proposal } from "@/lib/types/proposal"
import type { ProposalTemplate } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

const GoogleMap: React.FC<{ location: string; className?: string }> = ({ location, className }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        if (window.google && window.google.maps) {
          initializeMap()
          return
        }

        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = initializeMap
        script.onerror = () => setMapError(true)
        document.head.appendChild(script)
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setMapError(true)
      }
    }

    const initializeMap = async () => {
      if (!mapRef.current || !window.google) return

      try {
        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ address: location }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const map = new window.google.maps.Map(mapRef.current!, {
              center: results[0].geometry.location,
              zoom: 15,
              disableDefaultUI: true,
              gestureHandling: "none",
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            })

            new window.google.maps.Marker({
              position: results[0].geometry.location,
              map: map,
              title: location,
              icon: {
                url:
                  "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 32),
              },
            })

            setMapLoaded(true)
          } else {
            console.error("Geocoding failed:", status)
            setMapError(true)
          }
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError(true)
      }
    }

    loadGoogleMaps()
  }, [location])

  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs mt-1">{location}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProposalDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { userData } = useAuth()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    background_url: "",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [selectedTemplateBackground, setSelectedTemplateBackground] = useState<string>("")

  useEffect(() => {
    async function fetchProposal() {
      if (params.id) {
        try {
          const proposalData = await getProposalById(params.id as string)
          setProposal(proposalData)
        } catch (error) {
          console.error("Error fetching proposal:", error)
          toast({
            title: "Error",
            description: "Failed to load proposal details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProposal()
  }, [params.id, toast])

  const fetchTemplates = async () => {
    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    setTemplatesLoading(true)
    try {
      const templatesData = await getProposalTemplatesByCompanyId(userData.company_id)
      setTemplates(templatesData)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      })
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleTemplates = () => {
    setShowTemplatesPanel(true)
    setShowCreateForm(false)
    fetchTemplates()
  }

  const handleCreateTemplate = () => {
    setShowCreateForm(true)
    setFormData({ name: "", background_url: "" })
    setSelectedFile(null)
    setFilePreview("")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload only image files (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      })
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview("")
    setFormData((prev) => ({ ...prev, background_url: "" }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    if (!userData?.company_id) {
      toast({
        title: "Error",
        description: "Company information not available",
        variant: "destructive",
      })
      return
    }

    setFormLoading(true)
    try {
      let backgroundUrl = formData.background_url

      if (selectedFile) {
        setUploading(true)
        try {
          const uploadPath = `templates/backgrounds/${Date.now()}_${selectedFile.name}`
          backgroundUrl = await uploadFileToFirebaseStorage(selectedFile, uploadPath)
          toast({
            title: "Success",
            description: "Background image uploaded successfully",
          })
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError)
          toast({
            title: "Error",
            description: "Failed to upload background image",
            variant: "destructive",
          })
          return
        } finally {
          setUploading(false)
        }
      }

      await createProposalTemplate({
        name: formData.name.trim(),
        background_url: backgroundUrl,
        company_id: userData.company_id,
      })
      toast({
        title: "Success",
        description: "Template created successfully",
      })
      setShowCreateForm(false)
      setFormData({ name: "", background_url: "" })
      setSelectedFile(null)
      setFilePreview("")
      fetchTemplates()
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBackToList = () => {
    setShowCreateForm(false)
    setFormData({ name: "", background_url: "" })
    setSelectedFile(null)
    setFilePreview("")
  }

  const handleEdit = () => {
    toast({
      title: "Edit Mode",
      description: "Entering edit mode...",
    })
  }

  const handleDownload = () => {
    toast({
      title: "Download",
      description: "Downloading proposal...",
    })
  }

  const handleSaveAsDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Proposal saved as draft",
    })
  }

  const handleSend = () => {
    toast({
      title: "Proposal Sent",
      description: "Proposal has been sent successfully",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600 mb-6">The proposal you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => router.push("/sales/proposals")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-red-500 to-pink-400 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <span>Sales</span>
            <span>&gt;</span>
            <span>Dashboard</span>
            <span>&gt;</span>
            <span>Planning and Proposal</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Notification Section */}
          <div className="bg-blue-400 text-white p-4 rounded-lg m-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Notification</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 bg-white/20 rounded">
                <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-2 bg-white/40 rounded mb-1"></div>
                  <div className="h-2 bg-white/30 rounded w-3/4"></div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-white/20 rounded">
                <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-2 bg-white/40 rounded mb-1"></div>
                  <div className="h-2 bg-white/30 rounded w-2/3"></div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="text-center mt-3">
              <button className="text-xs text-white/80 hover:text-white">See All</button>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 px-4 py-2">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">To Go</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Bulletin Board
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Project Tracker
                  </a>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">To Do</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Proposals
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Bookings
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    JOs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Billings
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">
                    Clients
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Intelligence Section */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg m-4 mt-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center">
                Intelligence <span className="ml-2">✨</span>
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <ChevronLeft className="h-6 w-6 text-white/60" />
              <div className="flex-1 mx-3">
                <div className="h-16 bg-white/20 rounded"></div>
              </div>
              <ChevronRight className="h-6 w-6 text-white/60" />
            </div>
            <div className="text-center mt-3">
              <button className="text-xs text-white/80 hover:text-white">See All</button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex">
          <div className="flex-1 p-6">
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="sm" onClick={() => router.push("/sales/proposals")} className="mr-4">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Finalize Proposal <span className="font-mono">SUM00821</span>
              </h1>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTemplates}
                className="flex flex-col items-center p-3 h-auto bg-transparent"
              >
                <Grid3X3 className="h-5 w-5 mb-1" />
                <span className="text-xs">Templates</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex flex-col items-center p-3 h-auto bg-transparent"
              >
                <Edit className="h-5 w-5 mb-1" />
                <span className="text-xs">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex flex-col items-center p-3 h-auto bg-transparent"
              >
                <Download className="h-5 w-5 mb-1" />
                <span className="text-xs">Download</span>
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Cityscape Header */}
              <div className="h-20 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 relative">
                <img src="/colorful-cityscape-skyline-with-buildings.png" alt="Cityscape header" className="w-full h-full object-cover" />
              </div>

              <div className="p-6">
                {/* Company Logo and Title Section */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {/* GTS Logo */}
                    <div className="w-20 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-yellow-600">
                      <span className="text-white font-bold text-lg tracking-wider">GTS</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Petplans Tower Southbound</h2>
                    <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-md font-semibold">
                      Php 2,000,000.00
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex gap-6">
                  {/* Left Side - Building Image */}
                  <div className="flex-shrink-0">
                    <div className="w-64 h-80 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                      {proposal.products &&
                      proposal.products.length > 0 &&
                      proposal.products[0].media &&
                      proposal.products[0].media.length > 0 ? (
                        <img
                          src={
                            proposal.products[0].media[0].url ||
                            "/placeholder.svg?height=320&width=256&query=tall building with advertising space"
                          }
                          alt={proposal.products[0].name || "Building"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img src="/tall-building-with-advertising-space.png" alt="Building" className="w-full h-full object-cover" />
                      )}
                      {/* Number overlay */}
                      <div className="absolute top-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        20
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Location Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map:</h3>

                    {proposal.products &&
                    proposal.products.length > 0 &&
                    proposal.products[0].specs_rental?.location ? (
                      <GoogleMap location={proposal.products[0].specs_rental.location} className="w-full h-32 mb-4" />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <img
                          src="/street-map-with-location-markers.png"
                          alt="Location map"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-800">
                      <p>
                        <span className="font-semibold">Location:</span> 444 Edsa, Guadalupe Viejo, Makati City
                      </p>
                      <p>
                        <span className="font-semibold">Average Daily Traffic Count:</span> 405,882 vehicles
                      </p>
                      <p>
                        <span className="font-semibold">Location Visibility:</span> 500 meters
                      </p>
                      <p>
                        <span className="font-semibold">Dimension:</span> 150ft (H) x 83ft (W)
                      </p>
                      <p>
                        <span className="font-semibold">Type:</span> Building Wrap
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cityscape Footer */}
              <div className="h-20 bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 relative">
                <img src="/colorful-cityscape-skyline-with-buildings.png" alt="Cityscape footer" className="w-full h-full object-cover" />
              </div>

              {/* Bottom Action Buttons */}
              <div className="p-6 bg-gray-50 flex items-center justify-between">
                <div className="w-20 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-yellow-600">
                  <span className="text-white font-bold text-lg tracking-wider">GTS</span>
                </div>

                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={handleSaveAsDraft} className="px-6 py-2 bg-transparent">
                    Save as Draft
                  </Button>
                  <Button onClick={handleSend} className="bg-green-500 hover:bg-green-600 text-white px-8 py-2">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <aside className="w-64 bg-white border-l border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Proposal History</h3>
            <div className="space-y-3">
              {/* History items */}
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {i === 0 ? (
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                        44
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>

      {/* Template Panel Modal - keeping existing functionality */}
      {showTemplatesPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {showCreateForm ? "Create New Template" : "Proposal Templates"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplatesPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-80px)] md:max-h-[calc(80vh-80px)]">
              {showCreateForm ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* ... existing form code ... */}
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      type="text"
                      placeholder="Enter template name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Image (Optional)</Label>
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="background-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="background-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-8 md:h-12 w-8 md:w-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-6 md:h-8 w-6 md:w-8 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {filePreview && (
                          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                            <img
                              src={filePreview || "/placeholder.svg"}
                              alt="Background preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToList}
                      disabled={formLoading || uploading}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Back to Templates
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      disabled={formLoading || uploading}
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {uploading ? "Uploading..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Template
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <p className="text-gray-600">Choose a template or create a new one</p>
                    <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>

                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Loading templates...</span>
                    </div>
                  ) : templates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => {
                            setSelectedTemplateBackground(template.background_url || "")
                            setShowTemplatesPanel(false)
                            toast({
                              title: "Template Selected",
                              description: `Selected template: ${template.name}`,
                            })
                          }}
                        >
                          {template.background_url ? (
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-3">
                              <img
                                src={template.background_url || "/placeholder.svg"}
                                alt={template.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-3">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {new Date(template.created.seconds * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Grid3X3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                      <p className="text-gray-600 mb-4">Create your first proposal template to get started</p>
                      <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Template
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
