import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import useEvent from './useEvent'
import { fetchDefaultMediaDevices } from './mesdiaUtils'

type LoadAudioConfig = {
  src: string | null,
  onFinished?: () => void,
  outputDeviceId?: string,
}

type AudioPlaybackControls = {
  play: () => void,
  pause: () => void,
  stop: () => void,
}

type UseAudioPlayback = {
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  error: Error | null,
  controls: AudioPlaybackControls,
  load: (_props: LoadAudioConfig) => void,
}

const useAudioPlayback = (loadAudioConfig?: LoadAudioConfig): UseAudioPlayback => {
  const audio = useRef<HTMLAudioElement | null>(null)
  const cleanUp = useRef(() => {})
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const reset = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)

    cleanUp.current()
    audio.current = null
  }, [])

  useEffect(() => {
    return reset
  }, [reset])

  const load = useEvent(async ({
    outputDeviceId,
    onFinished,
    src,
  }: LoadAudioConfig) => {
    reset()

    if (src === null) {
      setError(new Error('No source provided'))
      return
    }

    const nextAudio = new Audio(src)

    try {
      if (outputDeviceId) {
        nextAudio.setSinkId(outputDeviceId)
      } else {
        const { audiooutput } = await fetchDefaultMediaDevices()
        if (audiooutput) {
          nextAudio.setSinkId(audiooutput.deviceId)
        }
      }
    } catch { }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onFinished?.()
    }
    const handleTimeUpdate = () => setCurrentTime(nextAudio.currentTime)
    const handleLoadedMetadata = () => setDuration(nextAudio.duration)
    const handleError = (event: ErrorEvent) => setError(event.error)

    nextAudio.addEventListener('play', handlePlay)
    nextAudio.addEventListener('pause', handlePause)
    nextAudio.addEventListener('ended', handleEnded)
    nextAudio.addEventListener('timeupdate', handleTimeUpdate)
    nextAudio.addEventListener('loadedmetadata', handleLoadedMetadata)
    nextAudio.addEventListener('error', handleError)

    audio.current = nextAudio

    cleanUp.current = () => {
      audio?.current?.removeEventListener('play', handlePlay)
      audio?.current?.removeEventListener('pause', handlePause)
      audio?.current?.removeEventListener('ended', handleEnded)
      audio?.current?.removeEventListener('timeupdate', handleTimeUpdate)
      audio?.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio?.current?.removeEventListener('error', handleError)
    }
  })

  useEffect(() => {
    if (loadAudioConfig) {
      load(loadAudioConfig)
    }
  }, [load, loadAudioConfig])

  const play = useEvent(async () => {
    try {
      await audio.current?.play()
    } catch (e) {
      setError(e as Error)
    }
  })

  const pause = () => {
    audio.current?.pause()
  }

  const stop = () => {
    audio.current?.pause()
    if (audio.current) {
      audio.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  const controls = useRef({
    play,
    pause,
    stop,
  })

  return {
    isPlaying,
    currentTime,
    duration,
    error,
    controls: controls.current,
    load,
  }
}

export default useAudioPlayback
