"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoBannerProps {
  className?: string
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <Card className={cn("relative overflow-hidden rounded-xl shadow-lg", className)}>
      <CardContent className="flex items-center justify-between p-4 sm:p-6">
        {/* Graphic Expo Badge */}
        <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-red-500 flex items-center justify-center transform rotate-[-25deg] shadow-md">
          <div className="text-white text-xs font-bold text-center leading-tight transform rotate-[25deg]">
            GRAPHIC EXPO
            <br />
            '25 PROMO
          </div>
        </div>

        {/* Main Text */}
        <div className="flex-1 text-center ml-16 sm:ml-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">90 DAYS FREE TRIAL</h2>
        </div>

        {/* Get Now Button */}
        <Button className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-full shadow-md flex items-center gap-2">
          GET NOW <ArrowRight className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  )
}
