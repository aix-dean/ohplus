"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { RouteProtection } from "@/components/route-protection"

const data = [
  { month: "Jan", amount: 8500000 },
  { month: "Feb", amount: 9200000 },
  { month: "Mar", amount: 7800000 },
  { month: "Apr", amount: 10100000 },
  { month: "May", amount: 8900000 },
  { month: "Jun", amount: 9500000 },
  { month: "Jul", amount: 11200000 },
  { month: "Aug", amount: 10800000 },
  { month: "Sep", amount: 7600000 },
  { month: "Oct", amount: 9800000 },
  { month: "Nov", amount: 10200000 },
  { month: "Dec", amount: 9300000 },
]

export default function TreasuryPage() {
  return (
    <RouteProtection requiredRoles="treasury">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Treasury Dashboard</h2>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Monthly Treasury Collections</CardTitle>
            <Select defaultValue="2025">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value / 1000000}M`}
                  />
                  <Bar dataKey="amount" fill="#22d3ee" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Best month:</span>
                <br />
                <span className="font-semibold">Jul - 11,200,000</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Worst month:</span>
                <br />
                <span className="font-semibold">Sep - 7,600,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteProtection>
  )
}