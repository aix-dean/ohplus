import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old CMS content routes to new details routes
  if (pathname.startsWith("/cms/content/edit/")) {
    const id = pathname.split("/").pop()
    if (id) {
      return NextResponse.redirect(new URL(`/cms/details/${id}`, request.url))
    }
  }

  if (pathname.startsWith("/cms/content/") && pathname !== "/cms/content") {
    const id = pathname.split("/").pop()
    if (id) {
      return NextResponse.redirect(new URL(`/cms/details/${id}`, request.url))
    }
  }

  if (pathname === "/cms/content") {
    return NextResponse.redirect(new URL("/cms/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/cms/content/:path*"],
}
