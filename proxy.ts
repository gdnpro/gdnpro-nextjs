import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

const PROTECTED_ROUTES = ["/dashboard"]
const AUTH_ROUTES = ["/auth/login", "/auth/register"]

function isProtectedRoute(path: string) {
  return PROTECTED_ROUTES.includes(path)
}

function isAuthRoute(path: string) {
  return AUTH_ROUTES.includes(path)
}

function hasSupabaseSession(request: NextRequest) {
  const cookies = request.cookies.getAll()
  return cookies.some((c) => c.name.includes("sb-") && c.name.includes("-auth-token"))
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = await updateSession(request)
  const logged = hasSupabaseSession(request)

  if (isAuthRoute(path) && logged) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  if (isProtectedRoute(path) && !logged) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
