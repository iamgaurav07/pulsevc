import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  const isLoginPage = pathname === "/login"
  const isPublicPage = pathname === "/"
  const isApiRoute = pathname.startsWith("/api")

  if (isApiRoute) return

  if (!isLoggedIn && !isLoginPage && !isPublicPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(loginUrl)
  }

  if (isLoggedIn && isLoginPage) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin)
    return Response.redirect(dashboardUrl)
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}