import { createGroq } from '@ai-sdk/groq'
import type { TaskType } from '../types'

export function getModel(task: TaskType) {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
  // Use the multimodal scout model for vision; versatile 70b for everything else
  if (task === 'vision') {
    return groq('meta-llama/llama-4-scout-17b-16e-instruct')
  }
  return groq('llama-3.3-70b-versatile')
}
