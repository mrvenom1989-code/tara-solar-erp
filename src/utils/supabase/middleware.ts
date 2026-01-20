import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Create an initial response
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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request cookies (for immediate access)
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          
          // Update the response cookies (to persist in browser)
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refresh Session (This actually writes the new cookies if needed)
  const { data: { user } } = await supabase.auth.getUser()

  // 4. ROUTE PROTECTION LOGIC
  const path = request.nextUrl.pathname

  // A. Protected Routes: If NOT logged in, kick to /login
  // (We check the config matcher in middleware.ts, but explicit checks here are safer)
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/leads') || 
    path.startsWith('/installations') ||
    path.startsWith('/inventory') ||
    path.startsWith('/documents') ||
    path.startsWith('/schedule') ||
    path.startsWith('/teams')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Add ?next=... to redirect back after login
    url.searchParams.set('next', path) 
    return NextResponse.redirect(url)
  }

  // B. Auth Routes: If ALREADY logged in, kick to /dashboard
  if ((path === '/login' || path === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}