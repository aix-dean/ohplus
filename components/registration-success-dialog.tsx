"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RegistrationSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  firstName: string
}

export default function RegistrationSuccessDialog({ isOpen, onClose, firstName }: RegistrationSuccessDialogProps) {
  const router = useRouter()

  const handleStart = () => {
    onClose()
    router.push("/admin/dashboard")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col items-center justify-center p-8 text-center sm:max-w-md">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-4xl font-bold">Welcome {firstName}!</DialogTitle>
          <Image
            src="/placeholder.svg?height=150&width=150"
            alt="Celebration illustration"
            width={150}
            height={150}
            className="mx-auto"
          />
          <DialogDescription className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Congratulations!
          </DialogDescription>
          <p className="text-gray-600 dark:text-gray-400">You have successfully registered in OH!PLUS.</p>
        </DialogHeader>
        <Button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleStart}>
          START
        </Button>
      </DialogContent>
    </Dialog>
  )
}
