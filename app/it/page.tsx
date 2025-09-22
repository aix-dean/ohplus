"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, User } from "lucide-react"
import { RouteProtection } from "@/components/route-protection"

export default function ITPage() {
  return (
    <RouteProtection requiredRoles="it">
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">IT Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Card */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today 12, Sep</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">RR0932-</span>
                  <span className="text-sm text-gray-600">Start Date</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">SA0512-</span>
                  <span className="text-sm text-gray-600">Deadline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-pink-400 rounded"></div>
                  <span className="text-sm font-medium">NAN305-</span>
                  <span className="text-sm text-gray-600">Yearly Maintenan..</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm text-gray-600">Attend Supplier's Expo @.....</span>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">13, Sep</h3>
                <p className="text-sm text-gray-500 text-center py-4">No events for this day.</p>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">14, Sep</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-pink-400 rounded"></div>
                  <span className="text-sm font-medium">NAN305-</span>
                  <span className="text-sm text-gray-600">Yearly Maintenan..</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Users Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sales</span>
                    <span className="text-sm font-medium">4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Logistics</span>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Treasury</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Business Dev.</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admin</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Soft Admin (I.T.)</span>
                    <span className="text-sm font-medium">1</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-gray-900 mb-2">9</div>
                  <div className="text-sm text-gray-600">Total users</div>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                <Plus className="w-4 h-4 mr-2" />
                Add Teammates
              </Button>
            </CardContent>
          </Card>

          {/* User Activity Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">User Activity</CardTitle>
              <Select defaultValue="last7days">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">last 7 days</SelectItem>
                  <SelectItem value="last30days">last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sales</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Logistics</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Treasury</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Business Dev.</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Admin</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "80%" }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Soft Admin (I.T.)</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-4">
                  <span>Hours</span>
                  <div className="flex gap-8">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Devices Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Total LED Screens</div>
                  <div className="text-2xl font-bold">4</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Online</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Offline</span>
                      <span className="font-medium">1</span>
                    </div>
                  </div>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${75 * 2.51} ${25 * 2.51}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">75%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-gray-600">Offline</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Integration</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-gray-600 text-center">Coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </RouteProtection>
  )
}
