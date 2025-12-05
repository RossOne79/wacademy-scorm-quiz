import React, { useState, useCallback } from 'react';
import { VideoData } from '../types';
import { UploadIcon, LinkIcon } from './icons';

interface UploadStepProps {
  onVideoProcessed: (data: VideoData, transcript: string | null) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ onVideoProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (['video/mp4', 'video/webm'].includes(selectedFile.type)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Seleziona un file media MP4 o WebM valido.');
        setFile(null);
      }
    }
  };

  const handleTranscriptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/plain') {
        setTranscriptFile(selectedFile);
        setError(null);
      } else {
        setError('Seleziona un file di testo (.txt) valido.');
        setTranscriptFile(null);
      }
    }
  };

  const processVideo = useCallback(async (videoFile: File, transcriptContent: string | null) => {
    setIsProcessing(true);
    setError(null);
    try {
      const url = URL.createObjectURL(videoFile);
      const video = document.createElement('video');
      video.src = url;

      const metadataPromise = new Promise<{ duration: number }>((resolve, reject) => {
        video.onloadedmetadata = () => resolve({ duration: video.duration });
        video.onerror = reject;
      });

      const { duration } = await metadataPromise;

      const thumbnailPromise = new Promise<string>((resolve, reject) => {
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg'));
          } else {
            reject(new Error('Could not get canvas context.'));
          }
        };
        video.currentTime = duration * 0.1; // Seek to 10% of video
      });

      const thumbnail = await thumbnailPromise;
      
      onVideoProcessed({ file: videoFile, url, thumbnail, duration }, transcriptContent);
    } catch (err) {
      setError('Impossibile elaborare il file media. Prova con un altro file.');
      console.error(err);
      setIsProcessing(false);
    }
  }, [onVideoProcessed]);
  
  const handleProceed = () => {
      if (file) {
        setIsProcessing(true);
        if (transcriptFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const transcriptContent = e.target?.result as string;
                processVideo(file, transcriptContent); 
            };
            reader.onerror = () => {
                setError('Impossibile leggere il file di trascrizione.');
                setIsProcessing(false);
            };
            reader.readAsText(transcriptFile);
        } else {
            processVideo(file, null);
        }
    } else {
        setError("Carica un file media per procedere.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Passo 1: Fornisci Contenuti</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Carica un media e, opzionalmente, una trascrizione.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Carica un file media (MP4/WebM)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Carica un file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="video/mp4,video/webm" onChange={handleFileChange} />
                </label>
                <p className="pl-1">o trascina e rilascia</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">MP4, WebM fino a 500MB</p>
            </div>
          </div>
          {file && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Media Selezionato: {file.name}</p>}
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. Carica una trascrizione (Opzionale, .txt)</label>
            <div className="mt-1">
                <input type="file" id="transcript-upload" name="transcript-upload" accept=".txt" onChange={handleTranscriptFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-gray-700 dark:file:text-gray-200 dark:hover:file:bg-gray-600"/>
            </div>
            {transcriptFile && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Trascrizione Selezionata: {transcriptFile.name}</p>}
        </div>

        <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">Oppure</span>
            </div>
        </div>

        <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incolla un URL media (presto disponibile)</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm">
                    <LinkIcon className="h-5 w-5"/>
                </span>
                <input type="text" name="video-url" id="video-url" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed" placeholder="https://www.youtube.com/watch?v=..." disabled value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="pt-4">
          <button
            onClick={handleProceed}
            disabled={!file || isProcessing}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
          >
            {isProcessing ? 'Elaborazione...' : 'Analizza Contenuto e Procedi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadStep;