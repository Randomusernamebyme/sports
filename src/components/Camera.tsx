'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CameraProps {
  onCapture: (photoUrl: string) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export default function Camera({ onCapture, onCancel, onError }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const initCamera = async () => {
      try {
        setLoading(true);

        // 獲取相機訪問權限
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!mediaStream) {
          throw new Error('無法訪問相機');
        }

        // 設置視頻流
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        setStream(mediaStream);
        setLoading(false);
      } catch (error) {
        console.error('初始化相機失敗:', error);
        onError('無法訪問相機，請確保已授予相機權限');
        setLoading(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    try {
      setLoading(true);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('無法獲取 canvas 上下文');

      // 設置 canvas 尺寸
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 繪製視頻幀
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 轉換為 blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('無法生成圖片'));
        }, 'image/jpeg', 0.95);
      });

      // 上傳到 Firebase Storage
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `photos/${user.uid}/${timestamp}.jpg`);
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);

      onCapture(photoUrl);
    } catch (error) {
      console.error('拍照失敗:', error);
      onError('拍照失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">載入相機中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{
            transform: 'scaleX(-1)',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        <canvas 
          ref={canvasRef} 
          className="hidden"
          style={{
            transform: 'scaleX(-1)',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={takePhoto}
            className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-100"
          >
            拍照
          </button>
        </div>
      </div>
    </div>
  );
} 