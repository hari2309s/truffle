import { describe, it, expect } from 'vitest'
import { convertToModelMessages, type UIMessage } from 'ai'
import { normalizeHistory } from '../chatHistory'

const lunch = { description: 'lunch', amount: -12, category: 'food_delivery', date: '2026-10-22' }

const user = (id: string, text: string): UIMessage => ({ id, role: 'user', parts: [{ type: 'text', text }] })
const card = (id: string, part: Record<string, unknown>): UIMessage =>
  ({
    id,
    role: 'assistant',
    parts: [{ type: 'tool-proposeTransaction', toolCallId: `call-${id}`, input: lunch, ...part }],
  }) as unknown as UIMessage

describe('normalizeHistory', () => {
  it('keeps an answered card as a tool call with its result', () => {
    const [, a] = normalizeHistory([
      user('u1', 'I spent 12 on lunch'),
      card('a1', { state: 'output-available', output: { confirmed: true } }),
    ])
    expect(a!.parts).toEqual([
      { type: 'tool-proposeTransaction', toolCallId: 'call-a1', state: 'output-available', input: lunch, output: { confirmed: true } },
    ])
  })

  it('marks an open card as still pending so the call always has a result', () => {
    const [a] = normalizeHistory([card('a1', { state: 'input-available' })])
    expect(a!.parts[0]).toMatchObject({ state: 'output-available', output: { pending: true } })
  })

  it('drops streaming or failed calls and strips leaked tool XML from text', () => {
    const [a] = normalizeHistory([
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Sure <function=x>{"a":1}</function>' },
          { type: 'tool-proposeGoal', toolCallId: 'c1', state: 'input-streaming', input: undefined },
          { type: 'tool-proposeHabit', toolCallId: 'c2', state: 'output-error', input: {}, errorText: 'bad' },
        ],
      } as UIMessage,
    ])
    expect(a!.parts).toEqual([{ type: 'text', text: 'Sure' }])
  })

  it('gives the model the first entry as already handled', () => {
    const model = convertToModelMessages(
      normalizeHistory([
        user('u1', 'I spent 12 on lunch'),
        card('a1', { state: 'output-available', output: { confirmed: true } }),
        user('u2', 'and 4 on coffee'),
      ])
    )
    expect(model.map((m) => m.role)).toEqual(['user', 'assistant', 'tool', 'user'])
    expect(JSON.stringify(model[2])).toContain('"confirmed":true')
  })
})
