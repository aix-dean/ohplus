"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getTeams, updateTeam } from "@/lib/teams-service"
import type { Team } from "@/lib/types/team"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const imgImage8 = "http://localhost:3845/assets/226c0b08d8b83741821f8b2a662aa5ef1fbf1532.png";

export default function TeamDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id || !userData?.company_id) {
        setLoading(false)
        return
      }

      try {
        const teams = await getTeams(userData.company_id)
        const foundTeam = teams.find(t => t.id === id)
        setTeam(foundTeam || null)
      } catch (error) {
        console.error("Error fetching team:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [id, userData?.company_id])

  const handleDelete = async () => {
    if (!team || !userData?.company_id) return

    try {
      await updateTeam(team.id, { deleted: true } as any, userData.company_id)
      toast({
        title: "Team deleted",
        description: "The team has been successfully deleted.",
      })
      router.push('/logistics/teams')
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Failed to delete team. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-white flex items-center justify-center">
        <div>Loading team details...</div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="relative w-full h-screen bg-white flex items-center justify-center">
        <div>Team not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8" style={{ marginTop: '-32px' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/logistics/teams')}
          className="text-gray-600 hover:text-gray-800 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-700">
          View Team's History
        </h1>
      </div>

      <div className="flex justify-center">
        <div className="max-w-4xl w-full">

        {/* Team Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-2xl">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {(() => {
                const avatarMatch = team.description?.match(/\|avatar:(person\d+\.svg)/)
                const avatar = avatarMatch ? avatarMatch[1] : null
                return avatar ? (
                  <img
                    src={`/icons/${avatar}`}
                    alt={`${team.name} avatar`}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-2xl text-gray-500 font-bold">
                    {team.name.charAt(0)}
                  </span>
                )
              })()}
            </div>

            {/* Team Details */}
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-semibold text-gray-700">Crew Name:</p>
                  <p className="font-semibold text-gray-700">Crew Head:</p>
                  <p className="font-semibold text-gray-700">Contact Number:</p>
                  <p className="font-semibold text-gray-700">Added On:</p>
                </div>
                <div>
                  <p className="text-gray-700">{team.name}</p>
                  <p className="text-gray-700">{team.leaderName || 'No Leader'}</p>
                  <p className="text-gray-700">{team.contactNumber || 'N/A'}</p>
                  <p className="text-gray-700">{new Date(team.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-50">
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-white border border-gray-400 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Assignments and Reports Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Service Assignments */}
          <div>
            <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg">
              <h2 className="font-semibold text-sm">Assigned Service Assignments</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-3 font-semibold text-sm text-gray-700">
                <div>Date Issued</div>
                <div>Service Assignment</div>
              </div>
              <div className="space-y-2">
                {/* Sample data - in real app this would come from API */}
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                  <div className="text-sm text-gray-600">October 3, 2025</div>
                  <div className="text-sm text-blue-600 underline cursor-pointer">SA#00524.pdf</div>
                </div>
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                  <div className="text-sm text-gray-600">October 3, 2025</div>
                  <div className="text-sm text-blue-600 underline cursor-pointer">SA#00524.pdf</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted Reports */}
          <div>
            <div className="bg-blue-700 text-white px-4 py-3 rounded-t-lg">
              <h2 className="font-semibold text-sm">Submitted Reports</h2>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-3 font-semibold text-sm text-gray-700">
                <div>Date Submitted</div>
                <div>Reports</div>
              </div>
              <div className="space-y-2">
                {/* Sample data - in real app this would come from API */}
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                  <div className="text-sm text-gray-600">October 3, 2025</div>
                  <div className="text-sm text-blue-600 underline cursor-pointer">RPT#00524.pdf</div>
                </div>
                <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100">
                  <div className="text-sm text-gray-600">October 3, 2025</div>
                  <div className="text-sm text-blue-600 underline cursor-pointer">RPT#00524.pdf</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}