"use client"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Assignment {
  id: string
  title: string
  description: string
  status: string
  dueDate: string
}

const columns: ColumnDef<Assignment>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
  },
]

const ServiceAssignmentsTable = () => {
  const [data, setData] = useState<Assignment[]>([])
  const router = useRouter()

  useEffect(() => {
    // Replace with your actual data fetching logic
    const mockData: Assignment[] = [
      {
        id: "1",
        title: "Install New Software",
        description: "Install the latest version of the accounting software on all workstations.",
        status: "In Progress",
        dueDate: "2024-03-15",
      },
      {
        id: "2",
        title: "Network Troubleshooting",
        description: "Diagnose and resolve network connectivity issues in the main office.",
        status: "Pending",
        dueDate: "2024-03-20",
      },
      {
        id: "3",
        title: "Hardware Upgrade",
        description: "Upgrade the RAM on the server to improve performance.",
        status: "Completed",
        dueDate: "2024-03-01",
      },
    ]
    setData(mockData)
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="container mx-auto py-10">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => router.push(`/logistics/assignments/${row.original.id}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default ServiceAssignmentsTable
