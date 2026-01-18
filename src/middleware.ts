import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize Response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Initialize Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Check Auth Status
  // refreshing the session here updates the cookie if needed
  const { data: { user } } = await supabase.auth.getUser()

  // 4. PROTECTED ROUTES LOGIC
  // Since we use the 'matcher' below, we know we are on a protected route.
  // We simply check if the user exists.
  if (!user) {
     return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

// 5. CONFIG
// Only run this middleware on these specific admin paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/installations/:path*',
    '/inventory/:path*',
    '/documents/:path*',
    '/users/:path*',
    '/schedule/:path*', // Added Schedule
    '/reports/:path*',
    '/teams/:path*',    // Added Teams
  ],
}