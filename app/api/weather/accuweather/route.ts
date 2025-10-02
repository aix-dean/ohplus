import { NextRequest, NextResponse } from 'next/server'
import { fetchWeatherForecast } from '@/lib/weather-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationKey = searchParams.get('locationKey') || '264885'

    console.log('AccuWeather API route called with locationKey:', locationKey)

    const weatherData = await fetchWeatherForecast(locationKey)

    console.log('AccuWeather API route returning data:', weatherData ? 'success' : 'null')

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Error in AccuWeather API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}