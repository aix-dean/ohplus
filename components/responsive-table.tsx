"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useResponsive } from "@/hooks/use-responsive"

interface Column<T> {
  header: string
  accessorKey: keyof T | ((row: T) => any)
  cell?: (row: T) => React.ReactNode
  className?: string
  hideOnMobile?: boolean
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  keyField: keyof T
  expandableContent?: (row: T) => React.ReactNode
  isLoading?: boolean
  emptyState?: React.ReactNode
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  keyField,
  expandableContent,
  isLoading = false,
  emptyState,
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const { isMobile, isTablet } = useResponsive()

  const isSmallScreen = isMobile || isTablet

  const visibleColumns = isSmallScreen ? columns.filter((column) => !column.hideOnMobile) : columns

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getValue = (row: T, column: Column<T>) => {
    if (typeof column.accessorKey === "function") {
      return column.accessorKey(row)
    }

    return row[column.accessorKey]
  }

  if (isLoading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return emptyState
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {expandableContent && <TableHead className="w-[40px]"></TableHead>}
            {visibleColumns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = String(row[keyField])
            const isExpanded = expandedRows[rowId]

            return (
              <>
                <TableRow
                  key={rowId}
                  className={cn(onRowClick && "cursor-pointer hover:bg-gray-50", isExpanded && "bg-gray-50")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {expandableContent && (
                    <TableCell
                      className="p-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleRow(rowId)
                      }}
                    >
                      <button className="p-1 rounded-full hover:bg-gray-200">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </TableCell>
                  )}
                  {visibleColumns.map((column, index) => (
                    <TableCell key={index} className={column.className}>
                      {column.cell ? column.cell(row) : getValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
                {expandableContent && isExpanded && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={visibleColumns.length + 1} className="p-4">
                      {expandableContent(row)}
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
