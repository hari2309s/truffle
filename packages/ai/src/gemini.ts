import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export const geminiFlash = google('gemini-2.0-flash')
