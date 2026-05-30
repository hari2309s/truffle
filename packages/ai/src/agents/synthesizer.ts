import { streamText } from 'ai'
import { selectModel } from '../router'
import { SYNTHESIZER_PROMPT } from '../prompts/synthesizer.prompt'

export async function synthesizeResponse(analysis: string, question: string) {
  const { model } = await selectModel('fast-chat')
  const prompt = SYNTHESIZER_PROMPT.replace('{analysis}', analysis).replace('{question}', question)

  return streamText({
    model,
    prompt,
    maxTokens: 200,
  })
}
