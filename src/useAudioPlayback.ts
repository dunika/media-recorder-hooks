import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import useEvent from './useEvent'

type LoadAudioConfig = {
  src: string | null,
  onFinished?: () => void,
  deviceId?: string,
}

type AudioPlaybackControls = {
  play: () => Promise<void>,
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

const useMemoLoadAudioConfig = (loadAudioConfig?: LoadAudioConfig): LoadAudioConfig | undefined => {
  const { src, onFinished, deviceId } = loadAudioConfig || {}
  const wrappedOnFinished = useEvent(() => {
    onFinished?.()
  })

  return useMemo(() => {
    if (!src) {
      return undefined
    }
    return ({
      src,
      onFinished: wrappedOnFinished,
      deviceId,
    })
  }, [src, wrappedOnFinished, deviceId])
}

const useAudioPlayback = (loadAudioConfig?: LoadAudioConfig): UseAudioPlayback => {
  const audio = useRef<HTMLAudioElement | null>(null)
  const cleanUp = useRef(() => {})
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const loadAudioConfigMemo = useMemoLoadAudioConfig(loadAudioConfig)

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
    deviceId,
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
      if (deviceId) {
        nextAudio.setSinkId(deviceId)
      }
    } catch (e) {
      setError(e as Error)
      return
    }

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
    if (loadAudioConfigMemo?.src) {
      load(loadAudioConfigMemo)
    }
  }, [load, loadAudioConfigMemo])

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
