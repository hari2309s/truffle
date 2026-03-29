import { streamText } from 'ai'
import { chatModel } from '../llm'
import { SYNTHESIZER_PROMPT } from '../prompts/synthesizer.prompt'

export async function synthesizeResponse(analysis: string, question: string) {
  const prompt = SYNTHESIZER_PROMPT.replace('{analysis}', analysis).replace('{question}', question)

  return streamText({
    model: chatModel,
    prompt,
    maxTokens: 200,
  })
}
