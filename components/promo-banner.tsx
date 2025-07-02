"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

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
  const [hasEnded, setHasEnded] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +promoEndDate - +new Date()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
        setHasEnded(false)
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setHasEnded(true)
      }
    }

    calculateTimeLeft() // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [promoEndDate])

  if (hasEnded) {
    return null // Don't render the banner if the promo has ended
  }

  return (
    <div className="relative mb-8 flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-green-600 p-4 text-white shadow-lg">
      <div className="absolute -left-8 -top-8 h-24 w-24 rotate-45 transform rounded-full bg-red-500 flex items-end justify-end pr-2 pb-2 text-xs font-bold text-white shadow-inner">
        <span className="transform -rotate-45">GRAPHIC EXPO '25 PROMO</span>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h2 className="text-2xl font-bold">90 DAYS FREE TRIAL</h2>
        <p className="mt-2 text-lg font-semibold whitespace-nowrap">
          {timeLeft.days} days : {timeLeft.hours} hours : {timeLeft.minutes} minutes : {timeLeft.seconds} seconds left
        </p>
      </div>
      <Button className="ml-4 bg-white text-green-600 hover:bg-gray-100">GET NOW</Button>
    </div>
  )
}
