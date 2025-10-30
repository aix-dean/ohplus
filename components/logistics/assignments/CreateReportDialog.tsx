"use client"

import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId: string
}

export function CreateReportDialog({ open, onOpenChange, assignmentId }: CreateReportDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[300px] h-[200px] bg-[#FFF] rounded-[11.983px] p-6">
        {/* X icon in top-right corner */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="flex justify-center ">
          <img
            src="/sa-create-reports.png"
            alt="Create Reports"
            className="w-[50.33px] h-[50.33px] aspect-[50.33/50.33]"
          />
        </div>

        {/* Centered question */}
        <div className="text-center">
          <h2 className="text-[#333] text-center font-inter text-xs font-light leading-none">
            What type of report shall we do?
          </h2>
        </div>

        {/* Selectable options */}
        <div className="space-y-2">
          <button onClick={() => { router.push(`/logistics/reports/create/${assignmentId}?reportType=progress`); onOpenChange(false); }} className="w-[252.248px] h-[28.161px] border-[1.198px] border-solid border-[#C4C4C4] bg-[#FFF] rounded-[5.992px] flex justify-center items-center">
            <span className="text-[#333] text-center font-inter text-xs font-semibold leading-none">Progress Report</span>
          </button>

          <button onClick={() => { router.push(`/logistics/reports/create/${assignmentId}?reportType=completion`); onOpenChange(false); }} className="w-[252.248px] h-[28.161px] border-[1.198px] border-solid border-[#C4C4C4] bg-[#FFF] rounded-[5.992px] flex justify-center items-center">
            <span className="text-[#333] text-center font-inter text-xs font-semibold leading-none">Completion Report</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}