import type { NextRequest } from "next/server"
import { NextResponse as Response } from "next/server"

export async function middleware(request: NextRequest) {
  // Get auth token from cookies
  const token = request.cookies.get("sb-access-token")?.value

  // Protected routes
  const protectedPaths = ["/dashboard", "/packages"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Auth routes
  const authPaths = ["/auth/login", "/auth/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If accessing protected route without token, redirect to login
  if (isProtectedPath && !token) {
    return Response.redirect(new URL("/auth/login", request.url))
  }

  // If accessing auth route with token, redirect to dashboard
  if (isAuthPath && token) {
    return Response.redirect(new URL("/dashboard", request.url))
  }

  return Response.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
