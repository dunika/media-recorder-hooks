export const fetchDefaultMediaStream = (constraints: MediaStreamConstraints = { audio: true }): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia(constraints)
}

export const fetchMediaStream = (deviceId?: string, constraints?: MediaStreamConstraints): Promise<MediaStream> => {
  if (!deviceId) {
    return fetchDefaultMediaStream(constraints)
  }
  return navigator.mediaDevices.getUserMedia({ audio: { deviceId } })
}

export const fetchAvailableAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'audioinput')
}

export const getMediaStreamDeviceId = (stream: MediaStream): string | null => {
  const [track] = stream.getAudioTracks()
  const { deviceId } = track.getSettings()
  return deviceId ?? null
}

export const stopMediaStream = (stream: MediaStream) : void => {
  stream.getTracks().forEach((track) => track.stop())
}
