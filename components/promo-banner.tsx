import { Card } from "@/components/ui/card"
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
      <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-red-500 flex items-center justify-center text-center text-xs font-bold transform rotate-[-25deg] shadow-md">
        <span className="transform rotate-[25deg] text-white">
          GRAPHIC EXPO
          <br />
          '25 PROMO
        </span>
      </div>
      <div className="flex-1 text-center ml-16">
        <h2 className="text-3xl font-extrabold">90 DAYS FREE TRIAL</h2>
      </div>
      <div className="flex items-center">
        <a href="#" className="flex items-center text-white font-semibold hover:underline">
          GET NOW <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      </div>
    </Card>
  )
}
