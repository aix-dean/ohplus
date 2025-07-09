"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const handleCreateReport = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  console.log("Creating report for LED site compliance")
}

interface LedSitesComplianceProps {
  title: string
  description: string
  value: string
}

const LedSitesCompliance: React.FC<LedSitesComplianceProps> = ({ title, description, value }) => {
  return (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Button
          variant="outline"
          className="mt-4 w-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 font-medium"
          onClick={handleCreateReport}
        >
          Create Report
        </Button>
      </CardContent>
    </Card>
  )
}

export default LedSitesCompliance
