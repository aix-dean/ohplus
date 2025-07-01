"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Phone, MapPin, CalendarDays, User, Star, Users, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { subscriptionService } from "@/lib/subscription-service" // Import subscriptionService

export default function AccountPage() {
  const { user, userData, projectData, subscriptionData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">User data not available. Please log in.</p>
      </div>
    )
  }

  const daysRemaining =
    subscriptionData && subscriptionData.trialEndDate ? subscriptionService.getDaysRemaining(subscriptionData) : 0

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col items-center border-b p-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center sm:flex-row">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                <AvatarImage src={userData.photo_url || "/placeholder-user.jpg"} alt="User Avatar" />
                <AvatarFallback>{userData.display_name ? userData.display_name.charAt(0) : "U"}</AvatarFallback>
              </Avatar>
              <div className="mt-4 text-center sm:ml-6 sm:mt-0 sm:text-left">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {userData.display_name || `${userData.first_name} ${userData.last_name}`}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {userData.type === "admin" ? "Administrator" : "User"}
                </CardDescription>
                <p className="mt-1 text-sm text-gray-500">License Key: {userData.license_key || "N/A"}</p>
              </div>
            </div>
            <div className="mt-6 sm:mt-0">
              <Button variant="outline" onClick={() => router.push("/settings")}>
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Contact Information</h2>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-gray-500" /> {userData.email}
                  </p>
                  <p className="flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-gray-500" /> {userData.phone_number || "N/A"}
                  </p>
                  <p className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-gray-500" /> {userData.location || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Account Details</h2>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-center">
                    <User className="mr-2 h-5 w-5 text-gray-500" /> Gender: {userData.gender || "N/A"}
                  </p>
                  <p className="flex items-center">
                    <CalendarDays className="mr-2 h-5 w-5 text-gray-500" /> Joined:{" "}
                    {userData.created?.toDate().toLocaleDateString() || "N/A"}
                  </p>
                  <p className="flex items-center">
                    <Star className="mr-2 h-5 w-5 text-gray-500" /> Rating: {userData.rating || 0}
                  </p>
                  <p className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-gray-500" /> Followers: {userData.followers || 0}
                  </p>
                  <p className="flex items-center">
                    <Package className="mr-2 h-5 w-5 text-gray-500" /> Products: {userData.products || 0}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Project Information</h2>
              {projectData ? (
                <div className="space-y-3 text-gray-700">
                  <p>
                    <span className="font-medium">Project Name:</span> {projectData.project_name}
                  </p>
                  <p>
                    <span className="font-medium">Company Name:</span> {projectData.company_name || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Company Location:</span> {projectData.company_location || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Company Website:</span>{" "}
                    {projectData.company_website ? (
                      <a
                        href={projectData.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {projectData.company_website}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Social Media:</span>
                    {projectData.social_media && (
                      <span className="ml-2">
                        {projectData.social_media.facebook && (
                          <a
                            href={projectData.social_media.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mr-2"
                          >
                            Facebook
                          </a>
                        )}
                        {projectData.social_media.instagram && (
                          <a
                            href={projectData.social_media.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mr-2"
                          >
                            Instagram
                          </a>
                        )}
                        {projectData.social_media.youtube && (
                          <a
                            href={projectData.social_media.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            YouTube
                          </a>
                        )}
                        {!projectData.social_media.facebook &&
                          !projectData.social_media.instagram &&
                          !projectData.social_media.youtube &&
                          "N/A"}
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No project information available.</p>
              )}
            </div>

            <Separator className="my-8" />

            <div>
              <h2 className="mb-4 text-xl font-semibold text-gray-800">Subscription Status</h2>
              {subscriptionData ? (
                <div className="space-y-3 text-gray-700">
                  <p>
                    <span className="font-medium">Plan:</span> {subscriptionData.planType.toUpperCase()}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {subscriptionData.status.toUpperCase()}
                  </p>
                  {subscriptionData.trialEndDate && (
                    <p>
                      <span className="font-medium">Trial Ends:</span>{" "}
                      {new Date(subscriptionData.trialEndDate).toLocaleDateString()} ({daysRemaining} days remaining)
                    </p>
                  )}
                  <Button onClick={() => router.push("/settings/subscription")} className="mt-4">
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 text-gray-700">
                  <p>No active subscription found.</p>
                  <Button onClick={() => router.push("/settings/subscription")} className="mt-4">
                    Choose a Plan
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
