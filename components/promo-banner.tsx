"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils" // Import cn for conditional class names

interface PromoBannerProps {
  promoEndDate: Date
  className?: string // Add className prop
}

export function PromoBanner({ promoEndDate, className }: PromoBannerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = promoEndDate.getTime() - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [promoEndDate])

  if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0)) {
    return null // Don't render if time is up or not calculated yet
  }

  return (
    <Card className={cn("rounded-xl border-2 shadow-sm transition-all duration-200", className)}>
      <CardContent className="flex flex-col items-center justify-between gap-4 p-6 text-white md:flex-row">
        {/* Left side: Graphic Expo badge and promo text */}
        <div className="flex items-start gap-4">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs font-bold">
              '25
            </span>
            <span className="text-lg font-bold">GRAPHIC EXPO</span>
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-3xl font-bold">90 DAYS FREE TRIAL</h2>
            <p className="text-sm text-gray-200">Limited time offer for new sign-ups!</p>
          </div>
        </div>

        {/* Right side: Countdown and Get Now button */}
        <div className="flex flex-col items-end gap-2 text-right">
          <p className="text-lg font-semibold whitespace-nowrap">
            {timeLeft.days} days : {timeLeft.hours.toString().padStart(2, "0")} hours :{" "}
            {timeLeft.minutes.toString().padStart(2, "0")} minutes : {timeLeft.seconds.toString().padStart(2, "0")}{" "}
            seconds left
          </p>
          <Button variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
            GET NOW <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
