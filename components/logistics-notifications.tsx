"use client"

import { useLogisticsNotifications } from "@/hooks/use-logistics-notifications"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function LogisticsNotifications() {
  const { notifications, loading, unreadCount } = useLogisticsNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    if (notification.navigate_to) {
      router.push(notification.navigate_to)
    }
  }

  const handleSeeAll = () => {
    router.push("/logistics/notifications")
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-300 to-sky-400 rounded-lg p-3 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Notification</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
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

  console.log("Notifications array:", notifications)
  console.log("Notifications count:", notifications.length)

  return (
    <div className="bg-gradient-to-br from-sky-300 to-sky-400 rounded-lg p-3 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Notification</h3>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
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
                <AvatarFallback className="bg-white/30 text-white text-xs">
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
