'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type CameraState = 'starting' | 'live' | 'unavailable'

/**
 * Rear-camera viewfinder for receipt scanning. Falls back to 'unavailable'
 * (no camera, permission denied, insecure context) so callers can offer the
 * file picker instead. Stops the stream on unmount.
 */
export function useCamera(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CameraState>('starting')
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setTorchOn(false)
  }, [])

  useEffect(() => {
    if (!enabled) {
      stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return
    }
    let cancelled = false
    setState('starting')
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
        setTorchSupported(Boolean(caps.torch))
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
        setState('live')
      })
      .catch(() => !cancelled && setState('unavailable'))
    return () => {
      cancelled = true
      stop()
    }
  }, [enabled, stop])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch {
      setTorchSupported(false)
    }
  }, [torchOn])

  /** Grabs the current frame as a JPEG file. */
  const capture = useCallback(async (): Promise<File | null> => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    return blob ? new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null
  }, [])

  return { videoRef, state, torchSupported, torchOn, toggleTorch, capture, stop }
}
