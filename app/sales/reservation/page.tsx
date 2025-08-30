"use client"

import { useState } from "react"
import { Search, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const reservations = [
  {
    id: 1,
    site: "Petplans NB",
    client: "Fairy Skin",
    from: "Aug 5, 2025",
    to: "December 5, 2025",
    total: "4 months",
    status: "ONGOING",
  },
  {
    id: 2,
    site: "",
    client: "Jollibee Corp.",
    from: "Dec 31, 2025",
    to: "March 31, 2026",
    total: "3 months",
    status: "UPCOMING",
  },
  {
    id: 3,
    site: "Petplans SB",
    client: "Mcdo",
    from: "June 5, 2025",
    to: "Nov 5, 2025",
    total: "5 months",
    status: "ONGOING",
  },
  {
    id: 4,
    site: "Bocaue 2.2",
    client: "Bocaue 2.2",
    from: "Feb 18, 2025",
    to: "Nov 18, 2025",
    total: "9 months",
    status: "ONGOING",
  },
  {
    id: 5,
    site: "C-5 Billboard",
    client: "San Miguel",
    from: "Oct 30, 2025",
    to: "Feb 30, 2026",
    total: "4 months",
    status: "UPCOMING",
  },
]

export default function ReservationPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reservation.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reservations</h1>
          <p className="text-sm text-gray-600">See the status of the quotations you've generated</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder=""
              className="pl-10 bg-white border-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Total Reservations: {filteredReservations.length}</span>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              See History
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-900">Site</TableHead>
                <TableHead className="font-semibold text-gray-900">Client</TableHead>
                <TableHead className="font-semibold text-gray-900">From</TableHead>
                <TableHead className="font-semibold text-gray-900">To</TableHead>
                <TableHead className="font-semibold text-gray-900">Total</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{reservation.site || "-"}</TableCell>
                  <TableCell>{reservation.client}</TableCell>
                  <TableCell>{reservation.from}</TableCell>
                  <TableCell>{reservation.to}</TableCell>
                  <TableCell>{reservation.total}</TableCell>
                  <TableCell>
                    <Badge
                      variant={reservation.status === "ONGOING" ? "default" : "secondary"}
                      className={
                        reservation.status === "ONGOING"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {reservation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
