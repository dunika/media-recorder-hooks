export const fetchAvailableAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audiooutput')
}

export const fetchMediaDevices = async (): Promise<Record<MediaDeviceKind, MediaDeviceInfo[]>> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  const deviceMap: Record<MediaDeviceKind, MediaDeviceInfo[]> = {
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  }
  devices.forEach((device) => {
    deviceMap[device.kind as MediaDeviceKind].push(device)
  })
  return deviceMap
}

type DefaultMediaDeviceMap = Record<MediaDeviceKind, MediaDeviceInfo | null>

export const fetchDefaultMediaDevices = async (): Promise<DefaultMediaDeviceMap> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  const defaultDevices: Record<MediaDeviceKind, MediaDeviceInfo | null> = {
    audioinput: null,
    audiooutput: null,
    videoinput: null,
  }
  devices.forEach((device) => {
    if (device.deviceId === 'default') {
      defaultDevices[device.kind as MediaDeviceKind] = device
    }
  })
  return defaultDevices
}

export const fetchAvailableVideoDevices = async (): Promise<MediaDeviceInfo[]> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

export const getAudioStreamDeviceId = (stream: MediaStream): string | null => {
  const [track] = stream.getAudioTracks()
  const { deviceId } = track.getSettings()
  return deviceId ?? null
}

export const getVideoStreamDeviceId = (stream: MediaStream): string | null => {
  const [track] = stream.getVideoTracks()
  const { deviceId } = track.getSettings()
  return deviceId ?? null
}

export const stopMediaStream = (stream: MediaStream | null) : void => {
  stream?.getTracks().forEach((track) => track.stop())
}
