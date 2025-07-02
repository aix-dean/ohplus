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
    <Card
      className={cn(
        "relative flex items-center justify-between p-4 rounded-xl shadow-lg overflow-hidden",
        "bg-gradient-to-r from-green-500 to-green-600 text-white",
        className,
      )}
    >
      {/* Badge */}
      <div className="absolute -left-8 -top-8 h-24 w-24 bg-red-500 rounded-full flex items-center justify-center transform -rotate-45">
        <div className="text-center text-white font-bold text-xs transform rotate-45">
          GRAPHIC EXPO
          <br />
          '25 PROMO
        </div>
      </div>

      <CardContent className="flex flex-1 items-center justify-center p-0 pl-16">
        <div className="text-3xl font-extrabold tracking-tight">90 DAYS FREE TRIAL</div>
      </CardContent>
      <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
        GET NOW <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  )
}
