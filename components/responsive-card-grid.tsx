"use client"

import type React from "react"

import { useResponsive } from "@/hooks/use-responsive"
import { cn } from "@/lib/utils"

interface ResponsiveCardGridProps {
  children: React.ReactNode
  className?: string
  mobileColumns?: number
  tabletColumns?: number
  desktopColumns?: number
  gap?: "none" | "sm" | "md" | "lg"
  scrollable?: boolean
  maxHeight?: string
}

export function ResponsiveCardGrid({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = "md",
  scrollable = false,
  maxHeight = "calc(100vh - 200px)",
}: ResponsiveCardGridProps) {
  const { breakpoint } = useResponsive()

  const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  const getGridCols = () => {
    if (breakpoint === "xs" || breakpoint === "sm") {
      return `grid-cols-${mobileColumns}`
    } else if (breakpoint === "md") {
      return `grid-cols-${tabletColumns}`
    } else {
      return `grid-cols-${desktopColumns}`
    }
  }

  const scrollableClasses = scrollable ? "overflow-y-auto overflow-x-hidden" : ""

  const heightStyle = scrollable ? { maxHeight } : {}

  return (
    <div className={cn("grid", getGridCols(), gapClasses[gap], scrollableClasses, className)} style={heightStyle}>
      {children}
    </div>
  )
}
