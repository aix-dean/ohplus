"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface Props {
  params: {
    id: string
  }
}

// Redirect component to handle the old route
export default function CMSContentEditRedirect({ params }: Props) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new details route
    router.replace(`/cms/details/${params.id}`)
  }, [params.id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to content details...</p>
      </div>
    </div>
  )
}
