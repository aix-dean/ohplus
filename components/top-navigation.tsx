"use client"

import type React from "react"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

interface TopNavigationProps {
  title: string
}

const TopNavigation: React.FC<TopNavigationProps> = ({ title }) => {
  const router = useRouter()

  return (
    <div className="border-b border-border p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Go back</span>
        </Button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </div>
  )
}

export default TopNavigation
