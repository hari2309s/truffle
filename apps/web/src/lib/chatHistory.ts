import { isToolUIPart, type UIMessage } from 'ai'

/**
 * Chat history as the model should see it. Assistant messages keep their text
 * (minus any leaked <function=…> XML) and their proposal cards. Cards are
 * answered on the client, so each goes back as a tool call with its result —
 * confirmed, declined, or still open. Without them the model sees "I spent
 * €12 on lunch" with no reply and proposes that same entry again.
 */
export function normalizeHistory(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== 'assistant') return m
    const parts = (m.parts ?? []).flatMap((p): UIMessage['parts'] => {
      if (p.type === 'text') {
        return [
          {
            ...p,
            // Bounded to avoid polynomial backtracking on adversarial input —
            // real tool-call bodies never approach this length.
            text: p.text.replace(/<function=[^>]*>[\s\S]{0,5000}?<\/function>/g, '').trim(),
          },
        ]
      }
      if (!isToolUIPart(p) || (p.state !== 'output-available' && p.state !== 'input-available')) {
        return []
      }
      const output =
        p.state === 'output-available'
          ? p.output
          : // Still on screen and tappable — reading it as declined would invite a duplicate.
            {
              pending: true,
              note: 'This card is still open for the user to confirm. Do not propose it again.',
            }
      return [
        {
          type: p.type,
          toolCallId: p.toolCallId,
          state: 'output-available',
          input: p.input,
          output,
        } as UIMessage['parts'][number],
      ]
    })
    return { ...m, parts }
  })
}
