'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onCapture: (photo: string) => void;
  onCancel: () => void;
}

export default function Camera({ onCapture, onCancel }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraAvailable(true);
      setError(null);
    } catch (err: any) {
      console.error('無法啟動相機:', err);
      setIsCameraAvailable(false);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('找不到相機設備，請使用照片上傳');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('請允許使用相機權限');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('無法訪問相機，請確保沒有其他應用程式正在使用相機');
      } else {
        setError('無法啟動相機，請使用照片上傳');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const photo = canvas.toDataURL('image/jpeg');
        setCapturedImage(photo);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        setError('請選擇圖片文件');
        return;
      }

      // 檢查文件大小（限制為 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photo = e.target?.result as string;
        setCapturedImage(photo);
        setError(null);
      };
      reader.onerror = () => {
        setError('讀取文件失敗，請重試');
      };
      reader.readAsDataURL(file);
    }
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
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <p className="text-gray-600 mb-4">{error || '相機不可用'}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  選擇照片
                </button>
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
    </div>
  );
} 