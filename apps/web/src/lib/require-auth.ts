import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Verifies the Supabase session from the request cookie.
 * Returns the verified userId or a 401 NextResponse if unauthenticated.
 *
 * Usage in a Route Handler:
 *   const auth = await requireAuth()
 *   if (auth instanceof NextResponse) return auth
 *   const { userId } = auth
 */
export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const cookieStore = cookies()

  const supabase = createServerClient(
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
            // Route Handlers: ignored when called from a read-only context
          }
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { userId: user.id }
}
