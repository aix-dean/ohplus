"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoBannerProps {
  className?: string // Add className prop
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <Card className={cn("rounded-xl border-2 shadow-sm transition-all duration-200", className)}>
      <CardContent className="flex items-center justify-between gap-4 p-6">
        {/* Left side: Graphic Expo badge */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs font-bold">
            '25
          </span>
          <span className="text-center text-sm font-bold leading-tight">GRAPHIC EXPO PROMO</span>
        </div>

        {/* Center: Promo text */}
        <div className="flex-1 text-center">
          <h2 className="text-4xl font-bold">90 DAYS FREE TRIAL</h2>
        </div>

        {/* Right side: Get Now button */}
        <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
          GET NOW <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
