"use client"

import type React from "react"
import { useState } from "react"
import { Dialog } from "@headlessui/react"
import { format } from "date-fns"

interface Booking {
  id: string
  siteId: string
  clientName: string
  startDate: string
  endDate: string
  salesPerson: string
}

interface CreateReportDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedBooking: Booking | null
}

const CreateReportDialog: React.FC<CreateReportDialogProps> = ({ isOpen, onClose, selectedBooking }) => {
  const [reportDetails, setReportDetails] = useState({
    title: "",
    description: "",
  })

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setReportDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    // Implement report submission logic here
    console.log("Report Details:", reportDetails)
    onClose() // Close the dialog after submission
  }

  if (!selectedBooking) {
    return null // Or display a message indicating no booking is selected
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Create Report</Dialog.Title>

          {/* Booking Information */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <div className="text-base text-gray-700 space-y-1">
              <div>
                <span className="font-semibold">Site:</span> {selectedBooking.siteId}
              </div>
              <div>
                <span className="font-semibold">Client:</span> {selectedBooking.clientName}
              </div>
              <div>
                <span className="font-semibold">Booking:</span> {formatDate(selectedBooking.startDate)} -{" "}
                {formatDate(selectedBooking.endDate)}
              </div>
              <div>
                <span className="font-semibold">Sales:</span> {selectedBooking.salesPerson}
              </div>
            </div>
          </div>

          {/* Report Details Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={reportDetails.title}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={reportDetails.description}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleSubmit}
            >
              Create Report
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default CreateReportDialog
