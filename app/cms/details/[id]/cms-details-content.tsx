import type React from "react"

interface CMSDetailsContentProps {
  product?: {
    id: string
    name: string
    description: string
  }
}

const CMSDetailsContent: React.FC<CMSDetailsContentProps> = ({ product }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product?.name || "Product Details"}</h1>
          <p className="text-gray-600 mt-1">Manage your product content and settings</p>
        </div>
        <div className="flex items-center space-x-3">{/* Action buttons */}</div>
      </div>
      {/* Rest of the component */}
    </div>
  )
}

export default CMSDetailsContent
