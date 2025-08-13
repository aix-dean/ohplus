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
  const { user, userData } = useAuth()

  useEffect(() => {
    if (!userData?.company_id) {
      console.log("No company_id found in userData:", userData)
      setLoading(false)
      return
    }

    console.log("Setting up notifications query for company_id:", userData.company_id)

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("company_id", "==", userData.company_id),
      where("department_to", "==", "Logistics"),
      orderBy("created", "desc"),
      limit(10),
    )

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        console.log("Notifications snapshot received, docs count:", snapshot.docs.length)
        const notificationsList: LogisticsNotification[] = []
        let unreadCounter = 0

        snapshot.forEach((doc) => {
          const data = doc.data()
          console.log("Notification document:", doc.id, data)

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

          if (!notification.viewed && (!notification.uid_to || notification.uid_to === user?.uid)) {
            unreadCounter++
          }
        })

        console.log("Final notifications list:", notificationsList)
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
  }, [userData, user?.uid]) // Updated dependency array

  return {
    notifications,
    loading,
    unreadCount,
  }
}
