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
    return Math.ceil(numberOfSites / sitesPerPage)
  }

  const getPageContent = (pageNumber: number, layout: string) => {
    if (!proposal?.products) return []

    const sitesPerPage = getSitesPerPage(layout)
    const startIndex = (pageNumber - 1) * sitesPerPage
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

    // Size-based dimensions with orientation support
    let sizeStyles = ""
    switch (size) {
      case "A4":
        if (orientation === "Landscape") {
          sizeStyles = "w-[297mm] min-h-[210mm]" // A4 Landscape
        } else {
          sizeStyles = "w-[210mm] min-h-[297mm]" // A4 Portrait
        }
        break
      case "Letter size":
        if (orientation === "Landscape") {
          sizeStyles = "w-[11in] min-h-[8.5in]" // Letter Landscape
        } else {
          sizeStyles = "w-[8.5in] min-h-[11in]" // Letter Portrait
        }
        break
      case "Legal size":
        if (orientation === "Landscape") {
          sizeStyles = "w-[14in] min-h-[8.5in]" // Legal Landscape
        } else {
          sizeStyles = "w-[8.5in] min-h-[14in]" // Legal Portrait
        }
        break
      default:
        sizeStyles = "w-full max-w-4xl min-h-[600px]"
    }


    return `${baseStyles} ${sizeStyles}`
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
      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto print:p-0 print:justify-start print:items-start">
          {showTemplatesPanel && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Choose a Template</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplatesPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
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
                                  <p className="text-xs text-gray-500">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
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
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700"
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
                  ) : showBackgroundTemplates ? (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600">Choose a background template</p>
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
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group border-red-200 hover:border-red-300"
                            onClick={handleRemoveBackground}
                          >
                            <div className="aspect-video bg-red-50 rounded-md flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                              <X className="h-12 w-12 text-red-400" />
                            </div>
                            <h3 className="font-medium text-red-600 truncate">Remove Background</h3>
                            <p className="text-xs text-red-500 mt-1">Clear current background template</p>
                          </div>

                          {templates.length > 0 ? (
                            templates.map((template) => (
                              <div
                                key={template.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => handleTemplateSelect(template)}
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
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8">
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

                      <div className="flex gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleBackToTemplateOptions}>
                          Back to Options
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-900 mb-3 block">Size:</Label>
                        <div className="flex gap-2">
                          {["A4", "Letter size", "Legal size"].map((size) => (
                            <Button
                              key={size}
                              variant={previewSize === size ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPreviewSize(size)}
                              className={previewSize === size ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-900 mb-3 block">Orientation:</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { name: "Landscape", aspect: "aspect-video" },
                            { name: "Portrait", aspect: "aspect-[3/4]" },
                          ].map((orientation) => (
                            <div
                              key={orientation.name}
                              className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-colors ${
                                previewOrientation === orientation.name
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setPreviewOrientation(orientation.name)}
                            >
                              <div className={`${orientation.aspect} bg-gray-100 rounded mb-2 mx-auto max-w-16`}></div>
                              <span className="text-xs font-medium text-gray-700">{orientation.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-900 mb-3 block">Layout:</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              name: "1 per page",
                              value: "1",
                              layout: "grid-cols-1",
                              description: "Single site per page",
                            },
                            {
                              name: "2 per page",
                              value: "2",
                              layout: "grid-cols-2",
                              description: "Two sites side by side",
                            },
                            {
                              name: "4 per page",
                              value: "4",
                              layout: "grid-cols-2",
                              description: "Four sites in grid layout",
                            },
                          ].map((layout) => (
                            <div
                              key={layout.value}
                              className={`cursor-pointer border-2 rounded-lg p-3 text-center transition-all duration-200 ${
                                previewLayout === layout.value
                                  ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                              }`}
                              onClick={() => {
                                setPreviewLayout(layout.value)
                                toast({
                                  title: "Layout Updated for Preview",
                                  description: `Switched to ${layout.name} layout in preview`,
                                })
                              }}
                            >
                              <div className="aspect-[3/4] bg-gray-50 rounded mb-2 mx-auto max-w-16 p-1">
                                <div className={`grid ${layout.layout} gap-0.5 h-full`}>
                                  {Array.from({ length: Number.parseInt(layout.value) }).map((_, i) => (
                                    <div key={i} className="bg-gray-200 rounded-sm"></div>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-gray-700 block">{layout.name}</span>
                                <span className="text-xs text-gray-500 block">{layout.description}</span>
                              </div>
                              {selectedLayout === layout.value && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-4 w-4 text-blue-500" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Button
                          variant="outline"
                          onClick={handleShowBackgroundTemplates}
                          className="w-full mb-3 bg-transparent"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Choose Background Template (Optional)
                        </Button>
                        {previewTemplateBackground ? (
                          <div className="mt-4 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <img
                                src={previewTemplateBackground}
                                alt="Selected background preview"
                                className="h-10 w-10 object-cover rounded-md border"
                              />
                              <span className="text-sm text-gray-700 truncate">Background selected</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveBackground}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 text-center mt-2">No background template selected</div>
                        )}
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          onClick={handleApplyTemplate}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="fixed left-2 sm:left-4 md:left-20 lg:left-80 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 sm:gap-4 z-50 print:hidden">
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
                disabled={isEditingPrice}
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

          <div
            className="flex flex-col gap-8 print:gap-0 transition-transform duration-200 ease-in-out"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center top" }}
          >
            {Array.from({ length: getTotalPages(selectedLayout) }, (_, index) => {
              const pageNumber = index + 1
              const pageContent = getPageContent(pageNumber, selectedLayout)

              return (
                <div key={pageNumber} className={getPageContainerClass(selectedSize, selectedOrientation)}>
                  {selectedTemplateBackground && (
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-90 z-0"
                      style={{ backgroundImage: `url(${selectedTemplateBackground})` }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative z-10 p-4 md:p-6 bg-transparent">
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <CompanyLogo className="w-16 h-16 md:w-20 md:h-20" proposal={proposal} />
                      <div className="text-right">
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
                          {proposal?.companyName || getPageTitle(pageContent)}
                        </h1>

                        {getSitesPerPage(selectedLayout) === 1 ? (
                          isEditingPrice ? (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1">
                                <span className="text-gray-600 mr-1">₱</span>
                                <Input
                                  type="number"
                                  value={
                                    currentEditingPage === pageNumber
                                      ? editablePrice
                                      : getPagePrice(pageContent).toString()
                                  }
                                  onChange={(e) => {
                                    if (currentEditingPage !== pageNumber) {
                                      setCurrentEditingPage(pageNumber)
                                      setEditablePrice(e.target.value)
                                    } else {
                                      setEditablePrice(e.target.value)
                                    }
                                  }}
                                  onFocus={() => {
                                    setCurrentEditingPage(pageNumber)
                                    setEditablePrice(getPagePrice(pageContent).toString())
                                  }}
                                  className="border-0 p-0 h-auto text-right font-semibold text-green-600 bg-transparent focus:ring-0 focus:outline-none w-32"
                                  min="0"
                                  step="0.01"
                                  disabled={savingPrice}
                                />
                              </div>
                              {isEditingPrice && currentEditingPage && (
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setIsEditingPrice(false)
                                      setCurrentEditingPage(null)
                                      setEditablePrice("")
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="inline-block bg-green-500 text-white px-3 py-1 md:px-4 md:py-1 rounded-md font-semibold text-sm md:text-base">
                              ₱{getPagePrice(pageContent).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>

                    {/* Product content grid */}
                    <div className={`grid gap-4 transition-all duration-300 ${getLayoutGridClass(selectedLayout)}`}>
                      {pageContent.map((product, productIndex) => (
                        <div key={product.id} className="space-y-4 transition-all duration-300">
                          {/* Rest of product content */}
                          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            <div className="flex-shrink-0">
                              <div
                                className={`border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 transition-all duration-300 ${
                                  getSitesPerPage(selectedLayout) === 1
                                    ? "w-48 h-60 md:w-64 md:h-80"
                                    : getSitesPerPage(selectedLayout) === 2
                                      ? "w-40 h-48 md:w-48 md:h-60"
                                      : "w-32 h-40 md:w-36 md:h-44"
                                }`}
                              >
                                {product.media && product.media.length > 0 ? (
                                  <img
                                    src={product.media[0].url || "/placeholder.svg"}
                                    alt={product.name || "Product image"}
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon
                                      className={`text-gray-400 ${getSitesPerPage(selectedLayout) === 1 ? "h-12 w-12" : "h-8 w-8"}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold text-gray-900 mb-3 ${getSitesPerPage(selectedLayout) === 1 ? "text-lg" : "text-sm md:text-base"}`}
                              >
                                Location Map:
                              </h3>

                              {product.specs_rental?.location ? (
                                <GoogleMap
                                  location={product.specs_rental.location}
                                  className={`w-full rounded-lg mb-4 ${getSitesPerPage(selectedLayout) === 1 ? "h-24 md:h-32" : "h-16 md:h-20"}`}
                                />
                              ) : (
                                <div
                                  className={`w-full bg-gray-100 rounded-lg mb-4 flex items-center justify-center ${getSitesPerPage(selectedLayout) === 1 ? "h-24 md:h-32" : "h-16 md:h-20"}`}
                                >
                                  <p className="text-gray-500 text-xs">Location not specified</p>
                                </div>
                              )}

                              <div
                                className={`space-y-1 text-gray-800 ${getSitesPerPage(selectedLayout) === 1 ? "text-sm" : "text-xs"}`}
                              >
                                {product.specs_rental?.location && (
                                  <p>
                                    <span className="font-semibold">Location:</span> {product.specs_rental.location}
                                  </p>
                                )}
                                {product.specs_rental?.traffic_count && (
                                  <p>
                                    <span className="font-semibold">Traffic Count:</span>{" "}
                                    {product.specs_rental.traffic_count.toLocaleString()} vehicles
                                  </p>
                                )}
                                {product.specs_rental?.elevation !== undefined && (
                                  <p>
                                    <span className="font-semibold">Visibility:</span> {product.specs_rental.elevation}{" "}
                                    meters
                                  </p>
                                )}
                                {product.specs_rental?.height && product.specs_rental?.width && (
                                  <p>
                                    <span className="font-semibold">Dimension:</span> {product.specs_rental.height}ft x{" "}
                                    {product.specs_rental.width}ft
                                  </p>
                                )}
                                <p>
                                  <span className="font-semibold">Type:</span> {product.type || "Advertising Space"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {getSitesPerPage(selectedLayout) > 1 && (
                            <div className="mt-3 flex justify-center">
                              {isEditingPrice ? (
                                <div className="p-2 bg-white border border-gray-300 rounded-md w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600 text-xs font-medium">Price:</span>
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1">
                                      <span className="text-gray-500 text-xs mr-1">₱</span>
                                      <Input
                                        type="number"
                                        value={individualPrices[product.id] || ""}
                                        onChange={(e) => {
                                          setIndividualPrices(prev => ({
                                            ...prev,
                                            [product.id]: e.target.value
                                          }))
                                        }}
                                        className="border-0 p-0 h-auto text-right font-semibold text-green-600 bg-transparent focus:ring-0 focus:outline-none text-sm"
                                        min="0"
                                        step="0.01"
                                        disabled={savingPrice}
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-green-500 text-white h-8 px-2 pb-2.5 rounded-md font-semibold text-xs flex items-center justify-center">
                                  ₱{product.price?.toLocaleString("en-PH", { minimumFractionDigits: 2 }) || "0.00"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto print:hidden">
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
