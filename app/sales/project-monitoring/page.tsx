"use client"

import { ArrowLeft, Search, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getPaginatedUserProducts, type Product } from "@/lib/firebase-service"
import { useEffect, useState } from "react"

export default function ProjectMonitoringPage() {
  const router = useRouter()
  const { userData, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userData?.company_id || authLoading) return

      try {
        setLoading(true)
        const result = await getPaginatedUserProducts(userData.company_id, 1, null, { active: true })
        setProducts(result.items)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [userData?.company_id, authLoading])

  const firstProduct = products[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Project Bulletins</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dropdown Filter */}
          <div className="flex-1 flex justify-end">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Select Site</option>
                <option value="site1">Site 1</option>
                <option value="site2">Site 2</option>
                <option value="site3">Site 3</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-300 p-4 max-w-md">
          {/* Project ID */}
          <div className="text-blue-600 font-medium text-sm mb-3">JO-SU-LS-0014-060525</div>

          {/* Project Title Banner */}
          <div className="text-white px-4 py-2 rounded mb-3 w-fit" style={{ backgroundColor: "#00aeef" }}>
            <h3 className="font-semibold text-lg">Lilo & Stitch</h3>
          </div>

          {/* Project Location */}
          <div className="text-gray-900 font-medium mb-3">
            {loading
              ? "Loading..."
              : firstProduct?.specs_rental?.location
                ? firstProduct.specs_rental.location
                : "No location available"}
          </div>

          {/* Last Activity Section */}
          <div>
            <h4 className="text-gray-700 font-medium mb-2">Last Activity:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>5/6/25- 5:00AM- Arrival of FA to site</div>
              <div>5/4/25- 3:00PM- Reported Bad Weather as cause...</div>
              <div>5/3/25- 1:30PM- Contacted Team C for installation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
