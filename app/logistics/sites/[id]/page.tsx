"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Product {
  id: number
  name: string
  description: string
  site_owner: string
  location: string
}

const ProductPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/logistics/sites/${id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProduct(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!product) {
    return <div>Product not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <div>
        <span className="font-medium">Description:</span> {product.description}
      </div>
      <div>
        <span className="font-medium">Location:</span> {product.location}
      </div>
      <div>
        <span className="font-medium">Site Owner:</span> {product.site_owner || ""}
      </div>
    </div>
  )
}

export default ProductPage
