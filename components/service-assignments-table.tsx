"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { db } from "@/firebase"

interface ServiceAssignment {
  id: string
  title: string
  description: string
  company_id: string
  created_at: any // TODO: Fix type
  // Add other properties as needed
}

interface ServiceAssignmentsTableProps {
  onSelectAssignment: (id: string) => void
  companyId?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId }: ServiceAssignmentsTableProps) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        const assignmentsRef = collection(db, "service_assignments")
        let q = query(assignmentsRef, orderBy("created_at", "desc"))

        // Filter by company_id if provided
        if (companyId) {
          q = query(assignmentsRef, where("company_id", "==", companyId), orderBy("created_at", "desc"))
        }

        const snapshot = await getDocs(q)
        const assignmentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceAssignment[]

        setAssignments(assignmentsData)
      } catch (error) {
        console.error("Error fetching assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [companyId])

  if (loading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div>
      {assignments.map((assignment) => (
        <div key={assignment.id} onClick={() => onSelectAssignment(assignment.id)}>
          {assignment.title}
        </div>
      ))}
    </div>
  )
}
