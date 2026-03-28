import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { ChatPage } from '@/components/ChatPage'

export default async function Chat() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <ChatPage userId={user.id} />
}
