import {
  useEffect,
  useState,
} from 'npm:react'
import { fetchAvailableAudioDevices } from './mediaUtils.ts'

export type UseAvailableAudioDevices = {
  devices: MediaDeviceInfo[],
  error: Error | null
}

const useAvailableAudioDevices = (): UseAvailableAudioDevices => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const updateAudioDevices = async () => {
      setError(null)

      try {
        const nextDevices = await fetchAvailableAudioDevices()
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

export default useAvailableAudioDevices
