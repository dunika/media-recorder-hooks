import { useMemo } from 'react'
import useMediaRecorder from './useMediaRecorder'
import { AudioMediaFormat } from './types'

type UseAudioRecorderProps = {
  audioDeviceId?: string
  format?: AudioMediaFormat
  timeSlice?: number
  onFinished?: (_blob: Blob) => void
}

const useAudioRecorder = ({
  audioDeviceId,
  format,
  timeSlice,
  onFinished,
}: UseAudioRecorderProps = {}): ReturnType<typeof useMediaRecorder> => {
  const constraints = useMemo(() => {
    if (!audioDeviceId) {
      return {
        audio: true,
      }
    }
    return {
      audio: {
        deviceId: audioDeviceId,
      },
    }
  }, [audioDeviceId])

  return useMediaRecorder({
    constraints,
    format,
    timeSlice,
    onFinished,
  })
}

export default useAudioRecorder
