import { createGroq } from '@ai-sdk/groq'

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const chatModel = groq('llama-3.3-70b-versatile')
export const visionModel = groq('meta-llama/llama-4-scout-17b-16e-instruct')
