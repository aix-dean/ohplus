"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/auth-context"
import { hasPermission, getUserRoles } from "../lib/access-management-service"

export function usePermission(permissionName: string, module: string, action: "view" | "create" | "edit" | "delete") {
  const { user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      try {
        const permitted = await hasPermission(user.uid, permissionName, module, action)
        setHasAccess(permitted)
      } catch (error) {
        console.error("Error checking permission:", error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkPermission()
  }, [user, permissionName, module, action])

  return { hasAccess, loading }
}

export function useUserRoles() {
  const { user } = useAuth()
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (!user) {
        setRoles([])
        setLoading(false)
        return
      }

      try {
        const userRoles = await getUserRoles(user.uid)
        setRoles(userRoles)
      } catch (error) {
        console.error("Error fetching user roles:", error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user])

  return { roles, loading }
}

export function useIsAdmin() {
  const { roles, loading } = useUserRoles()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    // This is a simplified check. In a real app, you'd check if the user has the admin role
    // by comparing role IDs or names from your database
    if (!loading) {
      setIsAdmin(roles.some((role) => role === "admin"))
    }
  }, [roles, loading])

  return { isAdmin, loading }
}
