'use client'

import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecorderReturn {
  isRecording: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  audioBlob: Blob | null
  transcript: string | null
  isTranscribing: boolean
  error: string | null
}

export function useVoiceRecorder(userId: string): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      setTranscript(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Pick best supported MIME type
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find(
          (type) => MediaRecorder.isTypeSupported(type)
        ) ?? ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const resolvedMime = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: resolvedMime })
        setAudioBlob(blob)
        await transcribeAudio(blob, resolvedMime)
      }

      mediaRecorder.start(250) // collect data every 250ms
      setIsRecording(true)
    } catch (err) {
      setError('Microphone access denied or unavailable')
      console.error('Recording error:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  const transcribeAudio = async (blob: Blob, mime: string) => {
    setIsTranscribing(true)
    try {
      const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      const formData = new FormData()
      formData.append('audio', blob, `recording.${ext}`)

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Transcription failed')

      const { transcript: text } = await response.json()
      setTranscript(text)
    } catch (err) {
      setError('Could not transcribe audio. Please try again.')
      console.error('Transcription error:', err)
    } finally {
      setIsTranscribing(false)
    }
  }

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    transcript,
    isTranscribing,
    error,
  }
}
