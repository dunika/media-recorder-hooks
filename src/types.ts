export type RecordingState = 'inactive' | 'paused' | 'recording' | 'error' | 'stopped'

export type MediaControls = {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
}

export enum FetchStatus {
  Pending = 'pending',
  Success = 'success',
  Error = 'error'
}

export enum MicrophonePermissionStatus {
  Granted = 'granted',
  Denied = 'denied',
  Pending = 'pending',
  Error = 'error'
}
