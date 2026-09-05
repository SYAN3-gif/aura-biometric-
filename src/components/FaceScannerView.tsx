import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  VideoOff,
  Flame,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Crosshair,
} from 'lucide-react';
import { BiometricStatus, EnrolledProfile } from '../types';
import { soundFx } from '../utils/soundEffects';

interface FaceScannerViewProps {
  status: BiometricStatus;
  selectedProfile: EnrolledProfile | null;
  onSelectProfile: (profile: EnrolledProfile | null) => void;
  allProfiles: EnrolledProfile[];
  faceMatchScore: number;
  isSimulatedSpoof: boolean;
  setIsSimulatedSpoof: (val: boolean) => void;
  isInfrared: boolean;
  setIsInfrared: (val: boolean) => void;
}

export const FaceScannerView: React.FC<FaceScannerViewProps> = ({
  status,
  selectedProfile,
  onSelectProfile,
  allProfiles,
  faceMatchScore,
  isSimulatedSpoof,
  setIsSimulatedSpoof,
  isInfrared,
  setIsInfrared,
}) => {
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [pitch, setPitch] = useState<number>(0.6);
  const [yaw, setYaw] = useState<number>(-1.2);
  const [roll, setRoll] = useState<number>(0.1);
  const [pupilDistance, setPupilDistance] = useState<number>(63.8);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop media stream utility
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Request real camera
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser context.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUseWebcam(true);
      soundFx.playScanBeep();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Permission denied or camera unavailable';
      setWebcamError(msg);
      setUseWebcam(false);
    }
  };

  const toggleWebcamMode = () => {
    if (useWebcam) {
      stopWebcam();
      setUseWebcam(false);
    } else {
      startWebcam();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stopWebcam]);

  // Subtle real-time organic pose oscillation mimicking natural human micro-movement
  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now() / 1000;
      setYaw(Number((Math.sin(t * 1.3) * 1.5).toFixed(1)));
      setPitch(Number((Math.cos(t * 1.1) * 1.2).toFixed(1)));
      setRoll(Number((Math.sin(t * 0.7) * 0.5).toFixed(1)));
      setPupilDistance(Number((63.5 + Math.sin(t * 2) * 0.3).toFixed(1)));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Canvas drawing loop for organic facial contours & scanning aura
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let scanY = 0;
    let scanDirection = 1;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + (yaw * 2.5);
      const centerY = height / 2 + (pitch * 2.5);
      const faceRadiusX = width * 0.22;
      const faceRadiusY = height * 0.32;

      // Status-driven theme colors
      const isScanning = status === 'scanning_face' || status === 'analyzing';
      const isAuth = status === 'authenticated';
      const isDenied = status === 'rejected' || status === 'spoof_detected';

      let strokeColor = 'rgba(59, 130, 246, 0.65)';
      let pointColor = 'rgba(96, 165, 250, 0.9)';
      if (isAuth) {
        strokeColor = 'rgba(16, 185, 129, 0.85)';
        pointColor = 'rgba(52, 211, 153, 1)';
      } else if (isDenied) {
        strokeColor = 'rgba(239, 68, 68, 0.85)';
        pointColor = 'rgba(248, 113, 113, 1)';
      } else if (isScanning) {
        strokeColor = 'rgba(96, 165, 250, 0.95)';
        pointColor = 'rgba(59, 130, 246, 1)';
      }

      // 1. Natural Face ID Oval Contour with soft segmented guide ticks
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, faceRadiusX, faceRadiusY, roll * (Math.PI / 180), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 2. Fluid sweep light during active scan
      if (isScanning) {
        scanY += 3.2 * scanDirection;
        if (scanY > faceRadiusY * 2) {
          scanDirection = -1;
        } else if (scanY < 0) {
          scanDirection = 1;
        }

        const currentScanY = (centerY - faceRadiusY) + scanY;
        const beamGrad = ctx.createLinearGradient(centerX - faceRadiusX, currentScanY, centerX + faceRadiusX, currentScanY);
        beamGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
        beamGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.7)');
        beamGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - faceRadiusX * 0.9, currentScanY);
        ctx.lineTo(centerX + faceRadiusX * 0.9, currentScanY);
        ctx.stroke();

        const glowGrad = ctx.createRadialGradient(centerX, currentScanY, 2, centerX, currentScanY, faceRadiusX * 0.8);
        glowGrad.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
        glowGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(centerX - faceRadiusX, currentScanY - 18, faceRadiusX * 2, 36);
      }

      // 3. Natural Organic Facial Contours (Eyes, Eyebrows, Nose, Lips, Jaw)
      const eyeOffsetX = faceRadiusX * 0.42;
      const eyeOffsetY = -faceRadiusY * 0.12;
      const leftEyeCenter: [number, number] = [centerX - eyeOffsetX, centerY + eyeOffsetY];
      const rightEyeCenter: [number, number] = [centerX + eyeOffsetX, centerY + eyeOffsetY];

      // Eyebrows
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(leftEyeCenter[0] - 20, leftEyeCenter[1] - 16);
      ctx.quadraticCurveTo(leftEyeCenter[0], leftEyeCenter[1] - 22, leftEyeCenter[0] + 18, leftEyeCenter[1] - 14);
      ctx.moveTo(rightEyeCenter[0] - 18, rightEyeCenter[1] - 14);
      ctx.quadraticCurveTo(rightEyeCenter[0], rightEyeCenter[1] - 22, rightEyeCenter[0] + 20, rightEyeCenter[1] - 16);
      ctx.stroke();

      // Eyes (Almond contours + iris ring & pupil)
      [leftEyeCenter, rightEyeCenter].forEach(([ex, ey]) => {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ex - 15, ey);
        ctx.quadraticCurveTo(ex, ey - 8, ex + 15, ey);
        ctx.quadraticCurveTo(ex, ey + 8, ex - 15, ey);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ex, ey, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Nose Bridge & Tip Contour
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + eyeOffsetY + 4);
      ctx.lineTo(centerX, centerY + faceRadiusY * 0.16);
      ctx.quadraticCurveTo(centerX - 10, centerY + faceRadiusY * 0.22, centerX, centerY + faceRadiusY * 0.24);
      ctx.quadraticCurveTo(centerX + 10, centerY + faceRadiusY * 0.22, centerX, centerY + faceRadiusY * 0.16);
      ctx.stroke();

      // Lips
      const mouthY = centerY + faceRadiusY * 0.44;
      ctx.beginPath();
      ctx.moveTo(centerX - 20, mouthY);
      ctx.quadraticCurveTo(centerX, mouthY - 6, centerX + 20, mouthY);
      ctx.quadraticCurveTo(centerX, mouthY + 8, centerX - 20, mouthY);
      ctx.stroke();

      // Jawline
      ctx.beginPath();
      ctx.moveTo(centerX - faceRadiusX * 0.78, centerY - faceRadiusY * 0.1);
      ctx.quadraticCurveTo(centerX - faceRadiusX * 0.72, centerY + faceRadiusY * 0.5, centerX, centerY + faceRadiusY * 0.88);
      ctx.quadraticCurveTo(centerX + faceRadiusX * 0.72, centerY + faceRadiusY * 0.5, centerX + faceRadiusX * 0.78, centerY - faceRadiusY * 0.1);
      ctx.stroke();

      // Natural landmark points with subtle organic micro-breathing
      const t = Date.now() / 1000;
      const microJitter = Math.sin(t * 3) * 0.6;

      const landmarks: [number, number][] = [
        [centerX - 35, centerY - faceRadiusY * 0.55],
        [centerX, centerY - faceRadiusY * 0.6 + microJitter],
        [centerX + 35, centerY - faceRadiusY * 0.55],
        [centerX - faceRadiusX * 0.75, centerY - faceRadiusY * 0.3],
        [centerX + faceRadiusX * 0.75, centerY - faceRadiusY * 0.3],
        [centerX - faceRadiusX * 0.5, centerY + faceRadiusY * 0.15],
        [centerX + faceRadiusX * 0.5, centerY + faceRadiusY * 0.15],
        [centerX, centerY + faceRadiusY * 0.88 + microJitter],
      ];

      ctx.fillStyle = pointColor;
      landmarks.forEach(([lx, ly]) => {
        ctx.beginPath();
        ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [yaw, pitch, roll, status]);

  // Natural human status label
  const getStatusGuide = () => {
    if (isSimulatedSpoof) return { text: 'Spoof Detection Active: 2D Image Attack', color: 'text-amber-400' };
    switch (status) {
      case 'scanning_face':
        return { text: 'Scanning facial contours • Hold still', color: 'text-blue-400' };
      case 'analyzing':
        return { text: 'Analyzing volumetric biometrics', color: 'text-blue-400' };
      case 'authenticated':
        return { text: 'Facial Biometrics Verified', color: 'text-emerald-400' };
      case 'spoof_detected':
        return { text: 'Liveness Rejected • Static Screen Detected', color: 'text-rose-400' };
      case 'rejected':
        return { text: 'Face Not Enrolled in Registry', color: 'text-rose-400' };
      default:
        return { text: 'Position face within the oval guide', color: 'text-slate-300' };
    }
  };

  const statusGuide = getStatusGuide();

  return (
    <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Top Header & Sensor Controls */}
      <div className="flex items-center justify-between gap-2 mb-3 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Facial Recognition & Liveness</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">
              3D Contour & Micro-saccade Tracking
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Infrared Mode Toggle */}
          <button
            onClick={() => {
              setIsInfrared(!isInfrared);
              soundFx.playScanBeep();
            }}
            title="Toggle Thermographic Infrared Liveness Scan"
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
              isInfrared
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">IR Thermal</span>
          </button>

          {/* Webcam Toggle */}
          <button
            onClick={toggleWebcamMode}
            title={useWebcam ? 'Switch to Enrolled Subject Photo' : 'Use Live Camera'}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
              useWebcam
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {useWebcam ? <Camera className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{useWebcam ? 'Live Camera' : 'Preset Subject'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* Soft Vignette Overlay for Apple Face ID Look */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_45%,_rgba(2,6,23,0.85)_100%)]" />

        {/* Video stream if webcam active */}
        {useWebcam && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
              isInfrared ? 'filter hue-rotate-180 contrast-150 saturate-200 brightness-90' : ''
            }`}
          />
        )}

        {/* Subject Portrait Display */}
        {!useWebcam && (
          <div className="absolute inset-0 flex items-center justify-center select-none overflow-hidden">
            {isSimulatedSpoof ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900/90">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop"
                  alt="Spoof Face Print"
                  className={`w-64 h-64 sm:w-72 sm:h-72 object-cover rounded-2xl border-2 border-dashed border-amber-500/60 opacity-85 brightness-90 contrast-125 ${
                    isInfrared ? 'filter hue-rotate-180 invert brightness-75' : ''
                  }`}
                />
                <div className="absolute bottom-4 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>2D Paper / Screen Presentation Attack</span>
                </div>
              </div>
            ) : selectedProfile ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedProfile.avatar}
                  alt={selectedProfile.name}
                  className={`w-full h-full object-cover object-top opacity-80 filter contrast-105 ${
                    isInfrared ? 'hue-rotate-180 contrast-150 saturate-200 brightness-90' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/40" />
              </div>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500">
                <div className="w-36 h-36 rounded-full border border-dashed border-slate-700 flex items-center justify-center bg-slate-900/40">
                  <Eye className="w-12 h-12 text-slate-600 animate-pulse" />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Waiting for face detection...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Biometric Interactive Mesh Canvas */}
        <canvas
          ref={canvasRef}
          width={640}
          height={400}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Viewport HUD Overlays */}
        {/* Top-left Telemetry: Pose Angle */}
        <div className="absolute top-3.5 left-3.5 z-20 text-[11px] bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Yaw</span>
            <span className="font-mono text-blue-400 font-medium">{yaw > 0 ? `+${yaw}` : yaw}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Pitch</span>
            <span className="font-mono text-blue-400 font-medium">{pitch > 0 ? `+${pitch}` : pitch}°</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400">IPD</span>
            <span className="font-mono text-slate-300 font-medium">{pupilDistance}mm</span>
          </div>
        </div>

        {/* Top-right Status Pill */}
        <div className="absolute top-3.5 right-3.5 z-20 text-[11px] flex items-center gap-2">
          {isInfrared && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
              IR 36.6°C
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-blue-300 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span>68 Landmarks</span>
          </span>
        </div>

        {/* Center Live Guidance Message */}
        <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-xs flex items-center gap-2 shadow-sm">
            <span className={`font-medium ${statusGuide.color}`}>
              {statusGuide.text}
            </span>
          </div>
        </div>

        {/* Bottom Liveness & Match Score Bar */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800">
            {isSimulatedSpoof ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 font-medium">2D Reflection Detected</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Liveness Confirmed</span>
              </>
            )}
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-400">Match:</span>
            <span className={`font-semibold font-mono ${faceMatchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {faceMatchScore.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Webcam Error Notification */}
        {webcamError && (
          <div className="absolute inset-x-4 top-12 z-30 p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs text-center">
            {webcamError}. Defaulting to synthetic biometric simulator.
          </div>
        )}
      </div>

      {/* Identity Selector & Simulation Controls */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-medium text-slate-300">
            Select Subject Profile:
          </span>
          <button
            onClick={() => {
              setIsSimulatedSpoof(!isSimulatedSpoof);
              soundFx.playTone(isSimulatedSpoof ? 600 : 300, 'sawtooth', 0.1);
            }}
            className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
              isSimulatedSpoof
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 font-medium'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isSimulatedSpoof ? 'Simulating Spoof' : 'Test Spoof Attack'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allProfiles.map((p) => {
            const isSelected = selectedProfile?.id === p.id && !isSimulatedSpoof;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setIsSimulatedSpoof(false);
                  onSelectProfile(p);
                  soundFx.playScanBeep();
                }}
                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700/60"
                />
                <div className="min-w-0 overflow-hidden">
                  <div className="text-xs font-medium truncate text-slate-200">
                    {p.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {p.clearance.split(' ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
