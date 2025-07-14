import { Loader2 } from "lucide-react"

export default function CMSSiteDetailsLoading() {
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Loading site details...</p>
    </div>
  )
}
