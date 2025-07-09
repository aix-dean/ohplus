"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface LedSite {
  id: string
  name: string
  location: string
  status: string
}

interface LedSitesContentProps {
  ledSites: LedSite[]
}

const LedSitesContent: React.FC<LedSitesContentProps> = ({ ledSites }) => {
  const handleCreateReport = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Creating report for LED site")
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ledSites.map((site) => (
        <Card key={site.id}>
          <CardHeader>
            <CardTitle>{site.name}</CardTitle>
            <CardDescription>{site.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Status: {site.status}</p>
            <Button
              variant="outline"
              className="mt-4 w-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 font-medium"
              onClick={handleCreateReport}
            >
              Create Report
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default LedSitesContent
