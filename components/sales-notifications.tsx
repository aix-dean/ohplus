"use client"

export function SalesNotifications() {
  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Notification</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/30 rounded-full"></div>
          <div className="flex-1 min-w-0">
            <div className="h-2 bg-white/40 rounded-full mb-1"></div>
            <div className="h-2 bg-white/30 rounded-full w-3/4"></div>
          </div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/30 rounded-full"></div>
          <div className="flex-1 min-w-0">
            <div className="h-2 bg-white/40 rounded-full mb-1"></div>
            <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
          </div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
      </div>
    </div>
  )
}
