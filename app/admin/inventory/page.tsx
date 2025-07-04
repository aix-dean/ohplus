import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const InventoryPage = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Inventory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add New Site Card */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
          data-tour-id="add-site-card"
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
            <Plus className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Add New Site</h3>
            <p className="text-sm text-gray-500">Click here to add your first billboard site</p>
          </CardContent>
        </Card>

        {/* Example Site Card (Replace with dynamic data) */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Site Name</h3>
            <p className="text-sm text-gray-500">Address: 123 Main St</p>
            <p className="text-sm text-gray-500">Status: Active</p>
          </CardContent>
        </Card>

        {/* Example Site Card (Replace with dynamic data) */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Another Site</h3>
            <p className="text-sm text-gray-500">Address: 456 Oak Ave</p>
            <p className="text-sm text-gray-500">Status: Inactive</p>
          </CardContent>
        </Card>

        {/* Example Site Card (Replace with dynamic data) */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Yet Another Site</h3>
            <p className="text-sm text-gray-500">Address: 789 Pine Ln</p>
            <p className="text-sm text-gray-500">Status: Active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InventoryPage
