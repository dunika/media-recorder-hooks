import { useState, useRef, useCallback, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const load = useCallback(async () => {
    if (loaded) {
      return;
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    setLoaded(true);
  }, [loaded]);

  useEffect(() => {
    load();
  }, []);

  const transcode = useCallback(async (inputFile: File, extension: string) => {
    if (!inputFile) {
      throw new Error('No input file provided');
    }

    const ffmpeg = ffmpegRef.current;
    const inputFileName = inputFile.name;
    const outputFileName = inputFileName.replace(/\.[^/.]+$/, extension);

    await ffmpeg.writeFile(inputFileName, new Uint8Array(await inputFile.arrayBuffer()));

    await ffmpeg.exec(['-i', inputFileName, outputFileName]);

    // Uint8Array
    const data = await ffmpeg.readFile(outputFileName);
    return data
  }, []);

  return {
    loaded,
    load,
    transcode
  };
};

export default useFFmpeg;
