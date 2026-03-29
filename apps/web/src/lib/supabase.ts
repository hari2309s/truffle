import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Bypass the Web Lock mechanism — avoids the 5s orphaned-lock delay
      // that occurs in Next.js due to component mount/unmount during hydration.
      // Safe for a single-tab SPA where concurrent auth operations aren't a concern.
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  }
)
