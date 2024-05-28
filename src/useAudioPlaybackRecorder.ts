import {
  useEffect,
  useRef,
} from 'npm:react'
import { useAudioPlayer } from 'npm:react-use-audio-player'
import useEvent from './useEvent.ts'
import type {
  MediaControls,
  RecordingState,
} from './types.ts'
import useAudioRecorder from './useAudioRecorder.ts'
type StartCallback = () => void;

const getError = (audioError: string | null, recordingError: Error | null): Error | null => {
  if (audioError) {
    return new Error(audioError)
  }

  return recordingError
}

export type UseAudioPlaybackRecorder = {
  controls: MediaControls
  blob: Blob[]
  error: Error | null
  state: RecordingState
}

export type UseAudioPlaybackRecorderProps = {
  audioSrc: string | null
  audioSrcFormat: string | null
}

const useAudioPlaybackRecorder = ({
  audioSrc,
  audioSrcFormat,
}: UseAudioPlaybackRecorderProps): UseAudioPlaybackRecorder => {
  const {
    load: loadAudio,
    play: playAudio,
    stop: stopAudio,
    pause: pauseAudio,
    cleanup: cleanupAudio,
    error: audioError,
  } = useAudioPlayer()

  const {
    controls: recorderControls,
    state: recordingState,
    blob: recordingBlob,
    error: recordingError,
  } = useAudioRecorder()

  useEffect(() => {
    if (audioSrc) {
      loadAudio(audioSrc, {
        format: audioSrcFormat ?? undefined,
        autoplay: false,
        onend: () => {
          recorderControls.stop()
        },
      })
    }
    return () => {
      cleanupAudio()
      recorderControls.stop()
    }
  }, [
    audioSrc,
    audioSrcFormat,
    loadAudio,
    cleanupAudio,
    recorderControls,
  ])

  const start = useEvent(() => {
    playAudio()
    recorderControls.start()
  })

  const stop = useEvent(() => {
    stopAudio()
    recorderControls.stop()
  })

  const pause = useEvent(() => {
    pauseAudio()
    recorderControls.pause()
  })

  const resume = useEvent(() => {
    playAudio()
    recorderControls.resume()
  })

  const controls = useRef<MediaControls>({
    start,
    stop,
    pause,
    resume,
  })

  const error = getError(audioError, recordingError)

  return {
    controls: controls.current,
    blob: recordingBlob,
    state: recordingState,
    error,
  }
}

export default useAudioPlaybackRecorder
