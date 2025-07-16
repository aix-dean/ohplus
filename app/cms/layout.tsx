"use client"

import type React from "react"

import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RouteProtectionProps {
  children: React.ReactNode
  requiredRoles: string[]
}

const RouteProtection: React.FC<RouteProtectionProps> = ({ children, requiredRoles }) => {
  const { status, data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role && !requiredRoles.includes(session.user.role)) {
      router.push("/unauthorized")
    }
  }, [status, session, router, requiredRoles])

  if (status === "authenticated" && session?.user?.role && requiredRoles.includes(session.user.role)) {
    return <>{children}</>
  }

  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <RouteProtection requiredRoles={["admin", "cms"]}>{children}</RouteProtection>
        </SessionProvider>
      </body>
    </html>
  )
}
