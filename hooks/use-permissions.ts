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
  const { user, userData, loading: authLoading } = useAuth()
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchUserRoles() {
      if (authLoading) {
        // Wait for auth to load
        return
      }
      if (!user || !userData) {
        setUserRoles([])
        setLoading(false)
        return
      }

      try {
        // Assuming userData.role is already available and is the primary role
        // If you have multiple roles from a service, use getUserRoles
        const rolesFromService = await getUserRoles(user.uid) // Fetch roles from service
        const combinedRoles = userData.role ? [...new Set([userData.role, ...rolesFromService])] : rolesFromService
        setUserRoles(combinedRoles)
      } catch (error) {
        console.error("Error fetching user roles:", error)
        setUserRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [user, userData, authLoading])

  return { userRoles, loading }
}

export function useIsAdmin() {
  const { userRoles, loading } = useUserRoles()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    if (!loading) {
      setIsAdmin(userRoles.includes("admin") || userRoles.includes("Admin")) // Check for both lowercase and uppercase 'Admin'
    }
  }, [userRoles, loading])

  return { isAdmin, loading }
}
