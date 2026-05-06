// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "your-super-secret-admin-key-change-in-env"
);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add pathname to request headers for root layout to use
  response.headers.set("x-pathname", request.nextUrl.pathname);
  
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    
    // 1. Define all admin routes that DO NOT require a logged-in user
    const publicAdminRoutes = [
      "/admin/login", 
      "/admin/forgot-password",
      "/admin/reset-password"
    ];

    // 2. Allow access if the user is trying to reach a public route
    if (publicAdminRoutes.includes(request.nextUrl.pathname)) {
      return response;
    }

    // 3. Verify token for all other secured admin routes
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return response;
    } catch (error) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};