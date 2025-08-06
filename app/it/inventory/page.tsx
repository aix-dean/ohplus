import { useRouter } from "next/navigation"

const InventoryPage = () => {
  const router = useRouter()

  const handleEditItem = (itemId: string) => {
    router.push(`/it/inventory/edit/${itemId}`)
  }

  // JSX return statement
  return (
    <div>
      {/* List of inventory items */}
      {/* Each item should have an edit button that calls handleEditItem */}
      {/* Example:
      <button onClick={() => handleEditItem("item123")}>Edit</button>
      */}
    </div>
  )
}

export default InventoryPage
