import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Delegate to the unified session updater
  return await updateSession(request)
}

export const config = {
  matcher: [
    // 🔒 PROTECTED ROUTES
    '/dashboard/:path*',
    '/leads/:path*',
    '/installations/:path*',
    '/inventory/:path*',
    '/documents/:path*',
    '/users/:path*',
    '/schedule/:path*',
    '/reports/:path*',
    '/teams/:path*',
    
    // ⚙️ AUTH ROUTES (To redirect logged-in users away from login)
    '/login',
    '/signup',
  ],
}