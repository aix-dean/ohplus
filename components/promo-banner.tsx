import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromoBannerProps {
  className?: string
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <Card className={cn("relative overflow-hidden rounded-lg shadow-lg", className)}>
      <CardContent className="relative flex items-center justify-between p-6">
        {/* Graphic Expo Badge */}
        <div className="absolute -left-4 -top-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-center text-xs font-bold uppercase text-white shadow-md rotate-[-25deg]">
          <div className="rotate-[25deg]">
            GRAPHIC EXPO
            <br />
            '25 PROMO
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <h2 className="text-4xl font-extrabold leading-tight text-white">90 DAYS FREE TRIAL</h2>
        </div>

        <Button variant="secondary" className="ml-4 flex items-center gap-2">
          GET NOW
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
