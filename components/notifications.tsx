"use client"

import { useNotifications, NotificationConfig } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface NotificationsProps {
  config: NotificationConfig
}

export function Notifications({ config }: NotificationsProps) {
  const { notifications, loading, unreadCount } = useNotifications(config)
  const router = useRouter()

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.viewed) {
        await updateDoc(doc(db, "notifications", notification.id), {
          viewed: true,
        })
      }

      // Navigate to the specified URL
      if (notification.navigate_to) {
        router.push(notification.navigate_to)
      }
    } catch (error) {
      console.error("Error updating notification:", error)
      // Still navigate even if update fails
      if (notification.navigate_to) {
        router.push(notification.navigate_to)
      }
    }
  }

  const handleSeeAll = () => {
    router.push(config.notificationsPath)
  }

  const getGradientClasses = () => {
    switch (config.colorScheme) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-400 to-blue-500'
      case 'sky':
        return 'bg-gradient-to-br from-sky-300 to-sky-400'
      default:
        return 'bg-gradient-to-br from-blue-400 to-blue-500'
    }
  }

  const getAvatarBgClass = () => {
    switch (config.colorScheme) {
      case 'blue':
        return 'bg-white/30'
      case 'sky':
        return 'bg-white/30'
      default:
        return 'bg-white/30'
    }
  }

  const getBadgeBgClass = () => {
    switch (config.colorScheme) {
      case 'blue':
        return 'bg-white/20'
      case 'sky':
        return 'bg-white/20'
      default:
        return 'bg-white/20'
    }
  }

  if (loading) {
    return (
      <div className={`rounded-lg p-3 text-white ${getGradientClasses()}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Notification</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className={`${getBadgeBgClass()} text-white text-xs`}>
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/30 rounded-full animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-2 bg-white/40 rounded-full mb-1 animate-pulse"></div>
              <div className="h-2 bg-white/30 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-3 text-white ${getGradientClasses()}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Notification</h3>
        {unreadCount > 0 && (
          <Badge variant="secondary" className={`${getBadgeBgClass()} text-white text-xs`}>
            {unreadCount}
          </Badge>
        )}
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-xs text-white/80">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 rounded p-1 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className={`${getAvatarBgClass()} text-white text-xs`}>
                  {notification.department_from?.charAt(0) || "N"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{notification.title}</div>
                <div className="text-xs text-white/80 truncate">{notification.description}</div>
                <div className="text-xs text-white/60">
                  {notification.created && formatDistanceToNow(notification.created.toDate(), { addSuffix: true })}
                </div>
              </div>

              {!notification.viewed && <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end mt-3">
        <button onClick={handleSeeAll} className="text-xs text-white/90 hover:text-white transition-colors">
          See All
        </button>
      </div>
    </div>
  )
}

// Pre-configured components for specific departments
export function SalesNotifications() {
  return <Notifications config={{
    department: "Sales",
    colorScheme: "blue",
    notificationsPath: "/sales/notifications"
  }} />
}

export function LogisticsNotifications() {
  return <Notifications config={{
    department: "Logistics",
    colorScheme: "sky",
    notificationsPath: "/logistics/notifications"
  }} />
}
