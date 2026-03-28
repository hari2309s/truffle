import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File | null

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    console.error('Voice transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
