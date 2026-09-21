import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, X, RotateCcw, Check, RefreshCw, AlertTriangle, 
  Upload, Sparkles, FlipHorizontal, Eye
} from 'lucide-react';

interface CameraAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onPhotoCaptured: (photoDataUrl: string) => void;
  userName?: string;
  language?: 'en' | 'vi';
}

export default function CameraAvatarModal({
  isOpen,
  onClose,
  currentPhotoUrl,
  onPhotoCaptured,
  userName = 'User',
  language = 'vi'
}: CameraAvatarModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const t = {
    vi: {
      title: 'Chụp Ảnh Đại Diện Bằng Camera',
      subtitle: 'Tự chụp ảnh khuôn mặt để làm avatar hồ sơ cá nhân',
      startCamera: 'Khởi động Camera',
      takeSnapshot: 'Chụp ảnh ngay',
      countdownBtn: 'Hẹn giờ 3s',
      retake: 'Chụp lại',
      applyAvatar: 'Lưu làm Avatar',
      cancel: 'Hủy',
      mirrorToggle: 'Lật gương',
      switchCam: 'Đổi Camera',
      orUpload: 'Hoặc tải ảnh từ máy tính',
      cameraActive: 'Camera đang kết nối',
      previewTitle: 'Xem trước ảnh đại diện',
      permissionDenied: 'Không thể truy cập Camera. Vui lòng cho phép quyền Camera trên trình duyệt của bạn hoặc thử tải ảnh lên.',
      notFound: 'Không tìm thấy thiết bị Camera trên máy này. Bạn có thể tải ảnh có sẵn từ máy tính.',
      retrying: 'Đang kết nối Camera...',
      currentAvatar: 'Ảnh hiện tại',
      newAvatar: 'Ảnh mới'
    },
    en: {
      title: 'Take Profile Photo with Camera',
      subtitle: 'Capture a portrait snapshot to use as your profile avatar',
      startCamera: 'Start Camera',
      takeSnapshot: 'Take Photo',
      countdownBtn: '3s Timer',
      retake: 'Retake',
      applyAvatar: 'Save as Avatar',
      cancel: 'Cancel',
      mirrorToggle: 'Mirror',
      switchCam: 'Switch Camera',
      orUpload: 'Or upload image from device',
      cameraActive: 'Camera Active',
      previewTitle: 'Avatar Preview',
      permissionDenied: 'Camera access denied. Please grant camera permission in your browser or upload an image.',
      notFound: 'No camera hardware detected. You can upload an image from your device.',
      retrying: 'Connecting camera...',
      currentAvatar: 'Current Avatar',
      newAvatar: 'New Avatar'
    }
  }[language];

  // Stop media stream utility
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      setStream(null);
    }
    setCameraActive(false);
  };

  // Check device cameras availability
  const checkCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }
    } catch (e) {}
  };

  // Start Camera
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopStream();
    setErrorMsg(null);
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(t.notFound);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
      checkCameras();
    } catch (err: any) {
      console.warn('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg(t.permissionDenied);
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg(t.notFound);
      } else {
        setErrorMsg(err.message || t.permissionDenied);
      }
      setCameraActive(false);
    }
  };

  // Launch camera automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setErrorMsg(null);
      startCamera(cameraFacing);
    } else {
      stopStream();
      setIsCountingDown(false);
    }
    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Handle camera switch front/back
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    setIsMirrored(nextFacing === 'user');
    startCamera(nextFacing);
  };

  // Flash sound & visual
  const triggerFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // Subtle audio click using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  // Capture frame to canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    const size = 320; // 320x320 optimal square avatar size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    triggerFlash();

    // Source coordinates for centered square cropping
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const cropSize = Math.min(vWidth, vHeight);
    const sx = (vWidth - cropSize) / 2;
    const sy = (vHeight - cropSize) / 2;

    ctx.save();
    if (isMirrored) {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, size, size);
    ctx.restore();

    // Export clean JPEG data URL (~25KB)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopStream();
  };

  // 3-second countdown snap
  const startCountdown = () => {
    if (isCountingDown) return;
    setIsCountingDown(true);
    setCountdown(3);

    let current = 3;
    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(interval);
        setIsCountingDown(false);
        capturePhoto();
      }
    }, 1000);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(cameraFacing);
  };

  // Save and apply
  const handleSave = () => {
    if (capturedImage) {
      onPhotoCaptured(capturedImage);
      stopStream();
      onClose();
    }
  };

  // File upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cropSize = Math.min(img.width, img.height);
        const sx = (img.width - cropSize) / 2;
        const sy = (img.height - cropSize) / 2;

        ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
        const optimized = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(optimized);
        stopStream();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      id="camera-avatar-modal"
    >
      <div 
        className="relative w-full max-w-lg bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col"
        id="camera-modal-card"
      >
        {/* Shutter Flash Overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.title}</h3>
              <p className="text-[11px] text-gray-400">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            id="camera-modal-close-btn"
            title={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Camera Viewport */}
        <div className="p-6 space-y-4">
          {/* Main Stage */}
          <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-white/10 shadow-inner flex items-center justify-center">
            {/* Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <span className="text-6xl sm:text-7xl font-black font-mono text-sky-400 animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            {/* Error Display */}
            {errorMsg ? (
              <div className="p-6 text-center space-y-3 z-20">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-gray-300 leading-relaxed font-medium">{errorMsg}</p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => startCamera(cameraFacing)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    id="camera-retry-btn"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.retrying}</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    id="camera-upload-fallback-btn"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.orUpload}</span>
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              /* Captured Image Preview */
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950">
                <img 
                  src={capturedImage} 
                  alt="Captured Avatar Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-sky-500/40 rounded-2xl pointer-events-none" />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{t.previewTitle}</span>
                </div>
              </div>
            ) : (
              /* Live Camera Stream */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />

                {/* Viewfinder Circular Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Subtle darkening outside the circle */}
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-dashed border-sky-400/60 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)] relative flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                    {/* Reticle tick marks */}
                    <div className="absolute top-0 w-4 h-0.5 bg-sky-400" />
                    <div className="absolute bottom-0 w-4 h-0.5 bg-sky-400" />
                    <div className="absolute left-0 w-0.5 h-4 bg-sky-400" />
                    <div className="absolute right-0 w-0.5 h-4 bg-sky-400" />
                  </div>
                </div>

                {/* Camera Status Badge */}
                <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{t.cameraActive}</span>
                </div>

                {/* In-view controls (Mirror & Flip) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-all cursor-pointer ${
                      isMirrored ? 'bg-sky-500/30 border-sky-400 text-sky-200' : 'bg-slate-900/80 border-white/10 text-gray-300'
                    }`}
                    title={t.mirrorToggle}
                    id="camera-mirror-toggle-btn"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                      title={t.switchCam}
                      id="camera-switch-facing-btn"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Hidden Canvas & File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
            id="camera-file-input"
          />

          {/* Comparison Thumbnail Bar when captured */}
          {capturedImage && currentPhotoUrl && (
            <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={currentPhotoUrl} 
                  alt="Current" 
                  className="w-10 h-10 rounded-full object-cover border border-white/20 bg-slate-900" 
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 uppercase font-mono">{t.currentAvatar}</p>
                  <p className="text-xs font-bold text-gray-300 truncate max-w-[120px]">{userName}</p>
                </div>
              </div>
              <span className="text-gray-500 font-mono text-sm">&rarr;</span>
              <div className="flex items-center gap-2">
                <img 
                  src={capturedImage} 
                  alt="New" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]" 
                />
                <div className="text-left">
                  <p className="text-[10px] text-sky-400 uppercase font-mono font-bold">{t.newAvatar}</p>
                  <p className="text-xs font-bold text-white">Camera Snapshot</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-gray-400 hover:text-sky-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            id="camera-pick-file-link"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.orUpload}</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            {capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  id="camera-retake-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.retake}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                  id="camera-save-avatar-btn"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.applyAvatar}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!cameraActive || isCountingDown}
                  onClick={startCountdown}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  id="camera-countdown-btn"
                >
                  <span>{t.countdownBtn}</span>
                </button>
                <button
                  type="button"
                  disabled={!cameraActive || isCountingDown}
                  onClick={capturePhoto}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  id="camera-snap-btn"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.takeSnapshot}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
