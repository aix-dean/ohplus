import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoBannerProps {
  className?: string
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <Card className={cn("relative overflow-hidden rounded-xl shadow-lg", className)}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="relative flex items-center">
          {/* Red circle badge */}
          <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-red-500 flex items-center justify-center transform rotate-45">
            <span className="text-white text-xs font-bold -rotate-45">GRAPHIC EXPO '25 PROMO</span>
          </div>
          <div className="ml-16 text-3xl font-bold text-white">90 DAYS FREE TRIAL</div>
        </div>
        <div className="flex items-center">
          <a href="#" className="flex items-center text-white font-semibold hover:underline">
            GET NOW <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
