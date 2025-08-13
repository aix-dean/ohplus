import { PhilippinesWeatherDashboard } from "@/components/philippines-weather-dashboard"

export default function LogisticsWeatherPage() {
  return (
    <div className="flex-1 overflow-auto">
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold">Weather</h1>
          <p className="text-sm text-gray-500">Philippines weather conditions and forecasts</p>
        </div>
      </header>

      <main className="p-4">
        <PhilippinesWeatherDashboard defaultLocation="264885" />
      </main>
    </div>
  )
}
