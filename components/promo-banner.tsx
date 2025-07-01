"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface PromoBannerProps {
  promoEndDate: Date
}

export function PromoBanner({ promoEndDate }: PromoBannerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    let timer: NodeJS.Timeout

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = promoEndDate.getTime() - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
      }
    }

    calculateTimeLeft()
    timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [promoEndDate])

  const isPromoActive = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0

  if (!isPromoActive) {
    return null // Don't render if promo is over
  }

  return (
    <div className="relative mb-8 flex flex-col items-center">
      <div className="relative flex items-center justify-center bg-[#28a745] text-white rounded-lg p-4 pr-6 shadow-md overflow-hidden">
        {/* Red Badge */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#dc3545] rounded-full flex items-center justify-center text-center text-xs font-bold uppercase leading-tight shadow-lg transform -rotate-45 origin-bottom-right">
          <span className="transform rotate-45 text-white text-sm">GRAPHIC EXPO '25 PROMO</span>
        </div>

        <div className="flex items-center gap-4 pl-20">
          {" "}
          {/* Added padding-left to account for badge */}
          <span className="text-3xl font-bold whitespace-nowrap">90 DAYS FREE TRIAL</span>
          <Button variant="secondary" size="lg" className="bg-white text-[#28a745] font-bold hover:bg-gray-100">
            GET NOW
          </Button>
        </div>
      </div>
      <p className="mt-2 text-lg font-medium text-gray-700">
        {timeLeft.days} days : {timeLeft.hours.toString().padStart(2, "0")} hours :{" "}
        {timeLeft.seconds.toString().padStart(2, "0")} seconds left
      </p>
    </div>
  )
}
