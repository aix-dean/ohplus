import type React from "react"
import { InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoProps extends React.SVGProps<SVGSVGElement> {}

export default function Info({ className, ...props }: InfoProps) {
  return <InfoIcon className={cn("h-4 w-4", className)} {...props} />
}
