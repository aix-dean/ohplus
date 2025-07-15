"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { db } from "../firebase"

interface ServiceAssignmentsTableProps {
  onSelectAssignment: (id: string) => void
  companyId?: string
}

export function ServiceAssignmentsTable({ onSelectAssignment, companyId }: ServiceAssignmentsTableProps) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!companyId) return // Don't fetch if no companyId

      try {
        setLoading(true)
        const assignmentsRef = collection(db, "service_assignments")
        const q = query(assignmentsRef, where("company_id", "==", companyId), orderBy("created_at", "desc"))
        const snapshot = await getDocs(q)
        const assignmentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
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
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Service Assignments</h2>
      {assignments.length === 0 ? (
        <div>No assignments found.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Assignment ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.id}</td>
                <td>
                  <button onClick={() => onSelectAssignment(assignment.id)}>Select</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
