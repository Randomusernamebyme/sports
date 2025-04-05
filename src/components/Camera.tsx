'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface CameraProps {
  onCapture: (photo: string) => void;
  onCancel: () => void;
}

export default function Camera({ onCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('無法訪問相機，請確保已授予相機權限');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

    const photo = canvas.toDataURL('image/jpeg');
    onCapture(photo);
  };

  return (
    <div className="relative">
      {error ? (
        <div className="text-center p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            返回
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-center space-x-4">
            <button
              onClick={handleCapture}
              className="px-6 py-2 bg-white text-gray-900 rounded-full hover:bg-gray-100"
            >
              拍照
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </>
      )}
    </div>
  );
} 