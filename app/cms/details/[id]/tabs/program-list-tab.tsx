"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Calendar, List } from "lucide-react"

interface ProgramListTabProps {
  productId: string
}

// Mock program data - replace with real data fetching
const mockPrograms = [
  {
    id: "SPOT001",
    name: "Morning Slot",
    duration: "15 seconds",
    timeSlot: "06:00 AM - 12:00 PM",
    advertiser: "Coca Cola",
    price: "PHP 1,200",
    status: "Active",
  },
  {
    id: "SPOT002",
    name: "Afternoon Slot",
    duration: "30 seconds",
    timeSlot: "12:00 PM - 06:00 PM",
    advertiser: "Samsung",
    price: "PHP 1,800",
    status: "Active",
  },
  {
    id: "SPOT003",
    name: "Evening Slot",
    duration: "15 seconds",
    timeSlot: "06:00 PM - 12:00 AM",
    advertiser: "Nike",
    price: "PHP 2,100",
    status: "Pending",
  },
  {
    id: "SPOT004",
    name: "Late Night Slot",
    duration: "30 seconds",
    timeSlot: "12:00 AM - 06:00 AM",
    advertiser: "-",
    price: "PHP 900",
    status: "Available",
  },
]

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "available":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ProgramListTab({ productId }: ProgramListTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <List size={20} />
            Program Schedule
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar size={16} className="mr-2" />
              Calendar View
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Add Program
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spot ID</TableHead>
                <TableHead>Program Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-mono text-sm">{program.id}</TableCell>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.duration}</TableCell>
                  <TableCell>{program.timeSlot}</TableCell>
                  <TableCell>{program.advertiser}</TableCell>
                  <TableCell className="font-medium">{program.price}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
