"use client"

import { DateRangePicker } from "@/components/ui/date-range-picker"

export default function LogisticsWeatherPage() {
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">News and Weather</h1>
        <div>
          <DateRangePicker placeholder="Select date range" />
        </div>
      </div>


      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Do I need to roll down today? */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Do I need to roll down today?</h2>
          <div className="flex items-center mb-4">
            <div className="w-9 h-9 bg-gray-200 rounded-full mr-3"></div>
            <span className="text-lg text-gray-600">Oscar</span>
          </div>
          <div className="text-6xl font-bold text-green-500 text-center mb-6">No</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Rolldown Parameters</h3>
          <div className="space-y-4">
            {[
              { title: 'Typhoon Strength', desc: 'Stronger than 65 kph' },
              { title: 'City Ordinance', desc: 'On cities that covers my sites' },
              { title: 'Typhoon Location', desc: "Typhoon's trajectory will hit my sites" },
              { title: 'Angle of Direction', desc: 'On cities that covers my sites' },
              { title: 'Typhoon Speed', desc: 'Slower than 20kph' },
            ].map((param, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">{param.title}</h4>
                <p className="text-sm text-gray-600">{param.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Create Service Assignment
            </button>
          </div>
        </div>

        {/* Second Column Container */}
        <div className="space-y-6 lg:col-span-2">
          {/* Weekly Weather Forecast */}
          <div className="bg-white rounded-2xl shadow-lg p-6">

            <div className="grid grid-cols-7 gap-4 overflow-x-auto">
              {[
                { day: 'Sun', temp: '30°', icon: 'sun' },
                { day: 'Mon', temp: '28°', icon: 'rain' },
                { day: 'Tue', temp: '25°', icon: 'rain' },
                { day: 'Wed', temp: '17°', icon: 'rain' },
                { day: 'Thu', temp: '16°', icon: 'cloud' },
                { day: 'Fri', temp: '16°', icon: 'cloud' },
                { day: 'Sat', temp: '25°', icon: 'sun' },
              ].map((item, index) => (
                <div key={index} className="text-center min-w-[80px]">
                  <div className="text-sm font-medium text-gray-600 mb-2">{item.day}</div>
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl">{item.icon === 'sun' ? '☀️' : item.icon === 'rain' ? '🌧️' : '☁️'}</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800">{item.temp}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
          {/* Publikong Impormasyon */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex-1 aspect-square">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Publikong Impormasyon</h3>
            <div className="relative">
              <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">▶️</span>
                </div>
              </div>
            </div>
          </div>

          {/* OOH News for you */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">OOH News for you</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((news) => (
                <div key={news} className="border border-gray-200 rounded-lg p-4 flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">News 001</h4>
                    <p className="text-sm text-gray-600">Date</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>

    </div>
  )
}
