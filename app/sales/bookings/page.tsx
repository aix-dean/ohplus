// app/sales/bookings/page.tsx

import type React from "react"
import { BookingList } from "./BookingList" // Assuming BookingList is a component that displays bookings

const BookingsPage: React.FC = () => {
  return (
    <div>
      <h1>Bookings</h1>
      <BookingList />
    </div>
  )
}

export default BookingsPage
