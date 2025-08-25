"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, FileText, Grid3X3, Edit, Download, Plus, X, ImageIcon, Upload } from "lucide-react"
import { getProposalById, updateProposal } from "@/lib/proposal-service"
import {
  getProposalTemplatesByCompanyId,
  createProposalTemplate,
  uploadFileToFirebaseStorage,
  downloadProposal,
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
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
          initializeMap()
          return
        }

        // Load Google Maps script
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

        // Geocode the location
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const map = new window.google.maps.Map(mapRef.current!, {
              center: results[0].geometry.location,
              zoom: 15,
              disableDefaultUI: true, // Remove all controls
              gestureHandling: "none", // Disable all gestures
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

            // Add marker
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
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editablePrice, setEditablePrice] = useState("")
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
          setEditablePrice(proposalData.totalAmount.toString())
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
    setIsEditingPrice(true)
    toast({
      title: "Edit Mode",
      description: "You can now edit the proposal price",
    })
  }

  const handleSavePrice = async () => {
    console.log("[v0] Starting price save process")
    console.log("[v0] Current editablePrice:", editablePrice)

    const numericPrice = Number.parseFloat(editablePrice.replace(/,/g, ""))
    console.log("[v0] Parsed numeric price:", numericPrice)

    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.log("[v0] Invalid price detected")
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price amount",
        variant: "destructive",
      })
      return
    }

    if (proposal && userData) {
      try {
        console.log("[v0] Proposal ID:", proposal.id)
        console.log("[v0] User data:", { uid: userData.uid, displayName: userData.displayName })

        const updatedProducts = proposal.products.map((product) => ({
          ...product,
          price: numericPrice,
        }))
        console.log("[v0] Updated products:", updatedProducts)

        const updatedProposal = {
          ...proposal,
          totalAmount: numericPrice,
          products: updatedProducts,
        }

        // Update local state immediately for better UX
        setProposal(updatedProposal)
        setIsEditingPrice(false)

        console.log("[v0] About to call updateProposal with data:", {
          id: proposal.id,
          updateData: {
            totalAmount: numericPrice,
            products: updatedProducts,
          },
          userId: userData.uid || "current_user",
          userName: userData.displayName || "Current User",
        })

        // Persist changes to database
        await updateProposal(
          proposal.id,
          {
            totalAmount: numericPrice,
            products: updatedProducts,
          },
          userData.uid || "current_user",
          userData.displayName || "Current User",
        )

        console.log("[v0] updateProposal completed successfully")
        toast({
          title: "Price Updated",
          description: `Price updated to ₱${numericPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        })
      } catch (error) {
        console.error("[v0] Error updating proposal price:", error)
        console.log("[v0] Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        })
        // Revert local state on error
        setEditablePrice(proposal.totalAmount.toString())
        setIsEditingPrice(false)
        toast({
          title: "Update Failed",
          description: "Failed to update proposal price. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      console.log("[v0] Missing proposal or userData:", { proposal: !!proposal, userData: !!userData })
    }
  }

  const handleCancelPriceEdit = () => {
    if (proposal) {
      setEditablePrice(proposal.totalAmount.toString())
    }
    setIsEditingPrice(false)
  }

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "")
    setEditablePrice(numericValue)
  }

  const handleDownload = async () => {
    if (!proposal) {
      toast({
        title: "Error",
        description: "Proposal not found",
        variant: "destructive",
      })
      return
    }

    try {
      await downloadProposal(proposal)
      toast({
        title: "Success",
        description: "Proposal downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading proposal:", error)
      toast({
        title: "Error",
        description: "Failed to download proposal",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      {showTemplatesPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {showCreateForm ? "Create New Template" : "Proposal Templates"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplatesPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {showCreateForm ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
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
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="background-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="background-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-gray-400 hover:text-gray-600"
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

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToList}
                      disabled={formLoading || uploading}
                    >
                      Back to Templates
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={formLoading || uploading}>
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
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">Choose a template or create a new one</p>
                    <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700">
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

      <div className="fixed left-2 sm:left-4 md:left-20 lg:left-80 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 sm:gap-4 z-50">
        <div className="flex flex-col items-center">
          <Button
            onClick={handleTemplates}
            variant="outline"
            size="lg"
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200"
          >
            <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-1 sm:mt-2 font-medium hidden md:block">Templates</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={handleEdit}
            variant="outline"
            size="lg"
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-1 sm:mt-2 font-medium hidden md:block">Edit</span>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={handleDownload}
            variant="outline"
            size="lg"
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-white shadow-lg hover:shadow-xl border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-1 sm:p-2 transition-all duration-200"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-gray-600" />
          </Button>
          <span className="text-xs text-gray-600 mt-1 sm:mt-2 font-medium hidden md:block">Download</span>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white shadow-lg border-transparent min-h-[600px] ml-12 sm:ml-16 md:ml-20 lg:ml-0">
        {selectedTemplateBackground ? (
          <div className="w-full h-full min-h-[544px] overflow-hidden">
            <img
              src={selectedTemplateBackground || "/placeholder.svg"}
              alt="Selected template background"
              className="w-full h-full object-cover"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "544px",
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full min-h-[544px] p-8 bg-white">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
              {/* Company Logo or GTS Logo */}
              <div className="flex-shrink-0">
                {proposal.client.companyLogoUrl ? (
                  <img
                    src={proposal.client.companyLogoUrl || "/placeholder.svg"}
                    alt={`${proposal.client.company} logo`}
                    className="w-32 h-16 object-contain"
                  />
                ) : (
                  <div className="w-32 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-yellow-600">
                    <span className="text-white font-bold text-xl tracking-wider">
                      {proposal.client.company.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Title and Price */}
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Proposal for{" "}
                  {proposal.products && proposal.products.length > 0
                    ? proposal.products[0].specs_rental?.site_code ||
                      proposal.products[0].name.split(" ")[0] ||
                      proposal.client.company.substring(0, 3).toUpperCase()
                    : proposal.client.company.substring(0, 3).toUpperCase()}{" "}
                  -{" "}
                  {new Date(proposal.createdAt.seconds * 1000).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h1>
                {isEditingPrice ? (
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex items-center bg-green-500 text-white px-2 py-1 rounded-md">
                      <span className="mr-1">₱</span>
                      <Input
                        type="text"
                        value={editablePrice}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="bg-transparent border-none text-white placeholder-green-200 font-semibold w-32 h-auto p-0 focus:ring-0 focus:border-none"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSavePrice}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 h-8"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelPriceEdit}
                      className="px-2 py-1 h-8 bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    className="inline-block bg-green-500 text-white px-4 py-1 rounded-md font-semibold cursor-pointer hover:bg-green-600 transition-colors"
                    onClick={() => setIsEditingPrice(true)}
                    title="Click to edit price"
                  >
                    ₱{proposal.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Section */}
            {proposal.products && proposal.products.length > 0 ? (
              <div className="flex gap-8 mb-6">
                {/* Left Side - Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-64 h-80 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    {proposal.products[0].media && proposal.products[0].media.length > 0 ? (
                      <img
                        src={proposal.products[0].media[0].url || "/placeholder.svg?height=320&width=256"}
                        alt={proposal.products[0].name || "Product image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Location Map and Details */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map:</h3>

                  {proposal.products[0].specs_rental?.location ? (
                    <GoogleMap location={proposal.products[0].specs_rental.location} className="w-full h-32 mb-6" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Location not specified</p>
                    </div>
                  )}

                  {/* Dynamic Location Details */}
                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <span className="font-semibold">Product:</span> {proposal.products[0].name}
                    </p>
                    {proposal.products[0].specs_rental?.location && (
                      <p>
                        <span className="font-semibold">Location:</span> {proposal.products[0].specs_rental.location}
                      </p>
                    )}
                    {proposal.products[0].specs_rental?.traffic_count && (
                      <p>
                        <span className="font-semibold">Average Daily Traffic Count:</span>{" "}
                        {proposal.products[0].specs_rental.traffic_count.toLocaleString()} vehicles
                      </p>
                    )}
                    {proposal.products[0].specs_rental?.elevation !== undefined && (
                      <p>
                        <span className="font-semibold">Location Visibility:</span>{" "}
                        {proposal.products[0].specs_rental.elevation} meters
                      </p>
                    )}
                    {proposal.products[0].specs_rental?.height && proposal.products[0].specs_rental?.width && (
                      <p>
                        <span className="font-semibold">Dimension:</span> {proposal.products[0].specs_rental.height}ft
                        (H) x {proposal.products[0].specs_rental.width}ft (W)
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Type:</span> {proposal.products[0].type || "Advertising Space"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products found in this proposal</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
