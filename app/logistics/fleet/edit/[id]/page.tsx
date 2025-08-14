"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, X, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useFleet } from "@/contexts/fleet-context"
import { FleetValidation } from "@/lib/fleet-validation"
import type { FleetFormData } from "@/types/fleet"
import { RouteProtection } from "@/components/route-protection"
import { toast } from "@/hooks/use-toast"

export default function EditFleetPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const { getVehicleById, updateVehicle, loading } = useFleet()
  const [isLoading, setIsLoading] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FleetFormData>({
    vehicleNumber: "",
    fleetName: "",
    vehicleType: "",
    make: "",
    model: "",
    year: "",
    capacity: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    fuelType: "",
    driver: "",
    status: "active",
    location: "",
    operationalNotes: "",
    purchaseDate: "",
    insuranceExpiry: "",
    registrationExpiry: "",
  })

  useEffect(() => {
    const loadVehicleData = () => {
      setIsLoading(true)
      try {
        const fleetId = params.id as string
        const vehicle = getVehicleById(fleetId)

        if (vehicle) {
          setFormData({
            vehicleNumber: vehicle.vehicleNumber,
            fleetName: vehicle.fleetName,
            vehicleType: vehicle.vehicleType,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            capacity: vehicle.capacity,
            registrationNumber: vehicle.registrationNumber,
            chassisNumber: vehicle.chassisNumber,
            engineNumber: vehicle.engineNumber,
            fuelType: vehicle.fuelType,
            driver: vehicle.driver,
            status: vehicle.status,
            location: vehicle.location,
            operationalNotes: vehicle.operationalNotes,
            purchaseDate: vehicle.purchaseDate,
            insuranceExpiry: vehicle.insuranceExpiry,
            registrationExpiry: vehicle.registrationExpiry,
          })
        } else {
          toast({
            title: "Error",
            description: "Vehicle not found",
            variant: "destructive",
          })
          router.push("/logistics/fleet")
        }
      } catch (error) {
        console.error("Error loading vehicle data:", error)
        toast({
          title: "Error",
          description: "Failed to load vehicle data",
          variant: "destructive",
        })
        router.push("/logistics/fleet")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadVehicleData()
    }
  }, [params.id, router, getVehicleById])

  const handleInputChange = (field: keyof FleetFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const errors = FleetValidation.validateVehicleForm(formData)
    if (errors.length > 0) {
      const errorMap = errors.reduce(
        (acc, error) => {
          acc[error.field] = error.message
          return acc
        },
        {} as Record<string, string>,
      )
      setValidationErrors(errorMap)
      return
    }

    try {
      await updateVehicle(params.id as string, formData)
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      })
      router.push("/logistics/fleet")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vehicle",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/logistics/fleet")
  }

  if (isLoading) {
    return (
      <RouteProtection requiredRoles="logistics">
        <div className="flex-1 overflow-auto relative bg-gray-50">
          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading vehicle data...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </RouteProtection>
    )
  }

  return (
    <RouteProtection requiredRoles="logistics">
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={handleCancel} className="bg-white border-gray-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fleet
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
                <p className="text-gray-600 mt-1">Update vehicle information for {formData.vehicleNumber}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ... existing form content with validation error displays ... */}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="bg-white border-gray-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update Vehicle"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </RouteProtection>
  )
}
