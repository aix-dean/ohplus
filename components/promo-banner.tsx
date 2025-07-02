"use client"

import { useEffect, useState } from "react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface PromoBannerProps {
  promoEndDate: Date
}

export function PromoBanner({ promoEndDate }: PromoBannerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft() {
    const difference = +promoEndDate - +new Date()
    let timeLeft = {}

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    return timeLeft
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearTimeout(timer)
  })

  const timerComponents: JSX.Element[] = []

  Object.keys(timeLeft).forEach((interval) => {
    // @ts-ignore
    if (!timeLeft[interval]) {
      return
    }
    // @ts-ignore
    timerComponents.push(
      <span key={interval} className="font-semibold">
        {/* @ts-ignore */}
        {timeLeft[interval]} {interval}{" "}
      </span>,
    )
  })

  const isPromoActive = timeLeft.days! > 0 || timeLeft.hours! > 0 || timeLeft.minutes! > 0 || timeLeft.seconds! > 0

  if (!isPromoActive) {
    return null // Don't render if the promo has ended
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-center text-white shadow-lg">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url("/party-popper.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative z-10">
        <h3 className="text-lg font-bold">Limited Time Offer!</h3>
        <p className="mt-1 text-sm">Upgrade now and get a special discount!</p>
        <div className="mt-3 text-xl font-bold">
          {timerComponents.length ? <span className="block">{timerComponents} Left!</span> : <span>Promo Ended!</span>}
        </div>
      </div>
    </div>
  )
}
