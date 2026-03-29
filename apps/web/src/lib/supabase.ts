import { createBrowserClient } from '@supabase/ssr'

// createBrowserClient handles Next.js navigation/unmount lifecycle correctly
// and avoids the Web Lock orphan issue from @supabase/supabase-js's createClient
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
