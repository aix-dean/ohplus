"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getTeams, createTeam, updateTeam } from "@/lib/teams-service"
import type { Team } from "@/lib/types/team"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

const imgMagnifyingGlass2 = "http://localhost:3845/assets/87240337af8d03b498dfc56870ac33cc3a3bd565.png";
const imgDots = "/icons/dots.svg";
const imgView = "/icons/listview.png";
const imgGrid = "/icons/cardview.png";

export default function TeamsPage() {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<string>("")
  const [formData, setFormData] = useState({
    crewName: "",
    crewHead: "",
    contactNumber: ""
  })
  const [isCreating, setIsCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const fetchTeams = async () => {
      if (!userData?.company_id) {
        setLoading(false)
        return
      }

      try {
        const data = await getTeams(userData.company_id)
        setTeams(data)
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userData?.company_id) {
      fetchTeams()
    }
  }, [userData?.company_id])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen && !(event.target as Element).closest('.dropdown-menu')) {
        setMenuOpen(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.leaderName && team.leaderName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-white flex items-center justify-center">
        <div>Loading teams...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-700">
            Crew and Personnel
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`w-6 h-6 ${viewMode === 'list' ? '' : 'opacity-30'}`}
              >
                <img alt="List view" src={imgView} className="w-full h-full" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 ${viewMode === 'grid' ? '' : 'opacity-30'}`}
              >
                <img alt="Grid view" src={imgGrid} className="w-full h-full" />
              </button>
            </div>
            <button
              onClick={() => {
                setEditingTeam(null)
                setFormData({ crewName: "", crewHead: "", contactNumber: "" })
                setSelectedAvatar("")
                setIsAddTeamDialogOpen(true)
              }}
              className="bg-white border border-gray-400 rounded-lg px-4 py-2 text-sm md:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Add New Team
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 w-full max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-30">
              <img alt="" src={imgMagnifyingGlass2} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Team Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-lg p-4 hover:shadow-2xl transition-shadow cursor-pointer min-h-[360px] shadow-lg"
              onClick={(e) => {
                // Prevent navigation if clicking on dropdown menu
                if (!(e.target as Element).closest('.dropdown-menu')) {
                  router.push(`/logistics/teams/${team.id}`)
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-base md:text-lg font-bold text-gray-700 truncate">
                  {team.name}
                </h3>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(menuOpen === team.id ? null : team.id)
                    }}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-5 h-5">
                      <img alt="" src={imgDots} className="w-full h-full" />
                    </div>
                  </button>

                  {menuOpen === team.id && (
                      <div className="dropdown-menu absolute right-0 top-full z-10 w-32 bg-white border border-gray-400 shadow-lg">
                      <button
                        onClick={() => {
                          // Handle edit
                          setEditingTeam(team)
                          setFormData({
                            crewName: team.name,
                            crewHead: team.leaderName || "",
                            contactNumber: team.contactNumber || ""
                          })
                          // Extract avatar from description
                          const avatarMatch = team.description?.match(/\|avatar:(person\d+\.svg)/)
                          setSelectedAvatar(avatarMatch ? avatarMatch[1] : "")
                          setIsAddTeamDialogOpen(true)
                          setMenuOpen(null)
                        }}
                        className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <div className="border-t border-gray-200"></div>
                      <button
                        onClick={async () => {
                          try {
                            await updateTeam(team.id, { deleted: true } as any, userData?.company_id || undefined)
                            // Refresh teams list
                            const updatedTeams = await getTeams(userData?.company_id || undefined)
                            setTeams(updatedTeams)
                            setMenuOpen(null)
                            toast({
                              title: "Team deleted",
                              description: "The team has been successfully deleted.",
                            })
                          } catch (error) {
                            console.error('Error deleting team:', error)
                            alert('Failed to delete team. Please try again.')
                          }
                        }}
                        className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-md"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center mb-2">
                <div className="w-full max-w-48 h-48 sm:max-w-52 sm:h-52 bg-transparent flex items-center justify-center overflow-hidden">
                  {(() => {
                    const avatarMatch = team.description?.match(/\|avatar:(person\d+\.svg)/)
                    const avatar = avatarMatch ? avatarMatch[1] : null
                    return avatar ? (
                      <img
                        src={`/icons/${avatar}`}
                        alt={`${team.name} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl text-gray-500 font-bold">
                        {team.name.charAt(0)}
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div className="space-y-0">
                <p className="text-base font-semibold text-gray-700 truncate">
                  {team.leaderName || 'No Leader'}
                </p>
                <p className="text-base text-gray-600">
                  {team.contactNumber || 'N/A'}
                </p>
                <p className="text-base text-gray-600">
                  Team Head
                </p>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Table Header - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center space-x-8 flex-1">
                <div className="text-sm font-semibold text-gray-700 text-left min-w-0 flex-1">Crew Name</div>
                <div className="text-sm font-semibold text-gray-700 text-left min-w-0 flex-1">Crew Head</div>
                <div className="text-sm font-semibold text-gray-700 text-left min-w-0 flex-1">Contact Number</div>
              </div>
              <div className="w-16 text-center text-sm font-semibold text-gray-700">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {paginatedTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    // Prevent navigation if clicking on dropdown menu
                    if (!(e.target as Element).closest('.dropdown-menu')) {
                      router.push(`/logistics/teams/${team.id}`)
                    }
                  }}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Head: {team.leaderName || 'No Leader'}</p>
                        <p className="text-sm text-gray-600">Contact: {team.contactNumber || 'N/A'}</p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(menuOpen === team.id ? null : team.id)
                          }}
                          className="opacity-50 hover:opacity-100 transition-opacity p-2"
                        >
                          <div className="w-4 h-4">
                            <img alt="" src={imgDots} className="w-full h-full" />
                          </div>
                        </button>

                        {menuOpen === team.id && (
                          <div className="dropdown-menu absolute right-0 top-full z-10 w-32 bg-white border border-gray-400 rounded-md shadow-lg">
                            <button
                              onClick={() => {
                                setEditingTeam(team)
                                setFormData({
                                  crewName: team.name,
                                  crewHead: team.leaderName || "",
                                  contactNumber: team.contactNumber || ""
                                })
                                const avatarMatch = team.description?.match(/\|avatar:(person\d+\.svg)/)
                                setSelectedAvatar(avatarMatch ? avatarMatch[1] : "")
                                setIsAddTeamDialogOpen(true)
                                setMenuOpen(null)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                            >
                              Edit
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={async () => {
                                try {
                                  await updateTeam(team.id, { deleted: true } as any, userData?.company_id || undefined)
                                  const updatedTeams = await getTeams(userData?.company_id || undefined)
                                  setTeams(updatedTeams)
                                  setMenuOpen(null)
                                  toast({
                                    title: "Team deleted",
                                    description: "The team has been successfully deleted.",
                                  })
                                } catch (error) {
                                  console.error('Error deleting team:', error)
                                  alert('Failed to delete team. Please try again.')
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-md"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-8 flex-1">
                      <div className="text-sm text-gray-700 text-left min-w-0 flex-1">{team.name}</div>
                      <div className="text-sm text-gray-700 text-left min-w-0 flex-1">{team.leaderName || 'No Leader'}</div>
                      <div className="text-sm text-gray-700 text-left min-w-0 flex-1">{team.contactNumber || 'N/A'}</div>
                    </div>
                    <div className="w-16 flex justify-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === team.id ? null : team.id)
                        }}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <div className="w-4 h-4">
                          <img alt="" src={imgDots} className="w-full h-full" />
                        </div>
                      </button>

                      {menuOpen === team.id && (
                        <div className="dropdown-menu absolute left-0 top-full z-10 w-32 bg-white border border-gray-400 rounded-md shadow-lg">
                          <button
                            onClick={() => {
                              setEditingTeam(team)
                              setFormData({
                                crewName: team.name,
                                crewHead: team.leaderName || "",
                                contactNumber: team.contactNumber || ""
                              })
                              const avatarMatch = team.description?.match(/\|avatar:(person\d+\.svg)/)
                              setSelectedAvatar(avatarMatch ? avatarMatch[1] : "")
                              setIsAddTeamDialogOpen(true)
                              setMenuOpen(null)
                            }}
                            className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md"
                          >
                            Edit
                          </button>
                          <div className="border-t border-gray-200"></div>
                          <button
                            onClick={async () => {
                              try {
                                await updateTeam(team.id, { deleted: true } as any, userData?.company_id || undefined)
                                const updatedTeams = await getTeams(userData?.company_id || undefined)
                                setTeams(updatedTeams)
                                setMenuOpen(null)
                                toast({
                                  title: "Team deleted",
                                  description: "The team has been successfully deleted.",
                                })
                              } catch (error) {
                                console.error('Error deleting team:', error)
                                alert('Failed to delete team. Please try again.')
                              }
                            }}
                            className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-md"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredTeams.length > itemsPerPage && (
          <div className="flex justify-end mt-4">
            <Pagination
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={paginatedTeams.length}
              totalOverall={filteredTeams.length}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              hasMore={currentPage < totalPages}
            />
          </div>
        )}

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No teams found</p>
          </div>
        )}
      </div>

      {/* Add Team Dialog */}
      <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
        <DialogContent className="sm:max-w-[386px] h-[442px] p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-800">
                {editingTeam ? 'Edit Team' : '+Add a Team'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Form Fields */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <label className="w-24 text-sm font-semibold text-gray-700">Crew Name:</label>
                  <input
                    type="text"
                    placeholder="Crew Name"
                    value={formData.crewName}
                    onChange={(e) => setFormData(prev => ({ ...prev, crewName: e.target.value }))}
                    className="flex-1 h-5 px-2 py-1 text-sm text-black placeholder:text-gray-400 border border-gray-400 rounded focus:outline-none"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-24 text-sm font-semibold text-gray-700">Crew Head:</label>
                  <input
                    type="text"
                    placeholder="Crew Head"
                    value={formData.crewHead}
                    onChange={(e) => setFormData(prev => ({ ...prev, crewHead: e.target.value }))}
                    className="flex-1 h-5 px-2 py-1 text-sm text-black placeholder:text-gray-400 border border-gray-400 rounded focus:outline-none"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-24 text-sm font-semibold text-gray-700">Contact #:</label>
                  <input
                    type="tel"
                    placeholder="Contact #"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, '')
                      setFormData(prev => ({ ...prev, contactNumber: numericValue }))
                    }}
                    className="flex-1 h-5 px-2 py-1 text-sm text-black placeholder:text-gray-400 border border-gray-400 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Select an avatar:</p>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setSelectedAvatar(`person${i + 1}.svg`)}
                      className={`w-16 h-16 rounded-full border-2 overflow-hidden ${
                        selectedAvatar === `person${i + 1}.svg`
                          ? 'border-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={`/icons/person${i + 1}.svg`}
                        alt={`Avatar ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setIsAddTeamDialogOpen(false)
                    setEditingTeam(null)
                    setFormData({ crewName: "", crewHead: "", contactNumber: "" })
                    setSelectedAvatar("")
                  }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-400 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!user?.uid || !userData?.company_id) {
                      alert("Authentication required")
                      return
                    }

                    if (!formData.crewName.trim()) {
                      alert("Team name is required")
                      return
                    }

                    setIsCreating(true)
                    try {
                      console.log('Saving team - editingTeam:', editingTeam)
                      if (editingTeam) {
                        // Update existing team
                        console.log('Updating team:', editingTeam.id)
                        const updateData = {
                          name: formData.crewName,
                          description: `Team led by ${formData.crewHead || 'TBD'}${selectedAvatar ? `|avatar:${selectedAvatar}` : ''}`,
                          leaderName: formData.crewHead,
                          contactNumber: formData.contactNumber,
                        }
                        await updateTeam(editingTeam.id, updateData as any, userData.company_id)

                        toast({
                          title: "Team updated",
                          description: "The team has been successfully updated.",
                        })
                      } else {
                        console.log('Creating new team')
                        // Create new team
                        const teamData = {
                          name: formData.crewName,
                          description: `Team led by ${formData.crewHead || 'TBD'}${selectedAvatar ? `|avatar:${selectedAvatar}` : ''}`,
                          teamType: "operations" as const,
                          leaderName: formData.crewHead,
                          specializations: [],
                          location: "TBD",
                          contactNumber: formData.contactNumber,
                          company_id: userData.company_id,
                        }

                        await createTeam(teamData, user.uid)

                        toast({
                          title: "Team created",
                          description: "The team has been successfully created.",
                        })
                      }

                      // Refresh teams list
                      const updatedTeams = await getTeams(userData.company_id)
                      setTeams(updatedTeams)

                      setIsAddTeamDialogOpen(false)
                      setEditingTeam(null)
                      setFormData({ crewName: "", crewHead: "", contactNumber: "" })
                      setSelectedAvatar("")
                    } catch (error) {
                      console.error(`Error ${editingTeam ? 'updating' : 'creating'} team:`, error)
                      alert(`Failed to ${editingTeam ? 'update' : 'create'} team. Please try again.`)
                    } finally {
                      setIsCreating(false)
                    }
                  }}
                  disabled={isCreating}
                  className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

