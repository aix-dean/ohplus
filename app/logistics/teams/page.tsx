"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Users, Plus, Search, Edit, Trash2, UserCheck, MapPin, Phone, Mail, ChevronDown, List, Grid3X3, MoreHorizontal } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { TeamFormDialog } from "@/components/team-form-dialog"
import { getTeams, createTeam, updateTeam, deleteTeam, updateTeamStatus } from "@/lib/teams-service"
import type { Team, CreateTeamData } from "@/lib/types/team"

// Header Component
function Component5({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="absolute bottom-0 left-0 right-[15.23%] top-0 bg-white">
        <div className="absolute bottom-0 left-[84.77%] right-0 top-0 bg-blue-300/50" />
        <button className="absolute inset-[52.54%_90.45%_17.8%_1.95%] cursor-pointer">
          <p className="absolute inset-[52.54%_92.27%_20.34%_1.95%] font-black text-[16px] text-white not-italic leading-none">
            Logistics
          </p>
          <ChevronDown className="absolute left-[8.18%] right-[90.45%] top-[31px] w-4 h-4" />
        </button>
        <p className="absolute inset-[54.24%_18.28%_25.42%_51.33%] font-normal text-[12px] text-right text-white not-italic leading-none">
          10:00 am | Sep 23, 2025
        </p>
        <img src="/placeholder-user.jpg" alt="User" className="absolute left-[94.53%] right-[3.2%] top-[23px] w-[90px] h-[90px]" />
        <img src="/icons/sms.png" alt="SMS" className="absolute left-[90.86%] right-[7.03%] top-[24px] w-[90px] h-[90px]" />
        <img src="/icons/notification.png" alt="Notification" className="absolute left-[87.11%] right-[10.86%] top-[24px] w-[90px] h-[90px]" />
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const { userData } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [typeFilter, setTypeFilter] = useState<
    "all" | "operations" | "maintenance" | "installation" | "delivery" | "support"
  >("all")

  // Dialog states
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    filterTeams()
  }, [teams, searchTerm, statusFilter, typeFilter])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const teamsData = await getTeams(userData?.company_id || undefined)
      setTeams(teamsData)
    } catch (error) {
      console.error("Error loading teams:", error)
      toast.error("Failed to load teams")
    } finally {
      setLoading(false)
    }
  }

  const filterTeams = () => {
    let filtered = teams

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.leaderName?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((team) => team.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((team) => team.teamType === typeFilter)
    }

    setFilteredTeams(filtered)
  }

  const handleCreateTeam = async (data: CreateTeamData) => {
    if (!userData?.uid) {
      toast.error("User not authenticated")
      return
    }

    try {
      setFormLoading(true)
      await createTeam(data, userData.uid)
      toast.success("Team created successfully")
      setIsFormDialogOpen(false)
      loadTeams()
    } catch (error) {
      console.error("Error creating team:", error)
      toast.error("Failed to create team")
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateTeam = async (data: CreateTeamData) => {
    if (!editingTeam) return

    try {
      setFormLoading(true)
      await updateTeam(editingTeam.id, data, userData?.company_id || undefined)
      toast.success("Team updated successfully")
      setIsFormDialogOpen(false)
      setEditingTeam(null)
      loadTeams()
    } catch (error) {
      console.error("Error updating team:", error)
      toast.error("Failed to update team")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return

    try {
      setDeleteLoading(true)
      await deleteTeam(teamToDelete.id, userData?.company_id || undefined)
      toast.success("Team deleted successfully")
      setDeleteDialogOpen(false)
      setTeamToDelete(null)
      loadTeams()
    } catch (error) {
      console.error("Error deleting team:", error)
      toast.error("Failed to delete team")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusToggle = async (team: Team) => {
    try {
      const newStatus = team.status === "active" ? "inactive" : "active"
      await updateTeamStatus(team.id, newStatus, userData?.company_id || undefined)
      toast.success(`Team ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
      loadTeams()
    } catch (error) {
      console.error("Error updating team status:", error)
      toast.error("Failed to update team status")
    }
  }

  const getTeamTypeColor = (type: string) => {
    const colors = {
      operations: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      installation: "bg-green-100 text-green-800",
      delivery: "bg-purple-100 text-purple-800",
      support: "bg-orange-100 text-orange-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusColor = (status: string) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading teams...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-white">
      <Component5 className="absolute h-[59px] left-0 top-0 w-full" />

      {/* Sidebar */}
      <div className="absolute bg-blue-300/50 h-[661px] left-0 top-[59px] w-[220px]">
        <div className="absolute bg-white/70 border-2 border-white rounded-[12.5px] h-[161.25px] left-[12.5px] top-[12.5px] w-[195px]">
          <p className="absolute font-bold text-xs text-gray-700 left-[22.5px] top-[21.5px] w-[123.75px]">Updates Center</p>
          <div className="absolute bg-white/80 rounded-[10px] shadow h-[31.875px] left-[22.5px] top-[42.63px] w-[169.375px]"></div>
          <div className="absolute bg-white/80 rounded-[10px] shadow h-[31.875px] left-[22.5px] top-[77.63px] w-[169.375px]"></div>
          <div className="absolute bg-white/80 rounded-[10px] shadow h-[31.875px] left-[22.5px] top-[112.63px] w-[169.375px]"></div>
        </div>

        <div className="absolute h-[247.5px] left-[13px] top-[183px] w-[195px]">
          <div className="absolute bg-white/70 border-2 border-white rounded-[12.5px] inset-0">
            <p className="absolute font-bold text-xs text-gray-700 left-[65.06%] top-[3.03%]">To Go →</p>
            <p className="absolute font-light text-xs text-gray-700 left-[7.05%] top-[90.15%]">To-do-list</p>
            <div className="absolute bg-gray-300 h-[1px] left-[5.13%] right-[5.13%] top-[51.77%]"></div>
            <p className="absolute font-bold text-xs text-gray-700 left-[65.06%] top-[44.19%]">To Do ←</p>
            <p className="absolute font-light text-xs text-gray-700 left-[7.05%] top-[60.86%]">Service Assignments</p>
            <p className="absolute font-light text-xs text-gray-700 left-[7.05%] top-[82.83%] font-bold">Crew and Personnel</p>
            <p className="absolute font-light text-xs text-gray-700 left-[34.62%] top-[75.5%]">News and Weather</p>
            <p className="absolute font-light text-xs text-gray-700 left-[31.41%] top-[68.18%]">Reports</p>
            <p className="absolute font-light text-xs text-gray-700 left-[34.62%] top-[53.53%]">Job Orders</p>
            <p className="absolute font-light text-xs text-gray-700 left-[31.41%] top-[28.28%]">Planner</p>
            <p className="absolute font-light text-xs text-gray-700 left-[31.41%] top-[20.96%]">Bulletin Board</p>
            <p className="absolute font-light text-xs text-gray-700 left-[45.51%] top-[13.64%]">Dashboard</p>
          </div>
        </div>

        <div className="absolute h-[129.375px] left-0 rounded-tl-[12.5px] rounded-tr-[12.5px] top-[531.63px] w-[220px]">
          <img src="/ohliver-mascot.png" alt="Oscar" className="absolute left-[10px] top-[1.88px] w-[125.876px] h-[83.918px]" />
          <p className="absolute font-bold text-xs text-white left-[38.13px] top-[1.88px] w-[123.75px]">Oscar's Intelligence</p>
          <div className="absolute bg-white/20 rounded-[6.25px] h-[41.25px] left-[61.25px] top-[30px] w-[97.5px]"></div>
          <div className="absolute bg-white/20 rounded-[6.25px] h-[8.75px] left-[61.25px] top-[76.25px] w-[97.5px]"></div>
          <ChevronDown className="absolute left-[191.88px] top-[43.13px] w-[25px] h-[25px] rotate-[270deg]" />
          <ChevronDown className="absolute left-[5px] top-[43.13px] w-[25px] h-[25px] rotate-[90deg]" />
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute bg-gray-50 h-[661px] left-[221px] top-[59px] right-0">
        <p className="absolute font-bold text-base text-gray-700 left-[30px] top-[24px] w-[315px]">Crew and Personnel</p>

        <div className="absolute bg-white border border-gray-300 rounded-[15px] h-[22px] left-[30px] top-[54px] w-[257px] flex items-center">
          <Search className="ml-2 w-3 h-3 opacity-30" />
          <Input
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 border-none bg-transparent text-xs text-gray-400 h-4"
          />
        </div>

        <Button
          onClick={() => setIsFormDialogOpen(true)}
          className="absolute bg-white border-2 border-gray-300 rounded-[5px] h-[24px] left-[926px] top-[21px] w-[103px] text-xs font-medium text-gray-700"
        >
          Add New Team
        </Button>

        <List className="absolute left-[958px] top-[59.34px] w-[19.276px] h-[19.276px] opacity-30" />
        <Grid3X3 className="absolute left-[981.49px] top-[55.73px] w-[26.505px] h-[26.505px] opacity-30" />

        <div className="absolute left-[30px] top-[99px] right-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-white rounded-[10px] shadow w-full max-w-[201px] h-[265px] relative">
              <CardContent className="p-4 flex flex-col items-center">
                <img src="/placeholder-user.jpg" alt={team.name} className="w-[150px] h-[150px] rounded mb-4" />
                <p className="font-bold text-xs text-gray-700 mb-1">{team.name}</p>
                <p className="font-semibold text-xs text-gray-700 mb-1">{team.leaderName || 'No Leader'}</p>
                <p className="font-light text-xs text-gray-700 mb-1">{team.location || 'No Location'}</p>
                <p className="font-light text-xs text-gray-700 mb-2">{team.teamType}</p>
                <Badge className={`${getStatusColor(team.status)} text-xs`}>{team.status}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 p-1"
                  onClick={() => {
                    setEditingTeam(team);
                    setIsFormDialogOpen(true);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <TeamFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
        loading={formLoading}
        team={editingTeam}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
