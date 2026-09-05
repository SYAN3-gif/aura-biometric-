import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  Radio,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { BiometricStatus } from '../types';
import { soundFx } from '../utils/soundEffects';

interface VoiceAnalyzerViewProps {
  status: BiometricStatus;
  voiceMatchScore: number;
  passphrase: string;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  onVoiceSampleComplete?: () => void;
}

export const VoiceAnalyzerView: React.FC<VoiceAnalyzerViewProps> = ({
  status,
  voiceMatchScore,
  passphrase,
  isListening,
  setIsListening,
  onVoiceSampleComplete,
}) => {
  const [useRealMic, setUseRealMic] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [dbLevel, setDbLevel] = useState<number>(-42);
  const [fundamentalFreq, setFundamentalFreq] = useState<number>(142);
  const [phoneticMatch, setPhoneticMatch] = useState<number>(96.8);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop real mic utility
  const stopRealMic = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setUseRealMic(false);
  }, []);

  // Start real mic
  const startRealMic = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API unavailable in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setUseRealMic(true);
      soundFx.playScanBeep();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone permission denied';
      setMicError(msg);
      setUseRealMic(false);
    }
  };

  const toggleMic = () => {
    if (useRealMic) {
      stopRealMic();
    } else {
      startRealMic();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopRealMic();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stopRealMic]);

  // Silky Fluid Multi-Layer Bezier Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const isActive = isListening || status === 'listening_voice' || status === 'analyzing';
      const isAuth = status === 'authenticated';
      const isDenied = status === 'rejected' || status === 'spoof_detected';

      let amp = isActive ? 1.0 : 0.18;
      if (analyserRef.current && useRealMic) {
        analyserRef.current.getByteTimeDomainData(timeData);
        analyserRef.current.getByteFrequencyData(freqData);

        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        const avg = sum / freqData.length;
        const computedDb = Math.round(-60 + (avg / 255) * 55);
        setDbLevel(computedDb);
        if (avg > 15) {
          setFundamentalFreq(Math.round(120 + avg * 1.2));
          amp = Math.min(1.4, Math.max(0.2, avg / 60));
        }
      } else {
        const t = Date.now() / 200;
        if (isActive) {
          setDbLevel(Math.round(-18 + Math.sin(t) * 6));
          setFundamentalFreq(Math.round(145 + Math.sin(t * 0.5) * 10));
          amp = 0.85 + Math.sin(t * 2) * 0.25;
        } else {
          setDbLevel(-48);
          setFundamentalFreq(135);
          amp = 0.15;
        }
      }

      phase += isActive ? 0.05 : 0.02;

      // Color selection
      let primaryHue = '59, 130, 246'; // blue
      if (isAuth) {
        primaryHue = '16, 185, 129'; // emerald
      } else if (isDenied) {
        primaryHue = '239, 68, 68'; // rose
      }

      const centerY = height * 0.52;

      // Draw 3 layered organic waves with smooth Bezier curves
      const waveConfigs = [
        { freq: 1.2, speed: 1.0, opacity: 0.2, heightScale: 0.5 * amp },
        { freq: 2.0, speed: 1.4, opacity: 0.45, heightScale: 0.8 * amp },
        { freq: 1.6, speed: 0.8, opacity: 0.95, heightScale: 1.0 * amp, isMain: true },
      ];

      waveConfigs.forEach((cfg) => {
        ctx.beginPath();
        ctx.lineWidth = cfg.isMain ? 2.5 : 1.5;
        ctx.strokeStyle = `rgba(${primaryHue}, ${cfg.opacity})`;

        const points: [number, number][] = [];
        const step = 8;
        const maxWaveHeight = height * 0.38 * cfg.heightScale;

        for (let x = 0; x <= width; x += step) {
          // Window envelope so waves taper smoothly at edges
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * 0.015 * cfg.freq + phase * cfg.speed) * maxWaveHeight * envelope;
          points.push([x, y]);
        }

        // Connect points using smooth quadratic curves
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i][0] + points[i + 1][0]) / 2;
          const yc = (points[i][1] + points[i + 1][1]) / 2;
          ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
        }
        ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
        ctx.stroke();

        // Subtle gradient fill under main wave
        if (cfg.isMain) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          const fillGrad = ctx.createLinearGradient(0, centerY - maxWaveHeight, 0, height);
          fillGrad.addColorStop(0, `rgba(${primaryHue}, ${isActive ? 0.12 : 0.04})`);
          fillGrad.addColorStop(1, `rgba(${primaryHue}, 0)`);
          ctx.fillStyle = fillGrad;
          ctx.fill();
        }
      });

      // Subtle center reference line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isListening, status, useRealMic]);

  // Handle speak action
  const handleSpeakClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    soundFx.playVoiceSampleTick();

    setTimeout(() => {
      setIsListening(false);
      soundFx.playLockAcquired();
      if (onVoiceSampleComplete) onVoiceSampleComplete();
    }, 2800);
  };

  return (
    <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Voiceprint & Acoustic Spectrum</span>
              <span className={`inline-block w-2 h-2 rounded-full ${isListening ? 'bg-blue-400 animate-ping' : 'bg-emerald-400'}`} />
            </h3>
            <p className="text-xs text-slate-400">
              Harmonic Resonance & Phonetic Cadence
            </p>
          </div>
        </div>

        {/* Real Mic Toggle */}
        <button
          onClick={toggleMic}
          title={useRealMic ? 'Disable Live Microphone' : 'Enable Real Microphone'}
          className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all ${
            useRealMic
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {useRealMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{useRealMic ? 'Live Mic' : 'Simulated Voice'}</span>
        </button>
      </div>

      {/* Target Passphrase Card */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-blue-400 font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Passphrase Challenge:</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Confidence:</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {phoneticMatch.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-sm font-medium text-slate-100 tracking-wide flex items-center justify-between">
          <span>"{passphrase}"</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-normal">
            Phonetic Match
          </span>
        </div>
      </div>

      {/* Waveform Canvas Display */}
      <div className="relative w-full aspect-16/9 sm:aspect-16/8 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col justify-end p-2">
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(2,6,23,0.7)_100%)]" />

        {/* Canvas Visualizer */}
        <canvas
          ref={canvasRef}
          width={560}
          height={240}
          className="w-full h-full object-cover"
        />

        {/* Live Audio Telemetry Overlay */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Level</span>
              <span className={`font-mono font-medium ${dbLevel > -30 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {dbLevel} dB
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Pitch</span>
              <span className="font-mono text-blue-400 font-medium">{fundamentalFreq} Hz</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
            <span className="text-slate-400">Clarity</span>
            <span className="text-emerald-400 font-medium">Clear</span>
          </div>
        </div>

        {/* Status Indicator inside canvas */}
        {isListening && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/90 border border-blue-500/40 text-blue-200 text-xs backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-medium">Listening to spoken cadence...</span>
          </div>
        )}
      </div>

      {/* Voice Metrics & Action Bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Acoustic Metrics Strip */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div>
            <div className="text-[11px] text-slate-400">Voice Stability</div>
            <div className="text-slate-200 font-medium font-mono">0.42% <span className="text-emerald-400 text-[10px]">Optimal</span></div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[11px] text-slate-400">Shimmer Variance</div>
            <div className="text-slate-200 font-medium font-mono">1.18% <span className="text-emerald-400 text-[10px]">Optimal</span></div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[11px] text-slate-400">Voice Match</div>
            <div className={`font-semibold font-mono ${voiceMatchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {voiceMatchScore.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Speak / Capture Action */}
        <button
          onClick={handleSpeakClick}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
            isListening
              ? 'bg-blue-600 text-white shadow-sm animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80'
          }`}
        >
          <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce text-white' : 'text-blue-400'}`} />
          <span>{isListening ? 'Recording Voiceprint...' : 'Speak Passphrase'}</span>
        </button>
      </div>

      {micError && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs text-center">
          {micError}. Operating on synthetic harmonic analyzer.
        </div>
      )}
    </div>
  );
};
