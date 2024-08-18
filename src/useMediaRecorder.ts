import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import useEvent from './useEvent.ts'
import type {
  MediaControls,
  MediaFormat,
  RecordingState,
} from './types.ts'
import { stopMediaStream } from './mediaUtils.ts'

type TimeStamps = {
  start: Date | null,
  end: Date | null,
}

const getDuration = (timeStamps: TimeStamps): number => {
  if (!timeStamps.start || !timeStamps.end) {
    return 0
  }
  return timeStamps.end.getTime() - timeStamps.start.getTime()
}

type UseMediaStreamRecorderProps = {
  constraints: MediaStreamConstraints,
  format?: MediaFormat
  timeSlice?: number
  onFinished?: (_blob: Blob) => void
}

type UseMediaStreamRecorder = {
  controls: MediaControls
  blob: Blob[]
  error: Error | null
  state: RecordingState
  timeStamps: TimeStamps
  duration: number
  stream: MediaStream | null
}

const useMediaRecorder = ({
  constraints,
  format,
  timeSlice,
  onFinished,
}: UseMediaStreamRecorderProps): UseMediaStreamRecorder => {
  const stream = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)

  const [recordingBlob, setRecordingBlob] = useState<Blob[]>([])
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const shouldCallOnFinished = useRef(false)

  const [timeStamps, setTimeStamps] = useState<TimeStamps>({
    start: null,
    end: null,
  })

  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => {
    mediaRecorder.current?.stop()
    stopMediaStream(stream.current)
    setRecordingBlob([])
    setRecordingState('inactive')
    setTimeStamps({
      start: null,
      end: null,
    })
    setError(null)
    shouldCallOnFinished.current = false
  }, [mediaRecorder, stream])

  useEffect(() => {
    return reset
  }, [])

  useEffect(() => {
    if (shouldCallOnFinished.current) {
      onFinished?.(new Blob(recordingBlob, format ? { type: format } : undefined))
      shouldCallOnFinished.current = false
    }
  }, [recordingBlob, recordingState, onFinished, format])

  const start = useCallback(async () => {
    if (['recording', 'paused'].includes(recordingState)) {
      return
    }

    reset()

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia(constraints)

      const nextMediaRecorder = new MediaRecorder(
        nextStream,
        format ? { mimeType: format } : undefined,
      )
      nextMediaRecorder.onstart = () => {
        setTimeStamps({
          start: new Date(),
          end: null,
        })
        return setRecordingState('recording')
      }
      nextMediaRecorder.onpause = () => setRecordingState('paused')
      nextMediaRecorder.onresume = () => setRecordingState('recording')
      nextMediaRecorder.onstop = () => {
        shouldCallOnFinished.current = true
        setTimeStamps(({ start: startTime }) => ({
          start: startTime,
          end: new Date(),
        }))
        return setRecordingState('stopped')
      }
      nextMediaRecorder.onerror = (event) => {
        const errorEvent = event as ErrorEvent
        setRecordingState('error')
        setError(errorEvent.error)
      }
      nextMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordingBlob((blob: Blob[]) => [...blob, event.data])
        }
        if (nextMediaRecorder.state === 'inactive') {
          shouldCallOnFinished.current = true
        }
      }
      nextMediaRecorder.start(timeSlice)

      stream.current = nextStream
      mediaRecorder.current = nextMediaRecorder
    } catch (err) {
      setError(err as Error)
      setRecordingState('error')
    }
  }, [
    constraints,
    format,
    timeSlice,
    recordingState,
    reset,
  ])

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
    timeStamps,
    duration: getDuration(timeStamps),
    stream: stream.current,
  }
}

export default useMediaRecorder
