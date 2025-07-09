"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

const handleCreateReport = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  console.log("Creating report for LED site structure")
}

interface LedsitesstructureProps {
  title: string
  description: string
}

const Ledsitesstructure: React.FC<LedsitesstructureProps> = ({ title, description }) => {
  return (
    <div className="border rounded-md p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <Button
        variant="outline"
        className="mt-4 w-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 font-medium"
        onClick={handleCreateReport}
      >
        Create Report
      </Button>
    </div>
  )
}

export default Ledsitesstructure
