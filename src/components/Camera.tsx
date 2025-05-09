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
  const [cameraLabel, setCameraLabel] = useState<string>('');
  const [debugMsg, setDebugMsg] = useState<string>('');
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let activeStream: MediaStream | null = null;
    let triedFront = false;

    const stopStream = (s: MediaStream | null) => {
      if (s) s.getTracks().forEach(track => track.stop());
    };

    const initCamera = async () => {
      setLoading(true);
      setDebugMsg('正在初始化相機...');
      try {
        // 先 unlock label
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length === 0) throw new Error('找不到任何攝像頭');

        const backCamera = videoDevices.find(d => /back|environment/i.test(d.label));
        const frontCamera = videoDevices.find(d => /front|user/i.test(d.label));
        let deviceId = backCamera?.deviceId || videoDevices[0].deviceId;
        let label = backCamera?.label || videoDevices[0].label || '未知攝像頭';

        setDebugMsg('嘗試啟動攝像頭: ' + label);
        setCameraLabel(label);

        let constraints = {
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        try {
          activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          if (!triedFront && frontCamera) {
            triedFront = true;
            setDebugMsg('後鏡頭啟動失敗，改用前鏡頭: ' + frontCamera.label);
            constraints.video.deviceId = { exact: frontCamera.deviceId };
            activeStream = await navigator.mediaDevices.getUserMedia(constraints);
            setCameraLabel(frontCamera.label);
          } else {
            throw e;
          }
        }

        if (!activeStream) throw new Error('無法啟動攝像頭');

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            const v = videoRef.current!;
            setDebugMsg(`✅ loadedmetadata 觸發 → videoWidth: ${v.videoWidth}, videoHeight: ${v.videoHeight}, readyState: ${v.readyState}, srcObject: ${v.srcObject ? '有' : '無'}`);
            setLoading(false);
          };
        }

        if (isMountedRef.current) {
          setStream(activeStream);
        }
      } catch (error: any) {
        setDebugMsg('啟動攝像頭失敗: ' + (error?.message || error));
        onError('無法訪問相機，請檢查瀏覽器權限或裝置設定');
        setLoading(false);
      }
    };

    initCamera();

    return () => {
      isMountedRef.current = false;
      stopStream(activeStream);
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
      if (!video.videoWidth || !video.videoHeight) {
        setDebugMsg('錯誤：相機畫面未正確加載');
        onError('畫面載入失敗，請確認權限或重新整理');
        setLoading(false);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('無法生成圖片'));
        }, 'image/jpeg', 0.95);
      });

      const timestamp = new Date().getTime();
      const storageRef = ref(storage, `photos/${user.uid}/${timestamp}.jpg`);
      await uploadBytes(storageRef, blob);
      const photoUrl = await getDownloadURL(storageRef);
      onCapture(photoUrl);
    } catch (error) {
      setDebugMsg('拍照失敗：' + (error instanceof Error ? error.message : String(error)));
      onError('拍照失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white">載入相機中...</p>
            {debugMsg && <p className="mt-2 text-xs text-gray-300 text-center whitespace-pre-line">{debugMsg}</p>}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                background: 'black'
              }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              攝像頭：{cameraLabel || '未知'}
            </div>
            {debugMsg && <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-yellow-200 text-xs px-2 py-1 rounded max-w-xs text-right whitespace-pre-line">{debugMsg}</div>}
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
          </>
        )}
      </div>
    </div>
  );
}
