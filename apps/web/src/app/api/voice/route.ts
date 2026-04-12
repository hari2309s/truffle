import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { langfuse } from '@truffle/ai'

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File | null

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const trace = langfuse.trace({
      name: 'voice_transcription',
      metadata: { model: 'whisper-large-v3', mimeType: audio.type, fileSize: audio.size },
    })
    const span = trace.span({
      name: 'whisper_transcribe',
      input: { model: 'whisper-large-v3', language: 'en' },
    })

    const transcription = await getGroq().audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'json',
    })

    span.end({ output: transcription.text })
    await langfuse.flushAsync()

    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Voice transcription error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
