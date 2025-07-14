import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  console.log("Middleware - Processing request:", request.nextUrl.pathname)

  // Log all CMS routes
  if (request.nextUrl.pathname.startsWith("/cms")) {
    console.log("Middleware - CMS route detected:", request.nextUrl.pathname)
  }

  // Check for specific route patterns that might conflict
  if (request.nextUrl.pathname.match(/\/cms\/details\/[^/]+$/)) {
    console.log("Middleware - CMS details route matched:", request.nextUrl.pathname)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
