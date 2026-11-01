import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * OAuth callback (Google SSO) and email confirmation code exchange.
 * Supabase redirects here after a successful Google sign-in with a `code` param.
 * Token-hash email confirmations are forwarded to /auth/confirm.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Email confirmation links with a token hash are handled by /auth/confirm.
  if (searchParams.has('token_hash')) {
    return NextResponse.redirect(`${origin}/auth/confirm?${searchParams.toString()}`)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/`, { status: 303 })
    }
  }

  // Something went wrong — send back to login
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
