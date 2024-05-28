import {
  useEffect,
  useRef,
  useState,
} from 'react'
import useEvent from './useEvent.ts'
import type {
  MediaControls,
  RecordingState,
} from './types.ts'

type GetMediaRecorderProps = {
  stream: MediaStream
  onStateChange: (_state: RecordingState) => void
  onError: (_error: Error) => void
  onDataAvailable: (_blob: Blob) => void
  mimeType?: string
}

const getMediaRecorder = ({
  stream,
  onStateChange,
  onError,
  onDataAvailable,
  mimeType = 'audio/webm;codecs=opus', // TODO: make this configurable
}: GetMediaRecorderProps): MediaRecorder => {
  const mediaRecorder = new MediaRecorder(stream, { mimeType })

  mediaRecorder.onstart = () => onStateChange('recording')
  mediaRecorder.onstop = () => onStateChange('stopped')
  mediaRecorder.onpause = () => onStateChange('paused')
  mediaRecorder.onresume = () => onStateChange('recording')
  mediaRecorder.onerror = (event) => {
    const errorEvent = event as ErrorEvent;
    onStateChange('error')
    onError(errorEvent.error)
  }
  mediaRecorder.ondataavailable = (event) => {
    onDataAvailable(event.data)
  }

  return mediaRecorder
}

type UseMediaStreamRecorder = {
  controls: MediaControls
  blob: Blob[]
  error: Error | null
  state: RecordingState
}

const useMediaRecorder = (
  stream?: MediaStream | null,
): UseMediaStreamRecorder => {
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob[]>([])
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    return () => {
      mediaRecorder.current?.stop()
    }
  }, [stream])

  const start = useEvent(() => {
    if (['recording', 'paused'].includes(recordingState)) {
      return
    }

    if (!stream) {
      setError(new Error('No media stream provided'))
      return
    }

    setError(null)
    setRecordingBlob([])

    mediaRecorder.current = getMediaRecorder({
      stream,
      onStateChange: setRecordingState,
      onError: setError,
      onDataAvailable: (blob) => {
        setRecordingBlob((blobs: Blob[]) => [...blobs, blob]);
      },
    })

    mediaRecorder.current.start(1000)
  })

  const stop = useEvent(() => {
    if (['error', 'inactive', 'stopped'].includes(recordingState)) {
      return
    }
    mediaRecorder.current?.stop()
  })

  const pause = useEvent(() => {
    if (recordingState !== 'recording') {
      return
    }
    mediaRecorder.current?.pause()
  })

  const resume = useEvent(() => {
    if (recordingState !== 'paused') {
      return
    }
    mediaRecorder.current?.resume()
  })

  const controls = useRef<MediaControls>({
    start,
    stop,
    pause,
    resume,
  })

  return {
    controls: controls.current,
    blob: recordingBlob,
    state: recordingState,
    error,
  }
}

export default useMediaRecorder
