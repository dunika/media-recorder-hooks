import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import useEvent from './useEvent';

type LoadAudioConfig = {
  src: string | null;
  onFinished?: () => void;
  deviceId?: string;
};

type AudioPlaybackControls = {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
};

type UseAudioPlayback = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: Error | null;
  controls: AudioPlaybackControls;
  load: (_props: LoadAudioConfig) => void;
};

const useMemoLoadAudioConfig = (
  loadAudioConfig?: LoadAudioConfig
): LoadAudioConfig | undefined => {
  const { src, onFinished, deviceId } = loadAudioConfig || {};
  const wrappedOnFinished = useEvent(() => {
    onFinished?.();
  });

  return useMemo(() => {
    if (!src) {
      return undefined;
    }
    return {
      src,
      onFinished: wrappedOnFinished,
      deviceId,
    };
  }, [src, wrappedOnFinished, deviceId]);
};

const useAudioPlayback = (loadAudioConfig?: LoadAudioConfig): UseAudioPlayback => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const cleanUp = useRef(() => {});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const loadAudioConfigMemo = useMemoLoadAudioConfig(loadAudioConfig);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);

    cleanUp.current();
    audioElementRef.current = null;
    audioSourceRef.current = null;
  }, []);

  useEffect(() => {
    return reset;
  }, [reset]);

  const load = useEvent(async ({
    deviceId,
    onFinished,
    src,
  }: LoadAudioConfig) => {
    reset();

    if (src === null) {
      setError(new Error('No source provided'));
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const nextAudioElement = new Audio(src);

    try {
      if (deviceId) {
        await nextAudioElement.setSinkId(deviceId);
      }
    } catch (e) {
      setError(e as Error);
      return;
    }

    const nextAudioSource = audioContextRef.current.createMediaElementSource(nextAudioElement);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onFinished?.();
    };
    const handleTimeUpdate = () => setCurrentTime(nextAudioElement.currentTime);
    const handleLoadedMetadata = () => setDuration(nextAudioElement.duration);
    const handleError = (event: ErrorEvent) => setError(event.error);

    nextAudioElement.addEventListener('play', handlePlay);
    nextAudioElement.addEventListener('pause', handlePause);
    nextAudioElement.addEventListener('ended', handleEnded);
    nextAudioElement.addEventListener('timeupdate', handleTimeUpdate);
    nextAudioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    nextAudioElement.addEventListener('error', handleError);

    audioElementRef.current = nextAudioElement;
    audioSourceRef.current = nextAudioSource;

    nextAudioSource.connect(audioContextRef.current.destination);

    cleanUp.current = () => {
      audioElementRef.current?.removeEventListener('play', handlePlay);
      audioElementRef.current?.removeEventListener('pause', handlePause);
      audioElementRef.current?.removeEventListener('ended', handleEnded);
      audioElementRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      audioElementRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElementRef.current?.removeEventListener('error', handleError);
      audioSourceRef.current?.disconnect();
    };
  });

  useEffect(() => {
    if (loadAudioConfigMemo?.src) {
      load(loadAudioConfigMemo);
    }
  }, [load, loadAudioConfigMemo]);

  const play = useEvent(async () => {
    try {
      await audioElementRef.current?.play();
    } catch (e) {
      setError(e as Error);
    }
  });

  const pause = () => {
    audioElementRef.current?.pause();
  };

  const stop = () => {
    audioElementRef.current?.pause();
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const controls = useRef({
    play,
    pause,
    stop,
  });

  return {
    isPlaying,
    currentTime,
    duration,
    error,
    controls: controls.current,
    load,
  };
};

export default useAudioPlayback;
