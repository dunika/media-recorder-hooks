import { useMemo } from 'react'
import {useMediaRecorder} from './useMediaRecorder.ts'
import { AudioMediaFormat } from './types.ts'

type UseAudioRecorderProps = {
  deviceId?: string
  format?: AudioMediaFormat
  timeSlice?: number
  onFinished?: (_blob: Blob | null) => void
}

export const useAudioRecorder = ({
  deviceId,
  format,
  timeSlice,
  onFinished,
}: UseAudioRecorderProps = {}): ReturnType<typeof useMediaRecorder> => {
  const constraints = useMemo(() => {
    if (!deviceId) {
      return {
        audio: true,
      }
    }
    return {
      audio: {
        deviceId,
      },
    }
  }, [deviceId])

  return useMediaRecorder({
    constraints,
    format,
    timeSlice,
    onFinished,
  })
}

export default useAudioRecorder
