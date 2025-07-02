"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RegistrationSuccessDialogProps {
  isOpen: boolean
  firstName: string
  onClose: () => void
}

export function RegistrationSuccessDialog({ isOpen, firstName, onClose }: RegistrationSuccessDialogProps) {
  const router = useRouter()

  const handleStart = () => {
    onClose() // Close the dialog
    router.push("/admin/dashboard") // Redirect to dashboard
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center p-8">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold mb-4">Welcome {firstName}!</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image
            src="/placeholder.svg?height=150&width=150"
            alt="Celebration"
            width={150}
            height={150}
            className="mb-4"
          />
          <DialogDescription className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Congratulations!
          </DialogDescription>
          <p className="text-gray-600 dark:text-gray-400">You have successfully registered in OH!PLUS.</p>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6" onClick={handleStart}>
            START
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
