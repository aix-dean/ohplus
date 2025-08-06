"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title?: string
  description?: string
  itemName?: string
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isDeleting) return

    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error("Error during deletion:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    onClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isDeleting) {
      onClose()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || (
              itemName ? (
                <>
                  Are you sure you want to delete <span className="font-medium">{itemName}</span>?
                  <br />
                  This action will move the item to trash and it won't be visible in your inventory list.
                </>
              ) : (
                "This action will remove the item from your dashboard."
              )
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
