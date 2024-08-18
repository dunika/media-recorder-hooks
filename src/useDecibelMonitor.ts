import {
  useEffect,
  useState,
} from 'react'
import DecibelMonitor from './DecibelMonitor.ts'

export type UseDecibelMonitorProps = {
  stream: MediaStream | null;
  decibelUpdateInterval?: number;
};

const useDecibelMonitor = ({
  stream,
  decibelUpdateInterval,
}: UseDecibelMonitorProps): number | null => {
  const [decibels, setDecibels] = useState<number | null>(null)

  useEffect(() => {
    let monitor = null
    if (stream) {
      monitor = new DecibelMonitor(stream, decibelUpdateInterval)
      monitor.subscribe(setDecibels)
    } else {
      setDecibels(null)
    }

    return () => {
      monitor?.destroy()
    }
  }, [stream, decibelUpdateInterval])

  return decibels
}

export default useDecibelMonitor
