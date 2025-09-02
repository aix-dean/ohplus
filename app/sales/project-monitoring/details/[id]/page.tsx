"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

interface JobOrder {
  id: string
  joNumber: string
  // Add other fields as needed
}

export default function JobOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobOrder = async () => {
      if (!params.id) return

      try {
        const docRef = doc(db, "job_orders", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setJobOrder({
            id: docSnap.id,
            ...docSnap.data(),
          } as JobOrder)
        }
      } catch (error) {
        console.error("Error fetching job order:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrder()
  }, [params.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-1 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm font-medium">
          Lilo & Stitch
        </Badge>

        <span className="text-lg font-medium text-gray-900">
          {loading ? "Loading..." : jobOrder?.joNumber || "Job Order Not Found"}
        </span>
      </div>
    </div>
  )
}
