import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
      <p className="mb-4">Could not find the requested product.</p>
      <Link href="/cms/dashboard" className="text-blue-600 hover:text-blue-800 underline">
        Return to CMS Dashboard
      </Link>
    </div>
  )
}
