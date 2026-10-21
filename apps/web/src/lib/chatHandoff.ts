/**
 * Hands a prompt spoken or tapped on Home over to Chat, which sends it on
 * arrival. Passed in sessionStorage rather than the URL, so a crafted link
 * can't make a signed-in user send a message they never said.
 */
const KEY = 'truffle_chat_handoff'

export function setChatHandoff(prompt: string) {
  try {
    sessionStorage.setItem(KEY, prompt)
  } catch {
    // storage blocked — Chat simply opens without the prompt
  }
}

/** Reads and clears the handoff, so a reload doesn't send it twice. */
export function takeChatHandoff(): string | null {
  try {
    const prompt = sessionStorage.getItem(KEY)?.trim() || null
    sessionStorage.removeItem(KEY)
    return prompt
  } catch {
    return null
  }
}
