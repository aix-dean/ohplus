"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function SalesBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pageSize] = useState(9) // Default page size for bookings
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageSnapshots, setPageSnapshots] = useState<QueryDocumentSnapshot<DocumentData>[]>([])

  const router = useRouter()

  const fetchBookings = useCallback(
    async (direction: "next" | "prev" | "first" = "first", startDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const bookingsRef = collection(db, "bookings") // Assuming 'bookings' is your collection name

        let q

        if (direction === "first") {
          q = query(bookingsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"), limit(pageSize))
        } else if (direction === "next" && startDoc) {
          q = query(
            bookingsRef,
            where("seller_id", "==", user.uid),
            orderBy("created", "desc"),
            startAfter(startDoc),
            limit(pageSize),
          )
        } else if (direction === "prev" && startDoc) {
          const prevPageStartDoc = pageSnapshots[currentPage - 2]
          if (prevPageStartDoc) {
            q = query(
              bookingsRef,
              where("seller_id", "==", user.uid),
              orderBy("created", "desc"),
              startAfter(prevPageStartDoc),
              limit(pageSize),
            )
          } else {
            q = query(bookingsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"), limit(pageSize))
          }
        } else {
          q = query(bookingsRef, where("seller_id", "==", user.uid), orderBy("created", "desc"), limit(pageSize))
        }

        const querySnapshot = await getDocs(q!)
        const fetchedBookings: any[] = []

        const firstVisible = querySnapshot.docs[0] || null
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null
        const hasMoreItems = querySnapshot.docs.length === pageSize

        querySnapshot.forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() })
        })

        setBookings(fetchedBookings)

        if (direction === "first") {
          setLastDoc(lastVisible)
          setCurrentPage(1)
          if (firstVisible) {
            setPageSnapshots([firstVisible])
          }
        } else if (direction === "next") {
          setLastDoc(lastVisible)
          setCurrentPage((prev) => prev + 1)
          if (firstVisible) {
            setPageSnapshots((prev) => [...prev, firstVisible])
          }
        } else if (direction === "prev") {
          setLastDoc(firstVisible)
          setCurrentPage((prev) => prev - 1)
          setPageSnapshots((prev) => prev.slice(0, -1))
        }

        setHasMore(hasMoreItems)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.uid, pageSize, currentPage, pageSnapshots],
  )

  useEffect(() => {
    if (user?.uid) {
      fetchBookings()
    }
  }, [user?.uid, fetchBookings])

  const handleNextPage = () => {
    if (lastDoc && hasMore) {
      fetchBookings("next", lastDoc)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPageSnapshot = pageSnapshots[currentPage - 2]
      if (prevPageSnapshot) {
        fetchBookings("prev", prevPageSnapshot)
      } else {
        fetchBookings("first")
      }
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Bookings</h1>
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">Bookings List</CardTitle>
            </CardHeader>
            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(pageSize)
                    .fill(0)
                    .map((_, i)\
