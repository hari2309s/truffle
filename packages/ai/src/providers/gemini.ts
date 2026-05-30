import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { TaskType } from '../types'

export function getModel(task: TaskType) {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
  // Flash 2.5 for demanding tasks (reasoning, vision, tool-calling); lite for cheap fast tasks
  if (task === 'fast-chat') {
    return google('gemini-2.0-flash-lite')
  }
  return google('gemini-2.5-flash')
}
