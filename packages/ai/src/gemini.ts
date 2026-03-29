import { createGroq } from '@ai-sdk/groq'

export const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// Drop-in replacement — same export name so all agents work without changes
export const geminiFlash = groqClient('llama-3.3-70b-versatile')
