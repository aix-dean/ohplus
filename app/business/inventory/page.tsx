"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { gsap } from "gsap"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, MapPin, ChevronLeft, ChevronRight, Search, List, Grid3X3, Upload, Edit, Trash2, X } from "lucide-react"
import { getPaginatedUserProducts, getUserProductsCount, softDeleteProduct, createProduct, uploadFileToFirebaseStorage, getUserProductsRealtime, type Product } from "@/lib/firebase-service"
import { searchProducts, type SearchResult } from "@/lib/algolia-service"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"
import { useResponsive } from "@/hooks/use-responsive"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { CompanyRegistrationDialog } from "@/components/company-registration-dialog"
import { CompanyUpdateDialog } from "@/components/company-update-dialog"
import { CompanyService } from "@/lib/company-service"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { subscriptionService } from "@/lib/subscription-service"
import { RouteProtection } from "@/components/route-protection"
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete"

// Number of items to display per page
const ITEMS_PER_PAGE = 12

// Category options based on site type
const STATIC_CATEGORIES = [
  "Billboard",
  "Wallboard",
  "Transit Ads",
  "Column",
  "Bridgeway billboard",
  "Banner",
  "Lampost",
  "Lightbox",
  "Building Wrap",
  "Gantry",
  "Toll Plaza"
]

const DIGITAL_CATEGORIES = [
  "Digital Billboard",
  "LED Poster",
  "Digital Transit Ads"
]

