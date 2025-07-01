"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Search, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DepartmentCardProps {
  title: string
  members: string[]
  metricLabel?: string
  metricValue?: string
  badgeCount?: number
  headerColor: string
  isAddNew?: boolean
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({
  title,
  members,
  metricLabel,
  metricValue,
  badgeCount,
  headerColor,
  isAddNew = false,
}) => (
  <Card className="w-full max-w-xs overflow-hidden rounded-lg shadow-md">
    <CardHeader className={cn("relative px-4 py-3 text-white", headerColor)}>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      {badgeCount !== undefined && (
        <Badge className="absolute right-3 top-3 rounded-full bg-white text-gray-800 px-2 py-1 text-xs font-bold">
          {badgeCount}
        </Badge>
      )}
    </CardHeader>
    <CardContent className="p-4">
      {isAddNew ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-gray-500">
          <Plus className="h-8 w-8 mb-2" />
          <p className="text-sm">Add New Department</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            {members.map((member, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                {member}
              </div>
            ))}
          </div>
          {metricLabel && metricValue && (
            <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
              <span>{metricLabel}</span>
              <span className="font-semibold">{metricValue}</span>
            </div>
          )}
        </>
      )}
      <Button variant="outline" className="w-full mt-4 text-gray-600 border-gray-300 hover:bg-gray-50 bg-transparent">
        + Add Widget
      </Button>
    </CardContent>
  </Card>
)

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin- Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ohliver's Dashboard</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-500 hover:bg-gray-100"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[180px] justify-between text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                {date ? format(date, "MMM yyyy") : <span>Pick a date</span>}
                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2000}
                toYear={2030}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DepartmentCard
            title="Sales"
            members={["Noemi", "Matthew"]}
            metricLabel="Monthly Revenue"
            metricValue="4,000,000"
            badgeCount={2}
            headerColor="bg-sales-red"
          />
          <DepartmentCard
            title="Logistics/ Operations"
            members={["Chona", "May"]}
            metricLabel="Total Service Assignments"
            metricValue="5"
            badgeCount={1}
            headerColor="bg-logistics-blue"
          />
          <DepartmentCard title="Accounting" members={["Chairman"]} headerColor="bg-accounting-purple" />
          <DepartmentCard title="Treasury" members={["Juvy"]} headerColor="bg-treasury-green" />
          <DepartmentCard title="I.T." members={["Emmerson"]} headerColor="bg-it-teal" />
          <DepartmentCard title="Fleet" members={["Jonathan"]} headerColor="bg-fleet-gray" />
          <DepartmentCard title="Creatives/Contents" members={["Eda"]} headerColor="bg-creatives-orange" />
          <DepartmentCard title="Finance" members={["Juvy"]} headerColor="bg-finance-dark-green" />
          <DepartmentCard title="Media/ Procurement" members={["Zen"]} headerColor="bg-media-cyan" />
          <DepartmentCard title="Business Dev." members={["Nikki"]} headerColor="bg-business-dev-indigo" />
          <DepartmentCard title="Legal" members={["Chona"]} badgeCount={2} headerColor="bg-legal-light-red" />
          <DepartmentCard
            title="Corporate"
            members={["Anthony"]}
            badgeCount={1}
            headerColor="bg-corporate-light-blue"
          />
          <DepartmentCard title="Human Resources" members={["Vanessa"]} badgeCount={1} headerColor="bg-hr-pink" />
          <DepartmentCard title="Special Team" members={["Mark"]} headerColor="bg-special-team-lavender" />
          <DepartmentCard title="Marketing" members={["John"]} headerColor="bg-marketing-bright-red" />
          <DepartmentCard title="Add New Department" members={[]} isAddNew={true} headerColor="bg-add-new-gray" />
        </div>
      </div>
    </div>
  )
}
