"use client"

import { useState } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// DepartmentCard component is no longer needed if no cards are rendered,
// but keeping it here for reference if you decide to add them back later.
// interface DepartmentCardProps {
//   title: string
//   members: string[]
//   metricLabel?: string
//   metricValue?: string
//   badgeCount?: number
//   headerColor: string
//   isAddDepartment?: boolean
// }

// function DepartmentCard({
//   title,
//   members,
//   metricLabel,
//   metricValue,
//   badgeCount,
//   headerColor,
//   isAddDepartment = false,
// }: DepartmentCardProps) {
//   return (
//     <Card className="w-full">
//       <CardHeader className={`p-4 rounded-t-lg ${headerColor}`}>
//         <div className="flex justify-between items-center">
//           <CardTitle className="text-white text-lg font-semibold">{title}</CardTitle>
//           {badgeCount !== undefined && badgeCount > 0 && (
//             <Badge className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold">{badgeCount}</Badge>
//           )}
//         </div>
//       </CardHeader>
//       <CardContent className="p-4 space-y-3">
//         {isAddDepartment ? (
//           <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
//             <p className="text-muted-foreground text-sm">Click to add a new department</p>
//           </div>
//         ) : (
//           <>
//             <div className="space-y-1">
//               {members.map((member, index) => (
//                 <div key={index} className="flex items-center text-sm text-gray-700">
//                   <Dot className="h-4 w-4 text-green-500 mr-1" />
//                   <span>{member}</span>
//                 </div>
//               ))}
//             </div>
//             {metricLabel && metricValue && (
//               <div className="text-sm text-muted-foreground">
//                 <span>{metricLabel}</span>
//                 <span className="font-medium text-gray-800 ml-1">{metricValue}</span>
//               </div>
//             )}
//           </>
//         )}
//         <Button variant="outline" className="w-full text-gray-600 hover:bg-gray-50 bg-transparent">
//           + Add Widget
//         </Button>
//       </CardContent>
//     </Card>
//   )
// }

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("Jun 2025")

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  // departmentData array is removed as cards are no longer rendered.
  // const departmentData = [ ... ];

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {/* Admin Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin- Dashboard</h1>
      </div>

      {/* Ohliver's Dashboard Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Ohliver's Dashboard</h2>
          <div className="flex items-center space-x-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-8 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 hover:bg-gray-100"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  {selectedDate}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setSelectedDate("Jun 2025")}>Jun 2025</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedDate("May 2025")}>May 2025</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setSelectedDate("Apr 2025")}>Apr 2025</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* The grid of department cards has been removed from here */}
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No department cards to display.
        </div>
      </div>
    </div>
  )
}
