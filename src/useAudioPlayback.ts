import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import useEvent from './useEvent.ts';

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

export const useAudioPlayback = (loadAudioConfig?: LoadAudioConfig): UseAudioPlayback => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const loadAudioConfigMemo = useMemoLoadAudioConfig(loadAudioConfig);

  const cleanUp = useCallback(async () => {
    await audioContext?.close();
    audioElement?.remove();
    audioSource?.disconnect();
  }, [audioContext, audioElement, audioSource]);


  const reset = useCallback(async () => {
    await cleanUp()

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setAudioElement(null);
    setAudioSource(null);
  }, [cleanUp]);

  useEffect(() => {
    return () => {
      cleanUp();
    }
  }, [cleanUp]);

  useEffect(() => {
    const eventListeners: { element: EventTarget, event: string, handler: EventListenerOrEventListenerObject }[] = [];

    const addEventListener = (element: EventTarget, event: string, handler: EventListenerOrEventListenerObject) => {
      element.addEventListener(event, handler);
      eventListeners.push({ element, event, handler });
    }

    const load = async () => {
      reset();

      const { src, onFinished, deviceId } = loadAudioConfigMemo || {};

      if (src === null) {
        setError(new Error('No source provided'));
        return;
      }


      const audioContext = new AudioContext();

      const audioElement = new Audio(src);

      try {
        if (deviceId) {
          await audioElement.setSinkId(deviceId);
        }
      } catch (e) {
        setError(e as Error);
        return;
      }

      const audioSource = audioContext.createMediaElementSource(audioElement);

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onFinished?.();
      };
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime);
      const handleLoadedMetadata = () => setDuration(audioElement.duration);
      const handleError = (event: Event) => setError((event as ErrorEvent).error);

      addEventListener(audioElement, 'play', handlePlay);
      addEventListener(audioElement, 'pause', handlePause);
      addEventListener(audioElement, 'ended', handleEnded);
      addEventListener(audioElement, 'timeupdate', handleTimeUpdate);
      addEventListener(audioElement, 'loadedmetadata', handleLoadedMetadata);
      addEventListener(audioElement, 'error', handleError);

      audioSource.connect(audioContext.destination);

      setAudioContext(audioContext);
      setAudioElement(audioElement);
      setAudioSource(audioSource);
    }

    load();

    return () => {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    };
  }, [loadAudioConfigMemo]);


  const play = useEvent(async () => {
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }

    try {
      await audioElement?.play();
    } catch (e) {
      setError(e as Error);
    }
  });

  const pause = () => {
    audioElement?.pause();
  };

  const stop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const controls = {
    play,
    pause,
    stop,
  };

  return {
    isPlaying,
    currentTime,
    duration,
    error,
    controls,
  };
};


