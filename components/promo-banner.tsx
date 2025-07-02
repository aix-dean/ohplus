import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
        <div className="absolute -left-4 -top-4 h-20 w-20 rotate-45 transform bg-red-500 flex items-end justify-center pb-2 pr-2 text-center text-xs font-bold text-white shadow-md">
          <span className="absolute -rotate-45 transform whitespace-nowrap text-[10px]">GRAPHIC EXPO '25 PROMO</span>
        </div>

        <div className="flex-1 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">90 DAYS FREE TRIAL</h2>
          <p className="mt-1 text-sm sm:text-base">Limited time offer for new sign-ups!</p>
        </div>

        <Button className="ml-4 flex-shrink-0 bg-white text-green-600 hover:bg-gray-100">
          GET NOW <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
