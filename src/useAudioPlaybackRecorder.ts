import { useRef } from 'react'
import useEvent from './useEvent.ts'
import type {
  AudioMediaFormat,
  MediaControls,
  RecordingState,
} from './types.ts'
import useAudioRecorder from './useAudioRecorder.ts'
import useAudioPlayback from './useAudioPlayback.js'


export type UseAudioPlaybackRecorder = {
  controls: MediaControls
  blob: Blob[]
  error: Error | null
  state: RecordingState
}

export type UseAudioPlaybackRecorderProps = {
  playbackSrc: string | null
  audioDeviceId?: string
  recordingFormat?: AudioMediaFormat
  recordingTimeSlice?: number
  onFinished?: (_blob: Blob) => void
}

const useAudioPlaybackRecorder = ({
  playbackSrc,
  audioDeviceId,
  recordingFormat,
  recordingTimeSlice,
  onFinished,
}: UseAudioPlaybackRecorderProps): UseAudioPlaybackRecorder => {
  const {
    controls: recorderControls,
    state: recordingState,
    blob: recordingBlob,
    error: recordingError,
  } = useAudioRecorder({
    audioDeviceId,
    format: recordingFormat,
    timeSlice: recordingTimeSlice,
    onFinished,
  })
  
  const {
    controls: audioControls,
    error: audioError,
  } = useAudioPlayback({
    src: playbackSrc,
    onFinished: () => {
      recorderControls.stop()
    },
  })

  const start = useEvent(() => {
    audioControls.play()
    recorderControls.start()
  })

  const stop = useEvent(() => {
    audioControls.stop()
    recorderControls.stop()
  })

  const pause = useEvent(() => {
    audioControls.pause()
    recorderControls.pause()
  })

  const resume = useEvent(() => {
    audioControls.play()
    recorderControls.resume()
  })

  const controls = useRef<MediaControls>({
    start,
    stop,
    pause,
    resume,
  })

  const error = audioError || recordingError

  return {
    controls: controls.current,
    blob: recordingBlob,
    state: recordingState,
    error: null,
  }
}

export default useAudioPlaybackRecorder
