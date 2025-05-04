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

  // 初始化相機
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initCamera = async () => {
      try {
        setLoading(true);
        console.log('開始初始化相機...');

        // 檢查相機權限
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('可用的相機設備:', videoDevices);
        
        if (videoDevices.length === 0) {
          throw new Error('未找到可用的相機設備');
        }

        // 嘗試獲取相機訪問權限
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        console.log('嘗試獲取相機訪問權限...');
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!mediaStream) {
          throw new Error('無法訪問相機');
        }

        // 檢查視頻流是否有效
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error('無法獲取視頻流');
        }

        console.log('視頻流已獲取，設置視頻元素...');

        if (videoRef.current) {
          // 確保視頻元素已準備好
          videoRef.current.srcObject = null;
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 設置視頻流
          videoRef.current.srcObject = mediaStream;
          
          // 等待視頻元素加載完成
          await new Promise((resolve, reject) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log('視頻元數據已加載');
                resolve(true);
              };
              videoRef.current.onerror = (error) => {
                console.error('視頻元素錯誤:', error);
                reject(error);
              };
              
              // 設置超時
              setTimeout(() => {
                reject(new Error('視頻加載超時'));
              }, 5000);
            }
          });

          // 檢查視頻是否真的在播放
          await new Promise((resolve) => {
            const checkPlaying = () => {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                console.log('視頻正在播放');
                resolve(true);
              } else {
                console.log('等待視頻播放...');
                setTimeout(checkPlaying, 100);
              }
            };
            checkPlaying();
          });
        }

        setStream(mediaStream);
        setLoading(false);
        console.log('相機初始化成功');
      } catch (error) {
        console.error('初始化相機失敗:', error);
        
        // 清理現有的視頻流
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`重試初始化相機 (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initCamera, 1000);
        } else {
          onError('無法訪問相機，請確保已授予相機權限並重新整理頁面');
          setLoading(false);
        }
      }
    };

    initCamera();

    return () => {
      if (stream) {
        console.log('清理相機資源...');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
  }, [onError]);

  // 拍照
  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    try {
      setLoading(true);
      console.log('開始拍照...');

      // 檢查視頻流是否有效
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) {
        throw new Error('視頻流無效');
      }

      console.log('視頻尺寸:', video.videoWidth, 'x', video.videoHeight);

      // 設置 canvas 尺寸
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 繪製視頻幀到 canvas
      const context = canvas.getContext('2d');
      if (!context) throw new Error('無法獲取 canvas 上下文');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 轉換為 blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('無法生成圖片'));
        }, 'image/jpeg', 0.95);
      });

      console.log('圖片已生成，開始上傳...');

      // 上傳到 Firebase Storage
      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `photos/${user.uid}/${timestamp}.jpg`);
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);

      console.log('圖片上傳成功:', photoUrl);
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
            transform: 'scaleX(-1)', // 鏡像翻轉
            backgroundColor: 'transparent',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <canvas 
          ref={canvasRef} 
          className="hidden"
          style={{
            transform: 'scaleX(-1)', // 鏡像翻轉
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