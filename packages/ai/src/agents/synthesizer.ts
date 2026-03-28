import { streamText } from 'ai'
import { geminiFlash } from '../gemini'
import { SYNTHESIZER_PROMPT } from '../prompts/synthesizer.prompt'

export async function synthesizeResponse(analysis: string, question: string) {
  const prompt = SYNTHESIZER_PROMPT.replace('{analysis}', analysis).replace(
    '{question}',
    question
  )

  return streamText({
    model: geminiFlash,
    prompt,
    maxTokens: 200,
  })
}
