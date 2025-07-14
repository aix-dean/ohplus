import { notFound } from "next/navigation"
import { getProductById, getServiceAssignmentsByProductId } from "@/lib/firebase-service"
import CMSDetailsContent from "./cms-details-content"
import CMSDetailsLoading from "./cms-details-loading"
import { Suspense } from "react"

interface PageProps {
  params: {
    id: string
  }
}

// Safe data fetcher with proper error handling
async function fetchProductData(productId: string) {
  try {
    if (!productId || typeof productId !== "string") {
      return null
    }

    const [product, serviceAssignments] = await Promise.all([
      getProductById(productId),
      getServiceAssignmentsByProductId(productId),
    ])

    if (!product) {
      return null
    }

    return {
      product,
      serviceAssignments: serviceAssignments || [],
    }
  } catch (error) {
    console.error("Error fetching product data:", error)
    return null
  }
}

export default async function CMSDetailsPage({ params }: PageProps) {
  const productId = params?.id

  if (!productId) {
    notFound()
  }

  const data = await fetchProductData(productId)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<CMSDetailsLoading />}>
        <CMSDetailsContent product={data.product} serviceAssignments={data.serviceAssignments} />
      </Suspense>
    </div>
  )
}
