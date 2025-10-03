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
  Check,
  Minus,
  Send,
} from "lucide-react"
import { getProposalById, updateProposal, downloadProposalPDF, generateProposalPDFBlob, generateAndUploadProposalPDF } from "@/lib/proposal-service"
import {
  getProposalTemplatesByCompanyId,
  createProposalTemplate,
  uploadFileToFirebaseStorage,
} from "@/lib/firebase-service"
import type { Proposal } from "@/lib/types/proposal"
import type { ProposalTemplate } from "@/lib/firebase-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { loadGoogleMaps } from "@/lib/google-maps-loader"
import { SendProposalShareDialog } from "@/components/send-proposal-share-dialog"
import { ProposalHistory } from "@/components/proposal-history"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const GoogleMap: React.FC<{ location: string; className?: string }> = ({ location, className }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    const initializeMaps = async () => {
      try {
        await loadGoogleMaps()
        await initializeMap()
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
        geocoder.geocode({ address: location }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
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

    initializeMaps()
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
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

const CompanyLogo: React.FC<{ className?: string; proposal?: Proposal | null }> = ({ className, proposal }) => {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [companyLogo, setCompanyLogo] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    // If proposal data is available, use it directly
    if (proposal?.companyLogo || proposal?.companyName) {
      setCompanyLogo(proposal.companyLogo || "")
      setCompanyName(proposal.companyName || "")
      setLoading(false)
      return
    }

    // Fallback to fetching from company data if no proposal data
    const fetchCompanyData = async () => {
      if (!userData?.company_id) {
        setLoading(false)
        return
      }

      try {
        const companyDocRef = doc(db, "companies", userData.company_id)
        const companyDocSnap = await getDoc(companyDocRef)

        if (companyDocSnap.exists()) {
          const companyData = companyDocSnap.data()
          if (companyData.photo_url && companyData.photo_url.trim() !== "") {
            setCompanyLogo(companyData.photo_url)
          }
          if (companyData.name && companyData.name.trim() !== "") {
            setCompanyName(companyData.name)
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [userData?.company_id, proposal?.companyLogo, proposal?.companyName])

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
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    if (!userData?.company_id) return

    setUploading(true)
    try {
      const uploadPath = `companies/logos/${Date.now()}_${file.name}`
      const logoUrl = await uploadFileToFirebaseStorage(file, uploadPath)

      const companyDocRef = doc(db, "companies", userData.company_id)
      await updateDoc(companyDocRef, {
        photo_url: logoUrl,
      })

      setCompanyLogo(logoUrl)
      setSelectedFile(null)

      toast({
        title: "Success",
        description: "Company logo uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading company logo:", error)
      toast({
        title: "Error",
        description: "Failed to upload company logo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    )
  }

  if (companyLogo) {
    return (
      <img
        src={companyLogo || "/placeholder.svg"}
        alt="Company logo"
        className={`object-cover rounded-lg border border-gray-200 shadow-sm bg-white ${className}`}
        onError={(e) => {
          // If image fails to load, clear it so upload button shows
          setCompanyLogo("")
        }}
      />
    )
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors ${className}`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="company-logo-upload"
        disabled={uploading}
      />
      <label htmlFor="company-logo-upload" className="cursor-pointer">
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Upload Company Logo</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
          </div>
        )}
      </label>
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
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  const [editablePrice, setEditablePrice] = useState<string>("")
  const [individualPrices, setIndividualPrices] = useState<{[key: string]: string}>({})
  const [savingPrice, setSavingPrice] = useState(false)
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
  const [selectedSize, setSelectedSize] = useState<string>("A4")
  const [selectedOrientation, setSelectedOrientation] = useState<string>("Portrait")
  const [selectedLayout, setSelectedLayout] = useState<string>("1")
  const [previewSize, setPreviewSize] = useState<string>("A4")
  const [previewOrientation, setPreviewOrientation] = useState<string>("Portrait")
  const [previewLayout, setPreviewLayout] = useState<string>("1")
  const [previewTemplateBackground, setPreviewTemplateBackground] = useState<string>("")
  const [showBackgroundTemplates, setShowBackgroundTemplates] = useState(false)
  const [currentEditingPage, setCurrentEditingPage] = useState<number | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [isSendOptionsDialogOpen, setIsSendOptionsDialogOpen] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)

  useEffect(() => {
    async function fetchProposal() {
      if (!params.id) return

      setLoading(true)
      try {
        const proposalData = await getProposalById(params.id as string)
        if (proposalData) {
          setProposal(proposalData)
          const currentPageContent = getPageContent(1, proposalData.templateLayout || "1")
          const currentPagePrice = getPagePrice(currentPageContent)
          setEditablePrice(currentPagePrice.toString())

          if (proposalData.templateSize) {
            setSelectedSize(proposalData.templateSize)
            setPreviewSize(proposalData.templateSize)
          }
          if (proposalData.templateOrientation) {
            setSelectedOrientation(proposalData.templateOrientation)
            setPreviewOrientation(proposalData.templateOrientation)
          }
          if (proposalData.templateLayout) {
            setSelectedLayout(proposalData.templateLayout)
            setPreviewLayout(proposalData.templateLayout)
          }
          if (proposalData.templateBackground) {
            setSelectedTemplateBackground(proposalData.templateBackground)
            setPreviewTemplateBackground(proposalData.templateBackground)
          }

          // Check if PDF needs to be generated
          if (!proposalData.pdf || proposalData.pdf.trim() === "") {
            // Generate PDF and upload to Firebase storage
            setTimeout(async () => {
              try {
                const { pdfUrl, password } = await generateAndUploadProposalPDF(
                  proposalData,
                  proposalData.templateSize || "A4",
                  proposalData.templateOrientation || "Portrait"
                )

                // Update proposal with PDF URL and password
                console.log("Updating proposal with PDF URL:", pdfUrl, "and password:", password)
                await updateProposal(
                  proposalData.id,
                  { pdf: pdfUrl, password: password },
                  userData?.uid || "system",
                  userData?.displayName || "System"
                )

                // Update local state
                setProposal(prev => prev ? { ...prev, pdf: pdfUrl, password: password } : null)

                console.log("PDF generated and uploaded successfully:", pdfUrl)
                console.log("Proposal document updated with PDF URL and password")
              } catch (error) {
                console.error("Error generating PDF:", error)
                toast({
                  title: "Error",
                  description: "Failed to generate PDF",
                  variant: "destructive",
                })
              }
            }, 2000) // Small delay to ensure the page is fully rendered
          }
        }
      } catch (error) {
        console.error("Error fetching proposal:", error)
        toast({
          title: "Error",
          description: "Failed to load proposal",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [params.id])

  // Handle automatic download/print/share when page loads with action parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const action = searchParams.get("action")

    if (action === "download" && proposal && !loading) {
      // Small delay to ensure the proposal is fully rendered
      setTimeout(() => {
        handleDownload()
        // Clean up the URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete("action")
        window.history.replaceState({}, "", url.toString())
      }, 1000)
    } else if (action === "print" && proposal && !loading) {
      setPrintLoading(true)

      // Scroll to load all maps and generate PDF
      setTimeout(async () => {
        // Scroll to load all maps before generating PDF
        const loadAllMaps = async () => {
          const pageContainers = document.querySelectorAll('[class*="mx-auto bg-white shadow-lg"]')
          for (let i = 0; i < pageContainers.length; i++) {
            const container = pageContainers[i] as HTMLElement
            container.scrollIntoView({ behavior: 'smooth', block: 'center' })
            await new Promise(resolve => setTimeout(resolve, 1500)) // Wait for maps to load
          }
          // Scroll back to top
          window.scrollTo({ top: 0, behavior: 'smooth' })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        await loadAllMaps()

        try {
          // Generate PDF blob same as download
          const { blob, filename } = await generateProposalPDFBlob(proposal, selectedSize, selectedOrientation)
          // Create URL for the blob
          const pdfUrl = URL.createObjectURL(blob)
          // Open in new window for printing
          const printWindow = window.open(pdfUrl, '_blank')
          if (printWindow) {
            // Wait for PDF to load then print and navigate back
            printWindow.onload = () => {
              printWindow.print()
              // Navigate back immediately after triggering print
              router.push('/sales/proposals')
            }
          }
        } catch (error) {
          console.error("Error generating PDF for print:", error)
          toast({
            title: "Error",
            description: "Failed to generate PDF for printing",
            variant: "destructive",
          })
        } finally {
          setPrintLoading(false)
        }
        // Clean up the URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete("action")
        window.history.replaceState({}, "", url.toString())
      }, 1000) // Initial delay before starting
    } else if (action === "share" && proposal && !loading) {
      // Small delay to ensure the proposal is fully rendered
      setTimeout(() => {
        setIsSendOptionsDialogOpen(true)
        // Clean up the URL parameter
        const url = new URL(window.location.href)
        url.searchParams.delete("action")
        window.history.replaceState({}, "", url.toString())
      }, 1000)
    }
  }, [proposal, loading])

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
    setShowBackgroundTemplates(false)
    // Initialize preview states with current selected states when opening dialog
    setPreviewSize(selectedSize)
    setPreviewOrientation(selectedOrientation)
    setPreviewLayout(selectedLayout)
    setPreviewTemplateBackground(selectedTemplateBackground)
  }

  const handleShowBackgroundTemplates = () => {
    setShowBackgroundTemplates(true)
    fetchTemplates()
  }

  const handleBackToTemplateOptions = () => {
    setShowBackgroundTemplates(false)
    setShowCreateForm(false)
  }

  const handleApplyTemplate = async () => {
    if (!proposal || !userData) return

    setIsApplying(true)
    try {
      const updateData: any = {
        templateSize: previewSize,
        templateOrientation: previewOrientation,
        templateLayout: previewLayout,
      }

      if (previewTemplateBackground !== "") {
        updateData.templateBackground = previewTemplateBackground
      } else {
        updateData.templateBackground = ""
      }

      console.log("[v0] Applying template with data:", updateData)

      await updateProposal(proposal.id, updateData, userData.uid, userData.displayName || "User")

      setProposal((prev) =>
        prev
          ? {
              ...prev,
              templateSize: previewSize,
              templateOrientation: previewOrientation,
              templateLayout: previewLayout,
              templateBackground: previewTemplateBackground,
            }
          : null,
      )

      setSelectedSize(previewSize)
      setSelectedOrientation(previewOrientation)
      setSelectedLayout(previewLayout)
      setSelectedTemplateBackground(previewTemplateBackground)

      // Update URL with new template settings
      const url = new URL(window.location.href)
      url.searchParams.set('size', previewSize)
      url.searchParams.set('orientation', previewOrientation)
      url.searchParams.set('layout', previewLayout)
      if (previewTemplateBackground) {
        url.searchParams.set('background', previewTemplateBackground)
      } else {
        url.searchParams.delete('background')
      }
      window.history.replaceState({}, '', url.toString())

      setShowTemplatesPanel(false)

      toast({
        title: "Template Applied",
        description: "Template settings have been applied and saved",
      })
    } catch (error) {
      console.error("Error applying template:", error)
      toast({
        title: "Error",
        description: "Failed to apply template settings",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
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

  const getPagePrice = (pageContent: any[]) => {
    return pageContent.reduce((total, product) => {
      return total + (product.price || 0)
    }, 0)
  }

  const handleEditPrice = (pageNum: number) => {
    setIsEditingPrice(true)
    const currentPageContent = getPageContent(pageNum, selectedLayout)
    const currentPagePrice = getPagePrice(currentPageContent)
    setEditablePrice(currentPagePrice.toString())
    setCurrentEditingPage(pageNum)

    // Initialize individual prices for multi-product pages
    if (getSitesPerPage(selectedLayout) > 1) {
      const prices: {[key: string]: string} = {}
      currentPageContent.forEach((product) => {
        prices[product.id] = (product.price || 0).toString()
      })
      setIndividualPrices(prices)
    }
  }

  const handleSavePrice = async () => {
    if (!proposal || !userData) {
      toast({
        title: "Error",
        description: "Unable to save price changes",
        variant: "destructive",
      })
      return
    }

    setSavingPrice(true)
    try {
      const currentPageContent = getPageContent(currentEditingPage || 1, selectedLayout)
      if (currentPageContent.length > 0) {
        let updatedProducts = proposal.products

        if (getSitesPerPage(selectedLayout) === 1) {
          // Single product per page - use total price
          const newPrice = Number.parseFloat(editablePrice)
          if (isNaN(newPrice) || newPrice < 0) {
            toast({
              title: "Error",
              description: "Please enter a valid price",
              variant: "destructive",
            })
            return
          }

          updatedProducts = proposal.products.map((product: any) => {
            const productOnCurrentPage = currentPageContent.find((p) => p.id === product.id)
            if (productOnCurrentPage) {
              return { ...product, price: newPrice }
            }
            return product
          })
        } else {
          // Multiple products per page - use individual prices
          const invalidPrices = Object.values(individualPrices).some(price => {
            const numPrice = Number.parseFloat(price)
            return isNaN(numPrice) || numPrice < 0
          })

          if (invalidPrices) {
            toast({
              title: "Error",
              description: "Please enter valid prices for all products",
              variant: "destructive",
            })
            return
          }

          updatedProducts = proposal.products.map((product: any) => {
            const productOnCurrentPage = currentPageContent.find((p) => p.id === product.id)
            if (productOnCurrentPage && individualPrices[product.id] !== undefined) {
              return { ...product, price: Number.parseFloat(individualPrices[product.id]) }
            }
            return product
          })
        }

        await updateProposal(
          proposal.id,
          { products: updatedProducts },
          userData.uid || "current_user",
          userData.displayName || "Current User",
        )

        setProposal((prev) => (prev ? { ...prev, products: updatedProducts } : null))
      }

      setIsEditingPrice(false)
      setCurrentEditingPage(null)
      setIndividualPrices({})

      toast({
        title: "Success",
        description: "Price updated successfully",
      })
    } catch (error) {
      console.error("Error updating price:", error)
      toast({
        title: "Error",
        description: "Failed to update price",
        variant: "destructive",
      })
    } finally {
      setSavingPrice(false)
    }
  }

  const handleCancelPriceEdit = () => {
    setIsEditingPrice(false)
    setCurrentEditingPage(null)
    setIndividualPrices({})
    const currentPageContent = getPageContent(currentEditingPage || 1, selectedLayout)
    const currentPagePrice = getPagePrice(currentPageContent)
    setEditablePrice(currentPagePrice.toString())
  }

  const handleEdit = () => {
    setIsEditingPrice(true)
    // Don't set currentEditingPage here - let individual pages handle their own editing
  }

  const handleDownload = async () => {
    if (!proposal) {
      toast({
        title: "Error",
        description: "No proposal data available",
        variant: "destructive",
      })
      return
    }

    await downloadProposalPDF(proposal, selectedSize, selectedOrientation, toast)
  }

  const handleTemplateSelect = (template: any) => {
    const newBackground = template.background_url || ""
    setPreviewTemplateBackground(newBackground)
    setShowBackgroundTemplates(false) // Navigate back to options
    toast({
      title: "Background Selected for Preview",
      description: `Selected template: ${template.name}`,
    })
  }

  const handleRemoveBackground = () => {
    setPreviewTemplateBackground("")
    setShowBackgroundTemplates(false) // Navigate back to options
    toast({
      title: "Background Removed for Preview",
      description: "Background template has been removed from preview",
    })
  }

  // Helper functions to calculate container styles based on template settings
  const getContainerDimensions = (size: string, orientation: string) => {
    const baseStyles = "bg-white shadow-lg border-transparent relative"

    // Size-based dimensions
    let sizeStyles = ""
    switch (size) {
      case "A4":
        sizeStyles = "w-[210mm] min-h-[297mm]" // A4 dimensions
        break
      case "Letter size":
        sizeStyles = "w-[8.5in] min-h-[11in]" // US Letter dimensions
        break
      case "Legal size":
        sizeStyles = "w-[8.5in] min-h-[14in]" // US Legal dimensions
        break
      default:
        sizeStyles = "w-full max-w-4xl min-h-[600px]"
    }

    let orientationStyles = ""
    switch (orientation) {
      case "Landscape":
        orientationStyles = "max-w-[800px] min-h-[500px]"
        break
      case "Portrait":
        orientationStyles = "max-w-[600px] min-h-[800px]"
        break
      default:
        orientationStyles = ""
    }

    return `${baseStyles} ${sizeStyles} ${orientationStyles}`
  }

  const getSitesPerPage = (layout: string) => Number.parseInt(layout)

  const getTotalPages = (layout: string) => {
    const numberOfSites = proposal?.products?.length || 1
    const sitesPerPage = getSitesPerPage(layout)
    // Always include 1 page for intro + pages for sites
    return 1 + Math.ceil(numberOfSites / sitesPerPage)
  }

  const getPageContent = (pageNumber: number, layout: string) => {
    if (!proposal?.products) return []

    // Page 1 is always intro, so site pages start from page 2
    const sitePageNumber = pageNumber - 1
    if (sitePageNumber < 1) return []

    const sitesPerPage = getSitesPerPage(layout)
    const startIndex = (sitePageNumber - 1) * sitesPerPage
    const endIndex = startIndex + sitesPerPage

    return proposal.products.slice(startIndex, endIndex)
  }

  const getLayoutGridClass = (layout: string) => {
    const sitesPerPage = getSitesPerPage(layout)
    switch (sitesPerPage) {
      case 1:
        return "grid-cols-1"
      case 2:
        return "grid-cols-1 lg:grid-cols-2"
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
      default:
        return "grid-cols-1"
    }
  }

  const getPageTitle = (pageContent: any[]): string => {
    if (!pageContent || pageContent.length === 0) {
      return "N/A"
    }

    const siteCodes = pageContent.map((product) => product.site_code).filter(Boolean)

    if (siteCodes.length === 0) {
      return "N/A"
    }

    if (siteCodes.length === 1) {
      return siteCodes[0]
    }

    if (siteCodes.length === 2) {
      return `${siteCodes[0]} & ${siteCodes[1]}`
    }

    return `${siteCodes[0]} & ${siteCodes.length - 1} more sites`
  }

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2)) // Max zoom 200%
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.3)) // Min zoom 30%
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
  }

  // Added handler functions for Save as Draft and Send
  const handleUpdatePublicStatus = async (status: string) => {
    if (!proposal || !userData) return

    try {
      await updateProposal(
        proposal.id,
        { status: status as Proposal["status"] },
        userData.uid,
        userData.displayName || "User",
      )

      setProposal((prev) => (prev ? { ...prev, status: status as Proposal["status"] } : null))

      toast({
        title: "Success",
        description: `Proposal ${status === "draft" ? "saved as draft" : "status updated"}`,
      })
    } catch (error) {
      console.error("Error updating proposal status:", error)
      toast({
        title: "Error",
        description: "Failed to update proposal status",
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
          <div className="w-16 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
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

  const getPageContainerClass = (size: string, orientation: string) => {
    const baseStyles = "mx-auto bg-white shadow-lg print:shadow-none print:mx-0 print:my-0 relative overflow-hidden"

    // Size-based dimensions with orientation support and responsiveness
    let sizeStyles = ""
    switch (size) {
      case "A4":
        if (orientation === "Landscape") {
          sizeStyles = "w-full md:w-[297mm] min-h-[400px] md:min-h-[210mm]" // A4 Landscape
        } else {
          sizeStyles = "w-full md:w-[210mm] min-h-[600px] md:min-h-[297mm]" // A4 Portrait
        }
        break
      case "Letter size":
        if (orientation === "Landscape") {
          sizeStyles = "w-full md:w-[11in] min-h-[400px] md:min-h-[8.5in]" // Letter Landscape
        } else {
          sizeStyles = "w-full md:w-[8.5in] min-h-[600px] md:min-h-[11in]" // Letter Portrait
        }
        break
      case "Legal size":
        if (orientation === "Landscape") {
          sizeStyles = "w-full md:w-[14in] min-h-[400px] md:min-h-[8.5in]" // Legal Landscape
        } else {
          sizeStyles = "w-full md:w-[8.5in] min-h-[600px] md:min-h-[14in]" // Legal Portrait
        }
        break
      default:
        sizeStyles = "w-full max-w-4xl min-h-[600px]"
    }


    return `${baseStyles} ${sizeStyles}`
  }

  const renderIntroPage = (pageNumber: number) => {
    const totalPages = getTotalPages(selectedLayout)
    const formattedDate = proposal?.createdAt ? new Date(proposal.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A'

    return (
      <div className="relative w-full h-full bg-white">
        {/* Header */}
        <div className="absolute top-0 left-0 w-[800px] h-[80px] bg-[#f8c102] rounded-tr-[50px] rounded-br-[50px] z-10" />
        {/* Header Right */}
        <div className="absolute top-0 left-0 w-[1500px] h-[80px] bg-[rgba(248,193,2,0.5)] rounded-tl-[50px] rounded-tr-[50px] rounded-br-[50px] z-10" />
        {/* Background borders and accents */}
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-0 w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="bg-white h-[1001px] w-[774px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-[540px] top-[2px] w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="h-[461px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-[695px] w-[0px]">
          <div className="flex-none rotate-[90deg]">
            <div className="h-[461px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-[2px] w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="h-[763px] rounded-bl-[50px] rounded-br-[50px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-[238px] top-[695px] w-[0px]">
          <div className="flex-none rotate-[90deg]">
            <div className="h-[763px] rounded-bl-[50px] rounded-br-[50px] w-[79px]" />
          </div>
        </div>

        {/* Company Logo */}
        <div className="absolute h-[110px] left-[114px] top-[175px] w-[183px]">
          <CompanyLogo className="h-full w-full" proposal={proposal} />
        </div>

        {/* Title */}
        <p className="absolute font-bold text-[#333333] text-[80px] leading-none left-[114px] top-[331px] w-[602px]">
          Site Proposals
        </p>

        {/* Subtitle */}
        <p className="absolute font-normal text-[#333333] text-[20px] leading-none left-[114px] top-[285px] w-[333px]">
          {proposal?.companyName || 'Company Name'}
        </p>

        {/* Date */}
        <p className="absolute font-normal text-[#333333] text-[20px] text-right top-[104px] right-[32px] w-[219px]">
          {formattedDate}
        </p>

        {/* Page Number */}
        <p className="absolute font-normal text-[#333333] text-[20px] text-right top-[650px] right-[32px] w-[59px]">
          {pageNumber}/{totalPages}
        </p>

        {/* Prepared For */}
        <div className="absolute text-[#333333] text-[20px] left-[114px] top-[451px] w-[737px] leading-[1.2]">
          <p className="font-bold mb-0">Prepared for:</p>
          <p>{proposal?.client.contactPerson} - {proposal?.client.company}</p>
        </div>

        {/* Prepared By */}
        <div className="absolute font-bold text-[#333333] text-[20px] left-[114px] top-[508px] w-[785px] leading-[1.2]">
          <p className="mb-0">Prepared By:</p>
          <p className="font-normal">{userData?.first_name} {userData?.last_name} - {proposal?.companyName}</p>
        </div>

        {/* Bottom Logo */}
        <div className="absolute h-[46px] left-[32px] top-[730px] w-[77px] z-20">
          <CompanyLogo className="h-full w-full" proposal={proposal} />
        </div>
        {/* Footer */}
        <div className="absolute top-[714px] right-0 w-[800px] h-[80px] bg-[#f8c102] rounded-tl-[50px] rounded-bl-[50px] z-10" />
        {/* Footer Right */}
        <div className="absolute top-[714px] right-0 w-[1500px] h-[80px] bg-[rgba(248,193,2,0.5)] rounded-tl-[50px] rounded-tl-[50px] rounded-br-[50px] z-10" />
      </div>
    )
  }

  const renderSitePage = (pageNumber: number) => {
    const totalPages = getTotalPages(selectedLayout)
    const pageContent = getPageContent(pageNumber, selectedLayout)

    // For now, we'll take the first product on this page (assuming 1 site per page for this layout)
    const product = pageContent[0]

    if (!product) {
      return (
        <div className="relative w-full h-full bg-white">
          <p className="text-center text-gray-500 mt-20">No site data available</p>
        </div>
      )
    }

    return (
      <div className="relative w-full h-full bg-white">
        {/* Header - same as intro page */}
        <div className="absolute top-0 left-0 w-[800px] h-[80px] bg-[#f8c102] rounded-tr-[50px] rounded-br-[50px] z-10" />
        <div className="absolute top-0 left-0 w-[1500px] h-[80px] bg-[rgba(248,193,2,0.5)] rounded-tl-[50px] rounded-tr-[50px] rounded-br-[50px] z-10" />

        {/* Background borders and accents - same as intro page */}
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-0 w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="bg-white h-[1001px] w-[774px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-[540px] top-[2px] w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="h-[461px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-[695px] w-[0px]">
          <div className="flex-none rotate-[90deg]">
            <div className="h-[461px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-0 top-[2px] w-[0px]">
          <div className="flex-none rotate-[270deg]">
            <div className="h-[763px] rounded-bl-[50px] rounded-br-[50px] w-[79px]" />
          </div>
        </div>
        <div className="absolute flex h-[0px] items-center justify-center left-[238px] top-[695px] w-[0px]">
          <div className="flex-none rotate-[90deg]">
            <div className="h-[763px] rounded-bl-[50px] rounded-br-[50px] w-[79px]" />
          </div>
        </div>

        {/* Date - same as intro page */}
        <p className="absolute font-normal text-[#333333] text-[20px] text-right top-[104px] right-[32px] w-[219px]">
          {proposal?.createdAt ? new Date(proposal.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'N/A'}
        </p>

        {/* Page Number */}
        <p className="absolute font-normal text-[#333333] text-[20px] text-right top-[650px] right-[32px] w-[59px]">
          {pageNumber}/{totalPages}
        </p>

        {/* Main Image - Top Left */}
        <div className="absolute left-0 top-[81px] w-[372px] h-[372px] overflow-hidden">
          {product.media && product.media.length > 0 ? (
            product.media[0].isVideo ? (
              <video
                src={product.media[0].url}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <img
                src={product.media[0].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>

        {/* Google Map - Bottom Left */}
        <div className="absolute left-0 top-[453px] w-[372px] h-[260px] overflow-hidden">
          {product.location ? (
            <GoogleMap location={product.location} className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No location available</span>
            </div>
          )}
        </div>

        {/* Site Details - Right Side */}
        <div className="absolute font-bold text-[#333333] text-[20px] left-[409px] top-[200px] w-[495.663px] leading-[1.2]">
          {/* Site Name */}
          <div className="mb-2 text-[40px]">
            <p className="mb-0">{product.name}</p>
          </div>

          <div className="ml-2">
            {/* Location */}
            <div className="mb-2">
              <p className="mb-0">Location:</p>
              <p className="font-normal text-[20px]">{product.location || 'N/A'}</p>
            </div>

            {/* Dimension */}
            <div className="mb-2">
              <p className="mb-0">Dimension:</p>
              <p className="font-normal text-[20px] mb-0">
                {product.specs_rental?.height ? `${product.specs_rental.height}ft (H)` : ''}
                {product.specs_rental?.height && product.specs_rental?.width ? ' x ' : ''}
                {product.specs_rental?.width ? `${product.specs_rental.width}ft (W)` : ''}
                {!product.specs_rental?.height && !product.specs_rental?.width ? 'N/A' : ''}
              </p>
            </div>

            {/* Type */}
            <div className="mb-2">
              <p className="mb-0">Type:</p>
              <p className="font-normal text-[20px]">{product.categories && product.categories.length > 0 ? product.categories[0] : 'N/A'}</p>
            </div>

            {/* Average Daily Traffic Count */}
            <div className="mb-2">
              <p className="mb-0">Average Daily Traffic Count:</p>
              <p className="font-normal text-[20px]">
                {product.specs_rental?.traffic_count ? product.specs_rental.traffic_count.toLocaleString() : 'N/A'}
              </p>
            </div>

            {/* SRP */}
            <div className="mb-2">
              <p className="mb-0">SRP:</p>
              <p className="font-normal text-[20px]">
                {product.price ? `₱${product.price.toLocaleString()}.00 per month` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="absolute h-[46px] left-[32px] top-[730px] w-[77px] z-20">
          <CompanyLogo className="h-full w-full" proposal={proposal} />
        </div>

        {/* Footer - same as intro page */}
        <div className="absolute top-[714px] right-0 w-[800px] h-[80px] bg-[#f8c102] rounded-tl-[50px] rounded-bl-[50px] z-10" />
        <div className="absolute top-[714px] right-0 w-[1500px] h-[80px] bg-[rgba(248,193,2,0.5)] rounded-tl-[50px] rounded-tl-[50px] rounded-br-[50px] z-10" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 print:bg-white flex flex-col">
      <div className="bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-50 border-b border-gray-200 shadow-sm print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/sales/proposals")}
          className="text-black hover:bg-gray-100 p-1 h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-black font-medium">Finalize Proposal</span>
        <span className="text-black italic ml-2">{proposal?.proposalNumber || params.id}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              disabled={zoomLevel <= 0.3}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              className="h-7 px-2 text-xs font-medium hover:bg-gray-200 min-w-[50px]"
            >
              {Math.round(zoomLevel * 100)}%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0 hover:bg-gray-200"
              disabled={zoomLevel >= 2}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Proposal Page Content */}
        <div className="flex-1 p-2 md:p-4 space-y-4">
          {Array.from({ length: getTotalPages(selectedLayout) }, (_, index) => {
            const pageNumber = index + 1
            return (
              <div key={pageNumber} className={getPageContainerClass(selectedSize, "Landscape")} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
                {pageNumber === 1 ? renderIntroPage(pageNumber) : renderSitePage(pageNumber)}
              </div>
            )
          })}
        </div>

        <div className="w-full md:w-80 border-l md:border-l border-gray-200 p-4 overflow-y-auto print:hidden">
          <ProposalHistory
            selectedClient={
              proposal
                ? {
                    id: proposal.client.id || "",
                    company: proposal.client.company,
                    contactPerson: proposal.client.contactPerson,
                  }
                : null
            }
            useProposalViewer={true}
            excludeProposalId={params.id as string}
          />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      {!loading && proposal && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-50 print:hidden">
          {isEditingPrice ? (
            <>
              <Button
                onClick={() => setIsEditingPrice(false)}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                disabled={savingPrice}
              >
                {savingPrice ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleUpdatePublicStatus("draft")}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
              >
                <FileText className="h-5 w-5 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => setIsSendOptionsDialogOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
              >
                <Send className="h-5 w-5 mr-2" />
                Send
              </Button>
            </>
          )}
        </div>
      )}

      {/* Send Options Dialog */}
      <SendProposalShareDialog
        isOpen={isSendOptionsDialogOpen}
        onClose={() => setIsSendOptionsDialogOpen(false)}
        proposal={proposal}
        templateSettings={{
          size: selectedSize,
          orientation: selectedOrientation,
          layout: selectedLayout,
          background: selectedTemplateBackground
        }}
      />

      {/* Print Loading Dialog */}
      <Dialog open={printLoading} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm mx-auto text-center border-0 shadow-lg">
          <DialogTitle className="sr-only">Generating PDF for Print</DialogTitle>
          <div className="py-6">
            <div className="mb-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparing for Print</h2>
              <p className="text-gray-600">Generating PDF and waiting for all content to load...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
