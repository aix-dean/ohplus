"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface PromoBannerProps {
  promoEndDate: Date
}

export function PromoBanner({ promoEndDate }: PromoBannerProps) {
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

  return (
    <Card className="mb-6 rounded-xl bg-gradient-to-r from-primary to-purple-600 p-6 text-white shadow-sm">
      <CardContent className="flex flex-col items-center justify-between gap-4 p-0 md:flex-row">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary">
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              '25
            </span>
            <span className="text-lg font-bold">EXPO</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">90 DAYS FREE TRIAL</h2>
            <p className="text-sm text-gray-200">Limited time offer for new sign-ups!</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {timeLeft && (
            <p className="text-lg font-semibold whitespace-nowrap">
              {timeLeft.days} days : {timeLeft.hours} hours : {timeLeft.minutes} minutes : {timeLeft.seconds} seconds
              left
            </p>
          )}
          <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
            GET NOW <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
