import { supabase } from './supabase'
import { clearOfflineQueues } from './offlineQueue'

export async function signOut() {
  // Queued offline entries belong to this account — never carry them over.
  clearOfflineQueues()
  await supabase.auth.signOut()
  window.location.reload()
}
