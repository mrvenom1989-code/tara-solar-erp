import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// ✅ NEW HELPER: Use this in your page.tsx files instead of supabase.auth.getUser()
export async function getSafeUser() {
    const supabase = await createClient();
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error("No session");
        return user;
    } catch (error) {
        // If the token is invalid, redirect immediately
        redirect('/login');
    }
}