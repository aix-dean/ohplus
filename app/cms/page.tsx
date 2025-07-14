"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CMSPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard by default
    router.replace("/cms/dashboard")
  }, [router])

  return null
}
