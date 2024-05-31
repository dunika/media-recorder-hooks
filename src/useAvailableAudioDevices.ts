import {
  useEffect,
  useState,
} from 'react'
import { fetchMediaDevices } from './mediaUtils.ts'

export type UseAvailableMediaDevices = {
  devices: Record<MediaDeviceKind, MediaDeviceInfo[]>,
  error: Error | null
}

const useAvailableMediaDevices = (): UseAvailableMediaDevices => {
  const [devices, setDevices] = useState<Record<MediaDeviceKind, MediaDeviceInfo[]>>({
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  })

  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const updateAudioDevices = async () => {
      setError(null)

      try {
        const nextDevices = await fetchMediaDevices()
        setDevices(nextDevices)
      } catch (nextError) {
        setError(nextError as Error)
      }
    }

    updateAudioDevices()

    navigator.mediaDevices.addEventListener('devicechange', updateAudioDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateAudioDevices)
    }
  }, [])

  return {
    devices,
    error,
  }
}

export default useAvailableMediaDevices
