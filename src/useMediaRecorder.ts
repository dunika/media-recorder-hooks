import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { RecordRTCPromisesHandler } from 'recordrtc'
import useEvent from './useEvent.ts'
import {
  AudioMediaFormat,
  type MediaControls,
  type MediaFormat,
  type RecordingState,
} from './types.ts'
import { stopMediaStream } from './mediaUtils.ts'

type TimeStamps = {
  start: Date | null,
  end: Date | null,
}


type UseMediaStreamRecorderProps = {
  constraints: MediaStreamConstraints,
  format?: MediaFormat
  timeSlice?: number
  onFinished?: (_blob: Blob | null) => void
}

type UseMediaStreamRecorder = {
  controls: MediaControls
  getBlob: () => Promise<Blob | null>
  error: Error | null
  state: RecordingState
  timeStamps: TimeStamps
  duration: number
  stream: MediaStream | null
}

type MediaRecorderState = {
  stream: MediaStream | null
  recorder: RecordRTCPromisesHandler | null,
}

const initialMediaRecorderState = {
  stream: null,
  recorder: null,
}

const defaultGetBlob = async () => null

function useMediaRecorder({
  constraints,
  format = AudioMediaFormat.Webm,
  onFinished,
}: UseMediaStreamRecorderProps): UseMediaStreamRecorder {


  const [media, setMedia] = useState<MediaRecorderState>(initialMediaRecorderState)
  const getBlob = media?.recorder?.getBlob ?? defaultGetBlob

  const isMounted = useRef(false)

  const [shouldCallOnFinished, setShouldCallOnFinished] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')

  const [timeStamps, setTimeStamps] = useState<TimeStamps>({
    start: null,
    end: null,
  })

  useEffect(() => {
    console.log('media.recorder?.getState()')
    const interval = setInterval(() => {
      console.log(media.recorder?.getState())
    }
    , 1000)
    return () => clearInterval(interval)
  }, [media])

  const [error, setError] = useState<Error | null>(null)

  const initializeAudioRecorder = useCallback(async () => {
    if (media.recorder) {
      return 
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      const recorder = new RecordRTCPromisesHandler(
        stream,
        {
          type: 'audio',
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      )

      setMedia({
        stream: stream,
        recorder: recorder
      })


    } catch (err) {
      setError(err as Error)
      setRecordingState('error')
    }
  }, [
    constraints,
    format,
  ])

  const cleanup = useCallback(() => {
    media.recorder?.destroy()
    stopMediaStream(media.stream);
    setMedia(initialMediaRecorderState)
  }, [media]);

  const reset = useCallback(() => {
    setShouldCallOnFinished(false)
    setRecordingState('inactive')
    setTimeStamps({
      start: null,
      end: null,
    })
    setError(null)
  }, [])
  

  useEffect(() => {
    if (isMounted.current) {
      return
    }
    isMounted.current = true
    initializeAudioRecorder()
    return cleanup
  }, [initializeAudioRecorder, cleanup])

  useEffect(() => {
    if (shouldCallOnFinished) {
      getBlob().then(onFinished)
      setShouldCallOnFinished(false)
    }
  }, [media, recordingState, onFinished, shouldCallOnFinished, getBlob])

  const start = useCallback(async () => {
    if (['recording', 'paused'].includes(recordingState)) {
      return
    }

    if (recordingState === 'stopped') {
      cleanup()
      reset()
      await initializeAudioRecorder()
    }

    setTimeStamps({
      start: new Date(),
      end: null,
    })

    await media.recorder?.startRecording()
    setRecordingState('recording')
  }, [
    recordingState,
    initializeAudioRecorder,
    cleanup,
    reset,
    media,
  ])

  const stop = useEvent(async () => {
    if (['error', 'inactive', 'stopped'].includes(recordingState)) {
      return
    }
    
    await media.recorder?.stopRecording()

    setRecordingState('stopped')
    setTimeStamps(({ start: startTime }:TimeStamps) => ({
      start: startTime,
      end: new Date(),
    }))

    setShouldCallOnFinished(true)
  })

  const pause = useEvent(() => {
    if (recordingState !== 'recording') {
      return
    }
    media.recorder?.pauseRecording()
    setRecordingState('paused')
  })

  const resume = useEvent(() => {
    if (recordingState !== 'paused') {
      return
    }
    media.recorder?.resumeRecording()
    setRecordingState('recording')
  })

  const controls = useMemo(() => ({
    start,
    stop,
    pause,
    resume,
  }), [start, stop, pause, resume]);

  return {
    controls: controls,
    getBlob: getBlob,
    state: recordingState,
    error,
    timeStamps,
    duration: getDuration(timeStamps),
    stream: media?.stream,
  }
}

function getDuration(timeStamps: TimeStamps): number {
  if (!timeStamps.start || !timeStamps.end) {
    return 0
  }
  return timeStamps.end.getTime() - timeStamps.start.getTime()
}


export default useMediaRecorder
