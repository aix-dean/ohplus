"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

const handleCreateReport = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  console.log("Creating report for LED site display health")
}

interface LedsitesdisplayhealthProps {
  title: string
  value: string
  percentageChange: string
  isPositive: boolean
}

const Ledsitesdisplayhealth: React.FC<LedsitesdisplayhealthProps> = ({
  title,
  value,
  percentageChange,
  isPositive,
}) => {
  return (
    <div className="border rounded-md p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? "+" : "-"}
        {percentageChange}
      </p>
      <Button
        variant="outline"
        className="mt-4 w-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 font-medium"
        onClick={handleCreateReport}
      >
        Create Report
      </Button>
    </div>
  )
}

export default Ledsitesdisplayhealth
