"use client"

import { useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ReportTypeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelectReport: (reportType: "progress" | "completion") => void
}

const ReportTypeDialog = ({ isOpen, onClose, onSelectReport }: ReportTypeDialogProps) => {
  const handleProgressReport = useCallback(() => {
    onSelectReport("progress")
    onClose()
  }, [onSelectReport, onClose])

  const handleCompletionReport = useCallback(() => {
    onSelectReport("completion")
    onClose()
  }, [onSelectReport, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="w-[283px] h-[175px] p-0 border-0 bg-transparent shadow-none">
        <div className="w-full h-full relative text-center text-xs text-darkslategray font-inter">
          <div className="absolute top-[-0.17px] left-[0px] rounded-[11.98px] bg-white w-[283px] h-44 shadow-lg" />
          <div className="absolute top-[77.21px] left-[31.69px] leading-[100%] font-light inline-block w-[216.3px] h-[13.8px]">
            What type of report shall we do?
          </div>
          <div className="absolute top-[0.83px] left-[273.46px] text-xl leading-[100%] text-left inline-block w-6 h-[31.2px] [transform:_rotate(46.1deg)] [transform-origin:0_0] cursor-pointer" onClick={onClose}>
            +
          </div>
          <Image
            className="absolute top-[15.83px] left-[112.04px] w-[50.3px] h-[50.3px] object-cover"
            width={50.3}
            height={50.3}
            sizes="100vw"
            alt=""
            src="/icons/Petition.png"
          />
          <div className="absolute top-[96.98px] left-[15.52px] w-[252.2px] h-[28.2px] cursor-pointer" onClick={handleProgressReport}>
            <div className="absolute top-[0px] left-[0px] rounded-[5.99px] bg-white border-silver border-solid border-[1.2px] box-border w-[252.2px] h-[28.2px] hover:bg-gray-50 transition-colors" />
            <div className="absolute top-[8.39px] left-[24.85px] leading-[100%] font-semibold inline-block w-[211.2px] h-[14.4px]">
              Progress Report
            </div>
          </div>
          <div className="absolute top-[131.14px] left-[15.52px] w-[252.2px] h-[28.2px] cursor-pointer" onClick={handleCompletionReport}>
            <div className="absolute top-[0px] left-[0px] rounded-[5.99px] bg-white border-silver border-solid border-[1.2px] box-border w-[252.2px] h-[28.2px] hover:bg-gray-50 transition-colors" />
            <div className="absolute top-[8.39px] left-[24.85px] leading-[100%] font-semibold inline-block w-[211.2px] h-[14.4px]">
              Completion Report
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReportTypeDialog