import { Video } from '../../../../types/index.d'

export type RecordingState = 'inactive' | 'paused' | 'recording' | 'error' | 'stopped'

export type MediaControls = {
  start: () => Promise<void>
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

export enum AudioMediaFormat {
  Webm = 'audio/webm',
  Ogg = 'audio/ogg',
  Wav = 'audio/wav',
  Mp3 = 'audio/mpeg',
}

export enum AudioMediaExtension {
  Webm = 'webm',
  Ogg = 'ogg',
  Wav = 'wav',
  Mp3 = 'mp3',
}

export enum VideoMediaFormat {
  Webm = 'video/webm',
  Mp4 = 'video/mp4',
  Ogg = 'video/ogg',
}

export type MediaFormat = AudioMediaFormat | VideoMediaFormat;
