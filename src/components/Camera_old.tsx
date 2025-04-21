'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onCapture: (photo: string) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
}

export default function Camera({ onCapture, onCancel, onError }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraAvailable(true);
      setError(null);
    } catch (err: any) {
      console.error('相機初始化失敗:', err);
      setError('無法訪問相機，請允許相機權限或使用上傳照片功能');
      setIsCameraAvailable(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });

        if (mounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err: any) {
        console.error('相機初始化失敗:', err);
        if (mounted) {
          setError('無法訪問相機，請允許相機權限或使用上傳照片功能');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const photo = canvas.toDataURL('image/jpeg');
    onCapture(photo);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onCapture(e.target.result as string);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('讀取照片失敗，請重試');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="relative bg-black w-full h-full">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 border-b border-red-400 text-red-700 px-4 py-2 z-10">
          {error}
        </div>
      )}
      
      {!capturedImage ? (
        <>
          {isCameraAvailable ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.play().catch(error => {
                  console.error('視頻播放失敗:', error);
                  if (onError) {
                    onError('無法啟動相機預覽');
                  }
                });
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <p className="text-gray-600 mb-4">{error || '相機不可用'}</p>
                <div className="space-y-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUploading ? '上傳中...' : '上傳照片'}
                  </button>
                  <button
                    onClick={onCancel}
                    className="block w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black to-transparent">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {isCameraAvailable && (
              <button
                onClick={handleCapture}
                className="p-4 rounded-full bg-white"
              >
                <div className="w-12 h-12 rounded-full border-4 border-indigo-600" />
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="預覽"
            className="w-full h-full object-contain"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black to-transparent">
            <button
              onClick={() => {
                setCapturedImage(null);
                setError(null);
                if (isCameraAvailable) {
                  startCamera();
                }
              }}
              className="flex-1 py-2 px-4 bg-white/20 text-white rounded-lg mr-2 hover:bg-white/30"
            >
              重拍
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg ml-2 hover:bg-indigo-700"
            >
              確認使用
            </button>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
} 