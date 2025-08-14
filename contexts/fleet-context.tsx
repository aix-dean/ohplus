"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { FleetVehicle, FleetFormData, FleetStats, FleetFilters } from "@/types/fleet"

interface FleetContextType {
  vehicles: FleetVehicle[]
  loading: boolean
  error: string | null
  filters: FleetFilters
  stats: FleetStats

  // Actions
  fetchVehicles: () => Promise<void>
  createVehicle: (data: FleetFormData) => Promise<string>
  updateVehicle: (id: string, data: FleetFormData) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  getVehicleById: (id: string) => FleetVehicle | undefined
  setFilters: (filters: Partial<FleetFilters>) => void
  clearError: () => void
}

const FleetContext = createContext<FleetContextType | undefined>(undefined)

// Mock data for demonstration
const mockFleetData: FleetVehicle[] = [
  {
    id: "FL001",
    vehicleNumber: "ABC-1234",
    fleetName: "Service Fleet Alpha",
    vehicleType: "service-van",
    make: "Toyota",
    model: "Hiace",
    year: "2022",
    capacity: "8 passengers",
    registrationNumber: "ABC123456789",
    chassisNumber: "JTFSH3E16M0123456",
    engineNumber: "2TR-FE123456",
    fuelType: "gasoline",
    driver: "Juan Dela Cruz",
    status: "active",
    location: "Makati City",
    operationalNotes:
      "Primary service vehicle for Metro Manila operations. Regular maintenance schedule every 3 months.",
    purchaseDate: "2022-03-15",
    insuranceExpiry: "2024-12-31",
    registrationExpiry: "2024-06-30",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-04-15",
    fuelLevel: 85,
    mileage: "45,230 km",
    createdAt: "2022-03-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "FL002",
    vehicleNumber: "DEF-5678",
    fleetName: "Installation Fleet Beta",
    vehicleType: "installation-truck",
    make: "Isuzu",
    model: "NPR",
    year: "2021",
    capacity: "2000 kg",
    registrationNumber: "DEF987654321",
    chassisNumber: "JALC4B16517123456",
    engineNumber: "4HK1-TC123456",
    fuelType: "diesel",
    driver: "Maria Santos",
    status: "maintenance",
    location: "Service Center",
    operationalNotes: "Heavy-duty installation truck. Currently undergoing scheduled maintenance.",
    purchaseDate: "2021-08-20",
    insuranceExpiry: "2024-08-19",
    registrationExpiry: "2024-08-19",
    lastMaintenance: "2024-01-20",
    nextMaintenance: "2024-04-20",
    fuelLevel: 60,
    mileage: "38,450 km",
    createdAt: "2021-08-20T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
  },
  {
    id: "FL003",
    vehicleNumber: "GHI-9012",
    fleetName: "Service Fleet Gamma",
    vehicleType: "service-van",
    make: "Nissan",
    model: "Urvan",
    year: "2023",
    capacity: "12 passengers",
    registrationNumber: "GHI456789123",
    chassisNumber: "JN1TENZ50Z0123456",
    engineNumber: "QD32ETI123456",
    fuelType: "diesel",
    driver: "Pedro Garcia",
    status: "active",
    location: "Quezon City",
    operationalNotes: "New addition to the fleet. Excellent fuel efficiency and reliability.",
    purchaseDate: "2023-01-10",
    insuranceExpiry: "2025-01-09",
    registrationExpiry: "2025-01-09",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-04-10",
    fuelLevel: 92,
    mileage: "52,180 km",
    createdAt: "2023-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "FL004",
    vehicleNumber: "JKL-3456",
    fleetName: "Cargo Fleet Delta",
    vehicleType: "cargo-truck",
    make: "Mitsubishi",
    model: "Fuso",
    year: "2020",
    capacity: "3000 kg",
    registrationNumber: "JKL789123456",
    chassisNumber: "JMFSR90P000123456",
    engineNumber: "4M50-3AT5123456",
    fuelType: "diesel",
    driver: "Ana Rodriguez",
    status: "inactive",
    location: "Depot",
    operationalNotes: "Currently out of service pending major repairs. Scheduled for overhaul next month.",
    purchaseDate: "2020-05-25",
    insuranceExpiry: "2024-05-24",
    registrationExpiry: "2024-05-24",
    lastMaintenance: "2024-01-25",
    nextMaintenance: "2024-04-25",
    fuelLevel: 45,
    mileage: "29,870 km",
    createdAt: "2020-05-25T00:00:00Z",
    updatedAt: "2024-01-25T00:00:00Z",
  },
]

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(mockFleetData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<FleetFilters>({
    search: "",
    status: "all",
    vehicleType: "all",
    location: "all",
  })

  // Calculate stats
  const stats: FleetStats = {
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    inactive: vehicles.filter((v) => v.status === "inactive").length,
  }

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // setVehicles(response.data)
    } catch (err) {
      setError("Failed to fetch vehicles")
      console.error("Error fetching vehicles:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createVehicle = useCallback(
    async (data: FleetFormData): Promise<string> => {
      setLoading(true)
      setError(null)
      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newVehicle: FleetVehicle = {
          ...data,
          id: `FL${String(vehicles.length + 1).padStart(3, "0")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          fuelLevel: 100,
          mileage: "0 km",
        }

        setVehicles((prev) => [...prev, newVehicle])
        return newVehicle.id
      } catch (err) {
        setError("Failed to create vehicle")
        console.error("Error creating vehicle:", err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [vehicles.length],
  )

  const updateVehicle = useCallback(async (id: string, data: FleetFormData) => {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, ...data, updatedAt: new Date().toISOString() } : vehicle,
        ),
      )
    } catch (err) {
      setError("Failed to update vehicle")
      console.error("Error updating vehicle:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteVehicle = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id))
    } catch (err) {
      setError("Failed to delete vehicle")
      console.error("Error deleting vehicle:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getVehicleById = useCallback(
    (id: string): FleetVehicle | undefined => {
      return vehicles.find((vehicle) => vehicle.id === id)
    },
    [vehicles],
  )

  const setFilters = useCallback((newFilters: Partial<FleetFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: FleetContextType = {
    vehicles,
    loading,
    error,
    filters,
    stats,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    setFilters,
    clearError,
  }

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>
}

export function useFleet() {
  const context = useContext(FleetContext)
  if (context === undefined) {
    throw new Error("useFleet must be used within a FleetProvider")
  }
  return context
}
