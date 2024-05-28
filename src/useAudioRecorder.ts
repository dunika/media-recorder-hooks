import useMediaStream from './useMediaStream.ts'
import useMediaRecorder from './useMediaRecorder.ts'
import {
  MediaControls,
  RecordingState,
  FetchStatus,
} from './types.ts'

export type UseAudioRecorder = {
  controls: MediaControls
  blob: Blob[]
  error: Error | null
  state: RecordingState
}

const useAudioRecorder = (deviceId?: string): UseAudioRecorder => {
  const {
    stream,
    fetchStatus: streamFetchStatus,
    error: streamError,
  } = useMediaStream(deviceId)

  const {
    controls,
    blob,
    error: recorderError,
    state,
  } = useMediaRecorder(stream)

  const error = streamError || recorderError

  return {
    controls,
    state,
    blob,
    error: streamFetchStatus === FetchStatus.Pending ? null : error,
  }
}

export default useAudioRecorder
