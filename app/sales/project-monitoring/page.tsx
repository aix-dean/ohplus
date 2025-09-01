"use client"

import { ArrowLeft, Search, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProjectMonitoringPage() {
  const projectCards = [
    {
      id: "JO-SU-LS-0014-060525",
      title: "Lilo & Stitch",
      location: "Petplans Southbound",
      lastActivity: "Last Activity",
      activities: [
        "-5/6/25- 5:00AM- Arrival of FA to site",
        "-5/4/25- 3:00PM- Reported Bad Weather as cause...",
        "-5/3/25- 1:30PM- Contacted Team C for installation",
      ],
      headerColor: "bg-cyan-500",
      textColor: "text-white",
    },
    {
      id: "JO-SU-LS-0014-060525",
      title: "Fairy Skin",
      location: "Bocaue 1.1",
      lastActivity: "Last Activity",
      activities: [
        "-5/6/25- 5:00AM- Arrival of FA to site",
        "-5/4/25- 3:00PM- Reported Bad Weather as cause...",
        "-5/3/25- 1:30PM- Contacted Team C for installation",
      ],
      headerColor: "bg-pink-500",
      textColor: "text-white",
    },
    {
      id: "JO-SU-LS-0014-060525",
      title: "FUNalo",
      location: "Bocaue 2.1",
      lastActivity: "Last Activity",
      activities: [
        "-5/6/25- 5:00AM- Arrival of FA to site",
        "-5/4/25- 3:00PM- Reported Bad Weather as cause...",
        "-5/3/25- 1:30PM- Contacted Team C for installation",
      ],
      headerColor: "bg-black",
      textColor: "text-white",
    },
  ]

  const bucCards = Array(3).fill({
    title: "BUC",
    message: "We are creating something exciting for you!",
    headerColor: "bg-cyan-500",
    textColor: "text-white",
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Project Bulletins</h1>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="" className="pl-10 bg-white border-gray-200" />
          </div>
          <Select defaultValue="select-site">
            <SelectTrigger className="w-48 bg-white border-gray-200">
              <SelectValue placeholder="Select Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="select-site">-Select Site-</SelectItem>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* First Row - Project Cards */}
        {projectCards.map((card, index) => (
          <Card key={index} className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-2">
              <div className="text-xs text-blue-600 font-medium mb-2">{card.id}</div>
              <div
                className={`${card.headerColor} ${card.textColor} px-4 py-2 rounded-md text-center font-bold text-lg`}
              >
                {card.title}
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                <div className="font-medium text-gray-900">{card.location}</div>
                <div className="text-sm text-gray-600">{card.lastActivity}</div>
                <div className="space-y-1">
                  {card.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="text-xs text-gray-500">
                      {activity}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Second Row - BUC Cards */}
        {bucCards.map((card, index) => (
          <Card key={`buc-${index}`} className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6 text-center">
              <div
                className={`${card.headerColor} ${card.textColor} px-4 py-2 rounded-md inline-block font-bold text-lg mb-4`}
              >
                {card.title}
              </div>
              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  <Building2 className="h-8 w-8 text-purple-500" />
                  <Building2 className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <p className="text-gray-700 font-medium">{card.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