export default function BusinessInventoryPage() {
   const router = useRouter()
   const { user, userData, subscriptionData, refreshUserData } = useAuth()
   const [allProducts, setAllProducts] = useState<Product[]>([])
   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
   const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])
   const [searchResults, setSearchResults] = useState<SearchResult[]>([])
   const [isSearching, setIsSearching] = useState(false)
   const [loading, setLoading] = useState(true)
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
   const [productToDelete, setProductToDelete] = useState<Product | null>(null)
   const { isMobile, isTablet } = useResponsive()

   // Company registration dialog state
   const [showCompanyDialog, setShowCompanyDialog] = useState(false)

   // Company update dialog state
   const [showCompanyUpdateDialog, setShowCompanyUpdateDialog] = useState(false)

   // Pagination state
   const [currentPage, setCurrentPage] = useState(1)
   const [totalItems, setTotalItems] = useState(0)
   const [totalPages, setTotalPages] = useState(1)
   const [loadingCount, setLoadingCount] = useState(false)

   // Search and view mode state
   const [searchQuery, setSearchQuery] = useState("")
   const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

   // Animation refs
   const cardsRef = useRef<HTMLDivElement>(null)
   const cardElementsRef = useRef<(HTMLDivElement | null)[]>([])
   const tlRef = useRef<gsap.core.Timeline | null>(null)

  // Subscription limit dialog state
  const [showSubscriptionLimitDialog, setShowSubscriptionLimitDialog] = useState(false)
  const [subscriptionLimitMessage, setSubscriptionLimitMessage] = useState("")

  // Add site dialog state
  const [showAddSiteDialog, setShowAddSiteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Form state
  const [siteType, setSiteType] = useState<"static" | "digital">("static")
  const [category, setCategory] = useState(STATIC_CATEGORIES[0])
  const [siteName, setSiteName] = useState("")
  const [location, setLocation] = useState("")
  const [locationLabel, setLocationLabel] = useState("")
  const [geopoint, setGeopoint] = useState<[number, number] | null>(null)
  const [height, setHeight] = useState("")
  const [width, setWidth] = useState("")
  const [dimensionUnit, setDimensionUnit] = useState<"ft" | "m">("ft")
  const [elevation, setElevation] = useState("")
  const [elevationUnit, setElevationUnit] = useState<"ft" | "m">("ft")
  const [description, setDescription] = useState("")
  const [selectedAudience, setSelectedAudience] = useState<string[]>([])
  const [dailyTraffic, setDailyTraffic] = useState("")
  const [price, setPrice] = useState("0")
  const [priceUnit, setPriceUnit] = useState<"per spot" | "per day" | "per month">("per month")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Fetch total count of products
  const fetchTotalCount = useCallback(async () => {
    if (!userData?.company_id) {
      setTotalItems(0)
      setTotalPages(1)
      setLoadingCount(false)
      return
    }

    setLoadingCount(true)
    try {
      const count = await getUserProductsCount(userData?.company_id, { active: true })
      setTotalItems(count)
      setTotalPages(Math.max(1, Math.ceil(count / ITEMS_PER_PAGE)))
    } catch (error) {
      console.error("Error fetching total count:", error)
      toast({
        title: "Error",
        description: "Failed to load product count. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingCount(false)
    }
  }, [userData, toast])

  // Set up real-time listener for products
  useEffect(() => {
    if (!userData?.company_id) {
      setAllProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = getUserProductsRealtime(userData.company_id, (products) => {
      setAllProducts(products)
      setLoading(false)
    })

    return unsubscribe
  }, [userData?.company_id])

  // Load total count
  useEffect(() => {
    fetchTotalCount()
  }, [userData?.company_id, fetchTotalCount])

  // Handle search query - use Algolia for search, fallback to client-side filtering
  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) {
      setFilteredProducts(allProducts)
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        // Use Algolia search
        const searchResponse = await searchProducts(
          trimmedQuery,
          userData?.company_id || undefined,
          0, // page
          1000 // large number to get all results for client-side pagination
        )

        if (searchResponse.hits && searchResponse.hits.length > 0) {
          // Convert Algolia results back to Product format for consistency
          const productsFromSearch: Product[] = searchResponse.hits.map(hit => ({
            id: hit.objectID,
            name: hit.name,
            type: hit.type,
            price: hit.price,
            specs_rental: hit.specs_rental || {
              location: hit.location
            },
            media: hit.media || [],
            categories: hit.category ? [hit.category] : [],
            seller_id: hit.seller_id,
            company_id: userData?.company_id,
            description: hit.description,
            active: true,
            deleted: false,
            created: new Date(),
            updated: new Date()
          } as Product))

          setFilteredProducts(productsFromSearch)
          setSearchResults(searchResponse.hits)
        } else {
          // Fallback to client-side filtering if Algolia fails
          console.log("Algolia search failed, falling back to client-side filtering")
          const searchLower = trimmedQuery.toLowerCase()
          const filtered = allProducts.filter((product) =>
            product.name?.toLowerCase().includes(searchLower) ||
            product.specs_rental?.location?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
          )
          setFilteredProducts(filtered)
          setSearchResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        // Fallback to client-side filtering
        const searchLower = trimmedQuery.toLowerCase()
        const filtered = allProducts.filter((product) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.specs_rental?.location?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        )
        setFilteredProducts(filtered)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [allProducts, searchQuery, userData?.company_id])

  // Update pagination when filtered products change
  useEffect(() => {
    const totalFilteredItems = filteredProducts.length
    const newTotalPages = Math.max(1, Math.ceil(totalFilteredItems / ITEMS_PER_PAGE))
    setTotalPages(newTotalPages)
    setTotalItems(totalFilteredItems)

    // Reset to page 1 if current page is out of bounds
    if (currentPage > newTotalPages) {
      setCurrentPage(1)
    }
  }, [filteredProducts.length, currentPage])

  // Update displayed products for current page
  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    setDisplayedProducts(filteredProducts.slice(startIndex, endIndex))
  }, [filteredProducts, currentPage])

  // Reset card refs when displayed products change
  useEffect(() => {
    cardElementsRef.current = cardElementsRef.current.slice(0, displayedProducts.length)
  }, [displayedProducts.length])

  // Animation logic for grid view only
   const createAnimation = () => {
     const validElements = cardElementsRef.current.filter(el => el !== null)
     if (!validElements.length) return null

     // Set initial state
     gsap.set(validElements, { y: 20, opacity: 0 })

     const tl = gsap.timeline({ paused: true })

     // Animate items in with stagger
     tl.to(validElements, {
       y: 0,
       opacity: 1,
       duration: 0.3,
       ease: "power3.out",
       stagger: 0.05
     })

     return tl
   }

   useLayoutEffect(() => {
     // Only run animation for grid view
     if (viewMode !== "grid") {
       tlRef.current?.kill()
       tlRef.current = null
       return
     }

     // Kill existing animation
     tlRef.current?.kill()

     const tl = createAnimation()
     tlRef.current = tl

     // Play animation if we have items and it's not the initial load
     if (tl && displayedProducts.length > 0 && !loading) {
       // Small delay for smoother experience
       setTimeout(() => {
         tl.play()
       }, 50)
     }

     return () => {
       tl?.kill()
       tlRef.current = null
     }
   }, [displayedProducts, loading, viewMode])

  // Function to set card refs
  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    cardElementsRef.current[index] = el
  }
  
  // Animated list item component using Framer Motion
  const AnimatedListItem = ({ children, delay = 0, index }: { children: React.ReactNode, delay?: number, index: number }) => {
    const ref = useRef(null)
    const inView = useInView(ref, { amount: 0.5, once: false })
  
    return (
      <motion.div
        ref={ref}
        data-index={index}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.2, delay }}
        style={{ marginBottom: '1rem' }}
      >
        {children}
      </motion.div>
    )
  }

  // Update price unit based on site type
  useEffect(() => {
    if (siteType === "static") {
      setPriceUnit("per month")
    } else if (siteType === "digital") {
      setPriceUnit("per spot")
    }
  }, [siteType])

  // Update category based on site type
  useEffect(() => {
    if (siteType === "static") {
      setCategory(STATIC_CATEGORIES[0])
    } else if (siteType === "digital") {
      setCategory(DIGITAL_CATEGORIES[0])
    }
  }, [siteType])

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always include first page
      pageNumbers.push(1)

      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed before the range
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed after the range
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always include last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Handle product deletion
  const handleDeleteClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !productToDelete.id) return

    try {
      await softDeleteProduct(productToDelete.id)

      // The real-time listener will automatically update the UI
      // No need for manual state updates

      toast({
        title: "Product deleted",
        description: `${productToDelete.name} has been successfully deleted.`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/business/inventory/edit/${product.id}`)
  }

  const handleViewDetails = (productId: string) => {
    router.push(`/business/inventory/${productId}`)
  }

  const handleAddSiteClick = async () => {
    console.log("handleAddSiteClick: Starting subscription check")
    console.log("userData:", { company_id: userData?.company_id, license_key: userData?.license_key })

    // Check if user has company_id first
    if (!userData?.company_id) {
      console.log("No company_id found, showing company registration dialog")
      setShowCompanyDialog(true)
      return
    }

    // Check if company information is complete
    try {
      const isCompanyComplete = await CompanyService.isCompanyInfoComplete(userData.company_id)
      if (!isCompanyComplete) {
        console.log("Company information incomplete, showing company update dialog")
        setShowCompanyUpdateDialog(true)
        return
      }
    } catch (error) {
      console.error("Error checking company completeness:", error)
      setSubscriptionLimitMessage("Error checking company information. Please try again or contact support.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Query subscription by company ID
    let currentSubscription = null
    try {
      console.log("Fetching subscription for company_id:", userData.company_id)
      currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
      console.log("Current subscription:", currentSubscription)
    } catch (error) {
      console.error("Error fetching subscription:", error)
      setSubscriptionLimitMessage("Error fetching subscription data. Please try again or contact support.")
      setShowSubscriptionLimitDialog(true)
      return
    }


    // Check if subscription exists and is active
    if (!currentSubscription) {
      console.log("No subscription found")
      setSubscriptionLimitMessage("No active subscription found. Please choose a plan to start adding sites.")
      setShowSubscriptionLimitDialog(true)
      return
    }

    if (currentSubscription.status !== "active") {
      console.log("Subscription not active, status:", currentSubscription.status)
      setSubscriptionLimitMessage(
        `Your subscription is ${currentSubscription.status}. Please activate your subscription to continue.`,
      )
      setShowSubscriptionLimitDialog(true)
      return
    }

    // Check product limit
    console.log("Checking product limit:", { totalItems, maxProducts: currentSubscription.maxProducts })
    if (totalItems >= currentSubscription.maxProducts) {
      console.log("Product limit reached")
      setSubscriptionLimitMessage(
        `You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
      )
      setShowSubscriptionLimitDialog(true)
      return
    }

    console.log("All checks passed, opening add site dialog")

    // Reset form to defaults
    setSiteType("static")
    setCategory(STATIC_CATEGORIES[0])
    setSiteName("")
    setLocation("")
    setLocationLabel("")
    setGeopoint(null)
    setHeight("")
    setWidth("")
    setDimensionUnit("ft")
    setElevation("")
    setElevationUnit("ft")
    setDescription("")
    setSelectedAudience([])
    setDailyTraffic("")
    setPrice("0")
    setPriceUnit("per month")
    setUploadedFiles([])
    setCurrentImageIndex(0)

    setShowAddSiteDialog(true)
  }

  const handleCompanyRegistrationSuccess = async () => {
    console.log("Company registration successful, refreshing user data")
    await refreshUserData()
    setShowCompanyDialog(false)

    // Wait a bit for userData to update
    setTimeout(async () => {
      // Query subscription by company ID after company registration
      let currentSubscription = null
      try {
        if (userData?.company_id) {
          console.log("Fetching subscription after company registration for company_id:", userData.company_id)
          currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
          console.log("Subscription after company registration:", currentSubscription)
        }
      } catch (error) {
        console.error("Error fetching subscription after company registration:", error)
      }


      if (!currentSubscription) {
        console.log("No subscription found after company registration")
        setSubscriptionLimitMessage(
          "Company registered successfully! Please choose a subscription plan to start adding sites.",
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (currentSubscription.status !== "active") {
        console.log("Subscription not active after company registration, status:", currentSubscription.status)
        setSubscriptionLimitMessage(
          `Company registered successfully! Your subscription is ${currentSubscription.status}. Please activate it to continue.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (totalItems >= currentSubscription.maxProducts) {
        console.log("Product limit reached after company registration")
        setSubscriptionLimitMessage(
          `Company registered successfully! You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Only redirect if all subscription checks pass
      console.log("All checks passed after company registration, redirecting to create product")
      router.push("/admin/products/create")
    }, 1000) // Wait 1 second for userData to refresh
  }

  const handleCompanyUpdateSuccess = async () => {
    console.log("Company update successful")
    setShowCompanyUpdateDialog(false)

    // Wait a bit for any updates to propagate
    setTimeout(async () => {
      // Continue with the subscription checks after company update
      let currentSubscription = null
      try {
        if (userData?.company_id) {
          console.log("Fetching subscription after company update for company_id:", userData.company_id)
          currentSubscription = await subscriptionService.getSubscriptionByCompanyId(userData.company_id)
          console.log("Subscription after company update:", currentSubscription)
        }
      } catch (error) {
        console.error("Error fetching subscription after company update:", error)
        setSubscriptionLimitMessage("Error fetching subscription data. Please try again or contact support.")
        setShowSubscriptionLimitDialog(true)
        return
      }


      // Check if subscription exists and is active
      if (!currentSubscription) {
        console.log("No subscription found after company update")
        setSubscriptionLimitMessage("No active subscription found. Please choose a plan to start adding sites.")
        setShowSubscriptionLimitDialog(true)
        return
      }

      if (currentSubscription.status !== "active") {
        console.log("Subscription not active after company update, status:", currentSubscription.status)
        setSubscriptionLimitMessage(
          `Your subscription is ${currentSubscription.status}. Please activate your subscription to continue.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Check product limit
      console.log("Checking product limit after company update:", { totalItems, maxProducts: currentSubscription.maxProducts })
      if (totalItems >= currentSubscription.maxProducts) {
        console.log("Product limit reached after company update")
        setSubscriptionLimitMessage(
          `You've reached your plan limit of ${currentSubscription.maxProducts} sites. Upgrade your plan to add more sites.`,
        )
        setShowSubscriptionLimitDialog(true)
        return
      }

      // Only open dialog if all checks pass
      console.log("All checks passed after company update, opening add site dialog")
      setShowAddSiteDialog(true)
      setValidationErrors([])
 
      // Show info about required fields
      setTimeout(() => {
        toast({
          title: "Required Fields",
          description: "Fields marked with * are required: Site Name, Location, and Price.",
        })
      }, 500)
    }, 500) // Wait 0.5 seconds for updates to propagate
  }

  // Form handlers
  const toggleAudience = (type: string) => {
    setSelectedAudience(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)])
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : uploadedFiles.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < uploadedFiles.length - 1 ? prev + 1 : 0))
  }

  const handleRemoveImage = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!userData?.company_id || !user?.uid) return

    setIsSubmitting(true)

    // Clear previous validation errors
    setValidationErrors([])

    // Validation - collect all errors
    const errors: string[] = []

    if (!siteName.trim()) {
      errors.push("Site name")
    }

    if (!location.trim()) {
      errors.push("Location")
    }

    if (!price.trim()) {
      errors.push("Price")
    } else if (isNaN(Number(price))) {
      toast({
        title: "Validation Error",
        description: "Price must be a valid number.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (height.trim() && isNaN(Number(height))) {
      toast({
        title: "Validation Error",
        description: "Height must be a valid number.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (width.trim() && isNaN(Number(width))) {
      toast({
        title: "Validation Error",
        description: "Width must be a valid number.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Show validation error for missing required fields
    if (errors.length > 0) {
      setValidationErrors(errors)
      const errorMessage = errors.length === 1
        ? `${errors[0]} is required.`
        : `The following fields are required: ${errors.join(", ")}.`

      toast({
        title: "Required Fields Missing",
        description: errorMessage,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Upload files to Firebase Storage
      const mediaUrls: Array<{ url: string; distance: string; type: string; isVideo: boolean }> = []
      for (const file of uploadedFiles) {
        const url = await uploadFileToFirebaseStorage(file, `products/${userData.company_id}`)
        mediaUrls.push({
          url,
          distance: "0",
          type: file.type,
          isVideo: file.type.startsWith('video/')
        })
      }

      // Create product data
      const productData: Partial<Product> = {
        name: siteName,
        description,
        price: parseFloat(price) || 0,
        content_type: siteType,
        categories: [category],
        company_id: userData.company_id,
        seller_id: user?.uid,
        seller_name: user?.displayName || user?.email || "",
        specs_rental: {
          audience_types: selectedAudience,
          location,
          location_label: locationLabel,
          ...(geopoint && { geopoint }),
          traffic_count: parseInt(dailyTraffic) || null,
          height: parseFloat(height) || null,
          width: parseFloat(width) || null,
          elevation: parseFloat(elevation) || null,
          structure: {
            color: null,
            condition: null,
            contractor: null,
            last_maintenance: null,
          },
          illumination: {
            bottom_count: null,
            bottom_lighting_specs: null,
            left_count: null,
            left_lighting_specs: null,
            right_count: null,
            right_lighting_specs: null,
            upper_count: null,
            upper_lighting_specs: null,
            power_consumption_monthly: null,
          },
        },
        media: mediaUrls,
        type: "RENTAL",
        active: true,
      }

      await createProduct(productData)

      // Reset form
      setSiteType("static")
      setCategory(STATIC_CATEGORIES[0])
      setSiteName("")
      setLocation("")
      setLocationLabel("")
      setGeopoint(null)
      setHeight("")
      setWidth("")
      setDimensionUnit("ft")
      setElevation("")
      setElevationUnit("ft")
      setDescription("")
      setSelectedAudience([])
      setDailyTraffic("")
      setPrice("0")
      setPriceUnit("per month")
      setUploadedFiles([])
      setCurrentImageIndex(0)

      setShowAddSiteDialog(false)

      // Navigate to page 1 (the real-time listener will update the UI automatically)
      setCurrentPage(1)
      fetchTotalCount()

      toast({
        title: "Site added successfully",
        description: `${siteName} has been added to your inventory.`,
      })
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "Failed to add site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading only on initial load
  if (loading && allProducts.length === 0 && userData === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <RouteProtection requiredRoles="business">
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333333] mb-4">Inventory</h1>

          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a1a1a1] w-4 h-4" />
              <Input
                placeholder="Search products..."
                className="pl-10 pr-10 w-80 bg-white border-[#d9d9d9]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && !isSearching && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a1a1a1] hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a1a1a1] w-4 h-4 animate-spin" />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-gray-100" : ""}>
                <List className="w-4 h-4 text-[#a1a1a1]" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-gray-100" : ""}>
                <Grid3X3 className="w-4 h-4 text-[#a1a1a1]" />
              </Button>
            </div>
          </div>

          {/* Inventory Display - Grid or List View */}
          {viewMode === "grid" ? (
            /* Grid View */
            <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading && allProducts.length === 0
                ? Array.from({ length: 8 }).map((_, index) => (
                    <Card key={`shimmer-${index}`} className="overflow-hidden border border-gray-200 shadow-md rounded-xl">
                      <div className="h-48 bg-gray-200 animate-pulse" />
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : displayedProducts.map((product, index) => (
                    <Card
                      key={product.id}
                      ref={setCardRef(index)}
                      className="bg-white border-[#d9d9d9] hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => product.id && handleViewDetails(product.id)}
                    >
                      <div className="h-48 bg-gray-200 relative">
                        <Image
                          src={
                            product.media && product.media.length > 0
                              ? product.media[0].url
                              : "/abstract-geometric-sculpture.png"
                          }
                          alt={product.name || "Product image"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/abstract-geometric-sculpture.png"
                            target.className = "opacity-50"
                          }}
                        />
                      </div>

                      <CardContent className="p-4">
                        <div className="flex flex-col">
                          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                          <div className="mt-2 text-sm font-medium text-green-700">
                            ₱{Number(product.price).toLocaleString()}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 flex items-center">
                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                            <span className="truncate">{product.specs_rental?.location || "Unknown location"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white border border-[#d9d9d9] rounded-lg overflow-hidden">
              {/* List Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-10 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-4">Site Details</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Price</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-200">
                {loading && allProducts.length === 0
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div key={`shimmer-list-${index}`} className="px-6 py-4">
                        <div className="grid grid-cols-10 gap-4 items-center">
                          <div className="col-span-4 flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                          </div>
                          <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                          </div>
                          <div className="col-span-2">
                            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))
                  : displayedProducts.map((product, index) => (
                      <AnimatedListItem key={product.id} delay={0.1} index={index}>
                        <div
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => product.id && handleViewDetails(product.id)}
                        >
                        <div className="grid grid-cols-10 gap-4 items-center">
                          {/* Site Details */}
                          <div className="col-span-4 flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  product.media && product.media.length > 0
                                    ? product.media[0].url
                                    : "/abstract-geometric-sculpture.png"
                                }
                                alt={product.name || "Product image"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/abstract-geometric-sculpture.png"
                                  target.className = "opacity-50"
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {product.description || "No description"}
                              </p>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="col-span-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.type === "static" ? "Static" : "Digital"}
                            </span>
                          </div>

                          {/* Location */}
                          <div className="col-span-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin size={14} className="mr-1 flex-shrink-0" />
                              <span className="truncate">{product.specs_rental?.location || "Unknown"}</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="col-span-2">
                            <span className="text-sm font-medium text-green-700">
                              ₱{Number(product.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AnimatedListItem>
                    ))}
              </div>
            </div>
          )}

          {/* Show empty state message when no products and not loading */}
          {!loading && allProducts.length === 0 && userData?.company_id && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No sites found</div>
              <div className="text-gray-400 text-sm">Click the "Add Site" button below to create your first site.</div>
            </div>
          )}

          {/* Show company setup message when no company_id */}
          {!loading && !userData?.company_id && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Welcome to your inventory!</div>
              <div className="text-gray-400 text-sm">
                Click the "Add Site" button below to set up your company and create your first site.
              </div>
            </div>
          )}

          {/* Pagination Controls - Only show if there are products or multiple pages */}
          {(displayedProducts.length > 0 || totalPages > 1) && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-500 flex items-center">
                {loadingCount ? (
                  <div className="flex items-center">
                    <Loader2 size={14} className="animate-spin mr-2" />
                    <span>Calculating pages...</span>
                  </div>
                ) : (
                  <span>
                    Page {currentPage} of {totalPages} ({filteredProducts.length} items)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 bg-transparent"
                >
                  <ChevronLeft size={16} />
                </Button>

                {/* Page numbers - Hide on mobile */}
                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page as number)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4169e1] hover:bg-[#1d0beb] shadow-lg"
        size="icon"
        onClick={handleAddSiteClick}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description="This product will be removed from your inventory. This action cannot be undone."
        itemName={productToDelete?.name}
      />

      {/* Subscription Limit Dialog */}
      <Dialog open={showSubscriptionLimitDialog} onOpenChange={setShowSubscriptionLimitDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>🎯 Let's Get You Started!</DialogTitle>
            <DialogDescription>{subscriptionLimitMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push("/admin/subscriptions/choose-plan")}>Choose Plan</Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Registration Dialog */}
      <CompanyRegistrationDialog
        isOpen={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onSuccess={handleCompanyRegistrationSuccess}
      />

      {/* Company Update Dialog */}
      <CompanyUpdateDialog
        isOpen={showCompanyUpdateDialog}
        onClose={() => setShowCompanyUpdateDialog(false)}
        onSuccess={handleCompanyUpdateSuccess}
      />

      {/* Add Site Dialog */}
      <Dialog open={showAddSiteDialog} onOpenChange={setShowAddSiteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] py-0 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b px-6 mb-0 min-h-[4rem] flex items-start pt-6">
            <DialogTitle className="text-2xl font-semibold text-[#333333]">+Add site</DialogTitle>
          </DialogHeader>

          {/* Validation Errors Display */}
          {validationErrors.length > 0 && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please fill in the required fields:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul role="list" className="list-disc pl-5 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Site Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Site Type:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={siteType === "static" ? "default" : "outline"}
                    onClick={() => setSiteType("static")}
                    className={`flex-1 ${
                      siteType === "static"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Static
                  </Button>
                  <Button
                    variant={siteType === "digital" ? "default" : "outline"}
                    onClick={() => setSiteType("digital")}
                    className={`flex-1 ${
                      siteType === "digital"
                        ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                        : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                    }`}
                  >
                    Digital
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Category:</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-[#c4c4c4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(siteType === "static" ? STATIC_CATEGORIES : DIGITAL_CATEGORIES).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Site Name */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Site Name: <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Site Name"
                  className="border-[#c4c4c4]"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Location: <span className="text-red-500">*</span>
                </Label>
                <GooglePlacesAutocomplete
                  value={location}
                  onChange={setLocation}
                  onGeopointChange={setGeopoint}
                  placeholder="Enter street address or search location..."
                  enableMap={true}
                  mapHeight="250px"
                />
              </div>

              {/* Location Label */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Location Label:</Label>
                <Input
                  placeholder="e.g., Near Mall, Highway Side"
                  className="border-[#c4c4c4]"
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                />
              </div>

              {/* Dimension */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Dimension:</Label>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Height:</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      className="border-[#c4c4c4]"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <span className="text-[#4e4e4e]">x</span>
                  <div className="flex-1">
                    <Label className="text-[#4e4e4e] text-sm mb-1 block">Width:</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 20"
                      className="border-[#c4c4c4]"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>
                  <Select value={dimensionUnit} onValueChange={(value: "ft" | "m") => setDimensionUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Elevation from ground */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Elevation from ground: <span className="text-[#c4c4c4]">(Optional)</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    className="flex-1 border-[#c4c4c4]"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                  />
                  <Select value={elevationUnit} onValueChange={(value: "ft" | "m") => setElevationUnit(value)}>
                    <SelectTrigger className="w-20 border-[#c4c4c4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Description:</Label>
                <Textarea
                  className="min-h-[120px] border-[#c4c4c4] resize-none"
                  placeholder="Describe the site location, visibility, and any special features..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Audience Type */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Audience Type: <span className="text-[#c4c4c4]">(can choose multiple)</span>
                </Label>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "E"].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      onClick={() => toggleAudience(type)}
                      className={`w-12 h-10 ${
                        selectedAudience.includes(type)
                          ? "bg-[#30c71d] hover:bg-[#28a819] text-white border-[#30c71d]"
                          : "bg-white border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50"
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Traffic */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">Monthly Traffic Count:</Label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  className="border-[#c4c4c4]"
                  value={dailyTraffic}
                  onChange={(e) => setDailyTraffic(e.target.value)}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Photo: <span className="text-[#c4c4c4]">(can upload multiple)</span>
                </Label>

                {/* Image Preview/Carousel */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      {/* Main Image Display */}
                      <div className="aspect-video relative">
                        <img
                          src={URL.createObjectURL(uploadedFiles[currentImageIndex])}
                          alt={`Preview ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Remove Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => handleRemoveImage(currentImageIndex)}
                        >
                          ×
                        </Button>
                      </div>

                      {/* Navigation Arrows (only show if multiple images) */}
                      {uploadedFiles.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {/* Image Counter */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {uploadedFiles.length}
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {uploadedFiles.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {uploadedFiles.map((file, index) => (
                          <button
                            key={index}
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                              index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-[#c4c4c4] rounded-lg p-8 text-center bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-[#c4c4c4] mx-auto mb-2" />
                    <p className="text-[#c4c4c4] font-medium">Upload</p>
                  </label>
                  {uploadedFiles.length === 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Click to select images
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <Label className="text-[#4e4e4e] font-medium mb-3 block">
                  Price: <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="e.g., 15000"
                    className="flex-1 border-[#c4c4c4]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <Select value={priceUnit} disabled>
                    <SelectTrigger className="w-28 border-[#c4c4c4] bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per spot">per spot</SelectItem>
                      <SelectItem value="per day">per day</SelectItem>
                      <SelectItem value="per month">per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-[#c4c4c4] mt-8 pt-6 pb-6 -mb-6">
            <div className="flex justify-end gap-4 px-6">
              <Button
                variant="outline"
                className="px-8 border-[#c4c4c4] text-[#4e4e4e] hover:bg-gray-50 bg-transparent"
                onClick={() => setShowAddSiteDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="px-8 bg-[#1d0beb] hover:bg-[#1508d1] text-white"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RouteProtection>
  )
}
