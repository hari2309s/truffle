import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const OTP_TYPES: EmailOtpType[] = ['email', 'signup', 'magiclink', 'invite', 'email_change']
const TOKEN_HASH = /^[A-Za-z0-9_-]{8,128}$/

async function serverClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}

function readToken(params: URLSearchParams | FormData) {
  const tokenHash = params.get('token_hash')
  const type = params.get('type')
  if (typeof tokenHash !== 'string' || !TOKEN_HASH.test(tokenHash)) return null
  if (typeof type !== 'string' || !OTP_TYPES.includes(type as EmailOtpType)) return null
  return { tokenHash, type: type as EmailOtpType }
}

/** One tap to continue: a POST, so neither a mail scanner nor a planted link signs anyone in. */
function continuePage(tokenHash: string, type: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Sign in to Truffle</title>
<style>
  :root { --bg:#e9e5dd; --card:#fffdf8; --text:#1b1a18; --text2:#5c5851; --border:#cfc7b9; --accent:#f6bd87; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#121211; --card:#1a1918; --text:#efe9de; --text2:#ada597; --border:#3a3733; }
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px 16px;
    background:var(--bg); color:var(--text); font-family:'Space Mono',ui-monospace,Menlo,monospace; }
  main { width:100%; max-width:400px; background:var(--card); padding:22px 22px 26px; }
  .eyebrow { font-size:12px; color:var(--text2); text-transform:uppercase; letter-spacing:.08em; }
  hr { border:0; border-top:2px dashed var(--border); margin:14px 0 18px; }
  h1 { margin:0 0 8px; font-family:system-ui,sans-serif; font-weight:500; font-size:28px; letter-spacing:-.01em; }
  p { margin:0 0 22px; font-family:system-ui,sans-serif; color:var(--text2); line-height:1.5; }
  button { width:100%; height:56px; border:2px solid #1b1a18; border-radius:10px; background:var(--accent); color:#1b1a18;
    box-shadow:0 3px 0 #1b1a18; font:700 14px/1 inherit; font-family:inherit; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; }
  button:active { transform:translateY(3px); box-shadow:none; }
</style>
</head>
<body>
<main>
  <div class="eyebrow">Truffle · Sign in</div>
  <hr />
  <h1>Continue to Truffle</h1>
  <p>Tap to finish signing in on this device.</p>
  <form method="post" action="/auth/confirm">
    <input type="hidden" name="token_hash" value="${tokenHash}" />
    <input type="hidden" name="type" value="${type}" />
    <button type="submit">Continue →</button>
  </form>
</main>
</body>
</html>`
}

/**
 * Email links land here. A token hash (the current template) verifies in any
 * browser, unlike PKCE — but only after the user taps Continue. A PKCE code
 * (templates still on {{ .ConfirmationURL }}) is exchanged directly; it only
 * works in the browser that asked for the link.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const token = readToken(searchParams)
  if (token) {
    return new NextResponse(continuePage(token.tokenHash, token.type), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    })
  }

  const code = searchParams.get('code')
  if (code) {
    const supabase = await serverClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  // Only our own Continue page may post here — another site auto-submitting
  // this form would otherwise sign the visitor into the attacker's account.
  if (request.headers.get('origin') !== origin) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`, { status: 303 })
  }
  const token = readToken(await request.formData())
  const supabase = await serverClient()

  if (token) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: token.tokenHash, type: token.type })
    if (!error) return NextResponse.redirect(`${origin}/`, { status: 303 })
  }

  // The user chose to sign in with this link: if it failed, don't leave them
  // in whatever account this browser had open before.
  await supabase.auth.signOut({ scope: 'local' })
  return NextResponse.redirect(`${origin}/?error=auth_failed`, { status: 303 })
}
