"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export interface LogisticsNotification {
  id: string
  type: string
  title: string
  description: string
  department_to: string
  uid_to: string
  company_id: string
  department_from: string
  viewed: boolean
  navigate_to: string
  created: any
}

export function useLogisticsNotifications() {
  const [notifications, setNotifications] = useState<LogisticsNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()
console.log(user.company_id)
  useEffect(() => {
    if (!user?.company_id) {
      setLoading(false)
      return
    }
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("company_id", "==", user.company_id),
      where("department_to", "==", "Logistics"),
      orderBy("created", "desc"),
      limit(10),
    )

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList: LogisticsNotification[] = []
        let unreadCounter = 0

        snapshot.forEach((doc) => {
          const data = doc.data()
          const notification: LogisticsNotification = {
            id: doc.id,
            type: data.type || "",
            title: data.title || "",
            description: data.description || "",
            department_to: data.department_to || "",
            uid_to: data.uid_to || "",
            company_id: data.company_id || "",
            department_from: data.department_from || "",
            viewed: data.viewed || false,
            navigate_to: data.navigate_to || "",
            created: data.created,
          }

          notificationsList.push(notification)

          if (!notification.viewed && (!notification.uid_to || notification.uid_to === user.uid)) {
            unreadCounter++
          }
        })

        setNotifications(notificationsList)
        setUnreadCount(unreadCounter)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user?.company_id, user?.uid])

  return {
    notifications,
    loading,
    unreadCount,
  }
}
