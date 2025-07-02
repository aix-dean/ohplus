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
    <Card className={cn("relative overflow-hidden rounded-xl shadow-md", className)}>
      <CardContent className="relative flex items-center justify-between p-6 sm:p-8">
        {/* Graphic Expo Badge */}
        <div className="absolute -left-4 -top-4 z-10 h-20 w-20 rounded-full bg-red-500 flex items-center justify-center text-center text-xs font-bold text-white shadow-lg rotate-[-25deg]">
          <div className="rotate-[25deg]">
            GRAPHIC EXPO
            <br />
            &apos;25 PROMO
          </div>
        </div>

        {/* Main Text */}
        <div className="flex-1 text-center pr-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">90 DAYS FREE TRIAL</h2>
          <p className="mt-1 text-lg sm:text-xl font-medium opacity-90">Limited time offer for new sign-ups!</p>
        </div>

        {/* Get Now Button */}
        <Button className="shrink-0 bg-white text-green-600 hover:bg-gray-100 font-bold px-6 py-3 rounded-full shadow-lg">
          GET NOW <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
