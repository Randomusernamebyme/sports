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

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraAvailable(true);
      setError(null);
    } catch (error: any) {
      console.error('無法啟動相機:', error);
      let errorMessage = '無法啟動相機';
      
      if (error.name === 'NotFoundError') {
        errorMessage = '找不到相機設備，請確保允許使用相機權限';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = '請允許使用相機權限以繼續';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '無法訪問相機，請確保沒有其他應用正在使用相機';
      }
      
      if (onError) {
        onError(errorMessage);
      }
      setIsCameraAvailable(false);
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      if (onError) {
        onError('無法獲取相機畫面');
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      if (onError) {
        onError('無法創建畫布上下文');
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(photoData);

      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error('拍照失敗:', error);
      if (onError) {
        onError('拍照失敗，請重試');
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
                onClick={capturePhoto}
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