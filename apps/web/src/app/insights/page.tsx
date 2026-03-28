import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { InsightsPage } from '@/components/InsightsPage'

export default async function Insights() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <InsightsPage userId={user.id} />
}
