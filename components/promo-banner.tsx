import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoBannerProps extends React.ComponentPropsWithoutRef<typeof Card> {
  // No promoEndDate needed here anymore as countdown is handled by parent
}

export function PromoBanner({ className, ...props }: PromoBannerProps) {
  return (
    <Card className={cn("relative overflow-hidden rounded-xl shadow-lg", className)} {...props}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="relative flex items-center">
          {/* Graphic Expo Badge */}
          <div className="absolute -left-8 -top-8 h-16 w-16 rounded-full bg-red-500 flex items-center justify-center transform rotate-[-25deg] shadow-md">
            <span className="text-white text-xs font-bold text-center leading-tight">
              GRAPHIC EXPO
              <br />
              '25 PROMO
            </span>
          </div>
          <div className="ml-12 text-3xl font-bold text-white">90 DAYS FREE TRIAL</div>
        </div>
        <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
          GET NOW <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
