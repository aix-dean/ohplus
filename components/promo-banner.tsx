"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface PromoBannerProps {
  promoEndDate: Date
}

export function PromoBanner({ promoEndDate }: PromoBannerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isPromoActive, setIsPromoActive] = useState(true)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = promoEndDate.getTime() - now

      if (difference <= 0) {
        setIsPromoActive(false)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds }
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    return () => clearInterval(timer)
  }, [promoEndDate])

  if (!isPromoActive) {
    return null // Don't render the banner if the promo is not active
  }

  return (
    <Card className="relative mb-6 flex flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white shadow-lg md:flex-row md:justify-between md:p-8">
      <div className="absolute -left-8 -top-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-center text-xs font-bold uppercase text-white shadow-md">
        <span className="rotate-[-45deg]">
          GRAPHIC EXPO <br /> '25 PROMO
        </span>
      </div>
      <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <h2 className="text-3xl font-bold">90 DAYS FREE TRIAL</h2>
        <p className="mt-2 flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
          <Clock className="h-5 w-5" />
          {timeLeft.days} days : {timeLeft.hours} hours : {timeLeft.minutes} minutes : {timeLeft.seconds} seconds left
        </p>
      </div>
      <Button className="mt-6 bg-white text-green-600 hover:bg-gray-100 md:mt-0">GET NOW</Button>
    </Card>
  )
}
