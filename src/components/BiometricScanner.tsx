import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  KeyRound,
  Play,
  RotateCcw,
  Sparkles,
  Fingerprint,
  Check,
  Clock,
  Layers,
  ChevronRight,
  UserX,
  ScanFace,
  Volume2,
} from 'lucide-react';
import { BiometricStatus, EnrolledProfile, AuditLogEntry, EngineSettings } from '../types';
import { FaceScannerView } from './FaceScannerView';
import { VoiceAnalyzerView } from './VoiceAnalyzerView';
import { STANDARD_VERIFICATION_PHRASES } from '../data/mockBiometrics';
import { soundFx } from '../utils/soundEffects';

interface BiometricScannerProps {
  status: BiometricStatus;
  setStatus: (status: BiometricStatus) => void;
  selectedProfile: EnrolledProfile | null;
  setSelectedProfile: (p: EnrolledProfile | null) => void;
  allProfiles: EnrolledProfile[];
  onLogEntry: (entry: AuditLogEntry) => void;
  settings: EngineSettings;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  status,
  setStatus,
  selectedProfile,
  setSelectedProfile,
  allProfiles,
  onLogEntry,
  settings,
}) => {
  const [faceScore, setFaceScore] = useState<number>(98.8);
  const [voiceScore, setVoiceScore] = useState<number>(97.4);
  const [compositeScore, setCompositeScore] = useState<number>(98.1);
  const [isSimulatedSpoof, setIsSimulatedSpoof] = useState<boolean>(false);
  const [isInfrared, setIsInfrared] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [passphraseIndex, setPassphraseIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [grantedToken, setGrantedToken] = useState<string | null>(null);

  const activePassphrase = STANDARD_VERIFICATION_PHRASES[passphraseIndex];

  // Update scores when target profile or spoof state changes
  useEffect(() => {
    if (isSimulatedSpoof) {
      setFaceScore(82.4);
      setVoiceScore(38.0);
      setCompositeScore(31.2);
    } else if (selectedProfile) {
      if (selectedProfile.id === 'BIO-ID-8821') {
        setFaceScore(99.4);
        setVoiceScore(98.7);
        setCompositeScore(99.1);
      } else if (selectedProfile.id === 'BIO-ID-7409') {
        setFaceScore(97.8);
        setVoiceScore(96.9);
        setCompositeScore(97.4);
      } else {
        setFaceScore(96.2);
        setVoiceScore(95.8);
        setCompositeScore(96.0);
      }
    } else {
      setFaceScore(22.5);
      setVoiceScore(19.8);
      setCompositeScore(21.2);
    }
  }, [selectedProfile, isSimulatedSpoof]);

  // Execute biometric authentication workflow
  const runBiometricScan = () => {
    if (status !== 'idle' && status !== 'authenticated' && status !== 'rejected' && status !== 'spoof_detected') {
      return;
    }

    setStatus('scanning_face');
    setProgressPercent(15);
    soundFx.playScanBeep();

    setTimeout(() => {
      setProgressPercent(45);
      soundFx.playScanBeep();
    }, 800);

    setTimeout(() => {
      setStatus('listening_voice');
      setIsListeningVoice(true);
      setProgressPercent(65);
      soundFx.playVoiceSampleTick();
    }, 1600);

    setTimeout(() => {
      setIsListeningVoice(false);
      setStatus('analyzing');
      setProgressPercent(88);
      soundFx.playScanBeep();
    }, 2800);

    setTimeout(() => {
      setProgressPercent(100);
      const timestamp = new Date().toISOString().substring(11, 19) + ' UTC';

      if (isSimulatedSpoof) {
        setStatus('spoof_detected');
        soundFx.playDeniedWarning();
        onLogEntry({
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          subjectName: selectedProfile ? `${selectedProfile.name} (Spoof Attempt)` : 'Unknown Subject',
          department: 'Security Operations',
          clearance: 'Level 1 - Visitor',
          faceMatchScore: faceScore,
          voiceMatchScore: voiceScore,
          compositeScore: 28.4,
          livenessScore: 14.2,
          status: 'flagged',
          terminalId: 'PORTAL-MAIN-01',
          verificationMode: 'Dual Face + Voice',
          incidentNote: 'Anti-spoofing alert: Planar reflection and synthetic voice anomalies detected.',
        });
      } else if (!selectedProfile || compositeScore < settings.faceThreshold) {
        setStatus('rejected');
        soundFx.playDeniedWarning();
        onLogEntry({
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          subjectName: 'Unregistered Subject',
          department: 'External',
          clearance: 'Level 1 - Visitor',
          faceMatchScore: faceScore,
          voiceMatchScore: voiceScore,
          compositeScore,
          livenessScore: 94.1,
          status: 'denied',
          terminalId: 'PORTAL-MAIN-01',
          verificationMode: 'Dual Face + Voice',
          incidentNote: 'Biometric signatures do not match any enrolled personnel in the system.',
        });
      } else {
        setStatus('authenticated');
        soundFx.playSuccessChime();
        const token = `AUTH-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).substring(4).toUpperCase()}`;
        setGrantedToken(token);

        onLogEntry({
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          subjectName: selectedProfile.name,
          department: selectedProfile.department,
          clearance: selectedProfile.clearance,
          faceMatchScore: faceScore,
          voiceMatchScore: voiceScore,
          compositeScore,
          livenessScore: 99.4,
          status: 'granted',
          terminalId: 'PORTAL-MAIN-01',
          verificationMode: 'Dual Face + Voice',
        });
      }
    }, 3800);
  };

  const handleReset = () => {
    setStatus('idle');
    setProgressPercent(0);
    setGrantedToken(null);
    setIsListeningVoice(false);
    soundFx.playTone(600, 'sine', 0.05);
  };

  const handleScenarioPreset = (type: 'elena' | 'marcus' | 'unknown' | 'spoof') => {
    handleReset();
    if (type === 'elena') {
      setIsSimulatedSpoof(false);
      setSelectedProfile(allProfiles[0]);
    } else if (type === 'marcus') {
      setIsSimulatedSpoof(false);
      setSelectedProfile(allProfiles[1]);
    } else if (type === 'unknown') {
      setIsSimulatedSpoof(false);
      setSelectedProfile(null);
    } else if (type === 'spoof') {
      setIsSimulatedSpoof(true);
      setSelectedProfile(allProfiles[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Test Scenarios Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">
              Interactive Scenarios
            </span>
            <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
              Test different verification outcomes
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleScenarioPreset('elena')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              selectedProfile?.id === 'BIO-ID-8821' && !isSimulatedSpoof
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Dr. Vance (High Match)
          </button>
          <button
            onClick={() => handleScenarioPreset('marcus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              selectedProfile?.id === 'BIO-ID-7409' && !isSimulatedSpoof
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Marcus Chen (Standard)
          </button>
          <button
            onClick={() => handleScenarioPreset('unknown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              selectedProfile === null && !isSimulatedSpoof
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Unenrolled Guest
          </button>
          <button
            onClick={() => handleScenarioPreset('spoof')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isSimulatedSpoof
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            2D Screen Spoof
          </button>
        </div>
      </div>

      {/* Dual Scanner Viewports: Face (Left) & Voice (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FaceScannerView
          status={status}
          selectedProfile={selectedProfile}
          onSelectProfile={setSelectedProfile}
          allProfiles={allProfiles}
          faceMatchScore={faceScore}
          isSimulatedSpoof={isSimulatedSpoof}
          setIsSimulatedSpoof={setIsSimulatedSpoof}
          isInfrared={isInfrared}
          setIsInfrared={setIsInfrared}
        />

        <VoiceAnalyzerView
          status={status}
          voiceMatchScore={voiceScore}
          passphrase={activePassphrase}
          isListening={isListeningVoice}
          setIsListening={setIsListeningVoice}
          onVoiceSampleComplete={() => {
            setVoiceScore(Number((96.0 + Math.random() * 3.5).toFixed(1)));
          }}
        />
      </div>

      {/* Central Biometric Fusion Console & Scan Control Bar */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
          {/* Fusion Indicators */}
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Combined Biometric Confidence
                </span>
              </div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="text-slate-400 text-xs">Total Match:</span>
                <span
                  className={`font-mono ${
                    compositeScore >= settings.faceThreshold
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {compositeScore.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Clean multi-tier progress bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${faceScore * 0.5}%` }}
                title={`Face Match Factor: ${(faceScore * 0.5).toFixed(1)}%`}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${voiceScore * 0.5}%` }}
                title={`Voice Match Factor: ${(voiceScore * 0.5).toFixed(1)}%`}
              />
            </div>

            {/* Metric gauges */}
            <div className="grid grid-cols-3 gap-2.5 pt-0.5 text-xs text-slate-400">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span>Facial Match</span>
                <span className="text-slate-200 font-mono font-medium">{faceScore.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span>Voiceprint</span>
                <span className="text-slate-200 font-mono font-medium">{voiceScore.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span>Liveness Check</span>
                <span className={`font-mono font-medium ${isSimulatedSpoof ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isSimulatedSpoof ? '14.2% (Fail)' : '99.4% (Pass)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Trigger Group */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleReset}
              disabled={status === 'idle'}
              className="p-3 rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all"
              title="Reset Scanner"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={runBiometricScan}
              disabled={status !== 'idle' && status !== 'authenticated' && status !== 'rejected' && status !== 'spoof_detected'}
              className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                status === 'idle' || status === 'authenticated' || status === 'rejected' || status === 'spoof_detected'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Fingerprint className="w-5 h-5" />
              <span>
                {status === 'idle' && 'Begin Biometric Scan'}
                {status === 'scanning_face' && 'Scanning Face Contours...'}
                {status === 'listening_voice' && 'Analyzing Voiceprint...'}
                {status === 'analyzing' && 'Verifying Security Enclave...'}
                {(status === 'authenticated' || status === 'rejected' || status === 'spoof_detected') &&
                  'Scan Again'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Status Pipeline Stages */}
        {status !== 'idle' && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div
                className={`p-2 rounded-xl border transition-all ${
                  status === 'scanning_face'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-200'
                    : progressPercent >= 45
                    ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                1. Facial Geometry
              </div>

              <div
                className={`p-2 rounded-xl border transition-all ${
                  status === 'listening_voice'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-200'
                    : progressPercent >= 65
                    ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                2. Voice Acoustics
              </div>

              <div
                className={`p-2 rounded-xl border transition-all ${
                  status === 'analyzing'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-200'
                    : progressPercent >= 88
                    ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                3. Fusion Verification
              </div>

              <div
                className={`p-2 rounded-xl border transition-all ${
                  status === 'authenticated'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold'
                    : status === 'rejected' || status === 'spoof_detected'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 font-semibold'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                4. Identity Gate
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authentication Outcome Cards */}
      {status === 'authenticated' && selectedProfile && (
        <div className="relative rounded-2xl bg-slate-900/80 border border-emerald-500/40 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src={selectedProfile.avatar}
                alt={selectedProfile.name}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-sm"
              />
              <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-emerald-500 text-slate-950 shadow">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  Access Authorized
                </span>
                <span className="text-xs text-slate-400">
                  {selectedProfile.clearance}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {selectedProfile.name}
              </h2>
              <p className="text-xs text-slate-300">
                {selectedProfile.role} • {selectedProfile.department}
              </p>
              <p className="mt-1 text-xs text-blue-300">
                Session: <span className="font-mono">{grantedToken}</span>
              </p>
            </div>
          </div>

          {/* Verification Metrics Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-right">
            <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs">
              <div className="text-slate-400 text-[11px]">Match Score</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{compositeScore.toFixed(1)}%</div>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-sm"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Access Denied Outcome */}
      {status === 'rejected' && (
        <div className="rounded-2xl bg-slate-900/80 border border-rose-500/40 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
              <UserX className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  Identity Not Recognized
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Biometric Identity Not Enrolled
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mt-0.5">
                Neither the facial structure nor the voiceprint match any authorized personnel in the directory (minimum {settings.faceThreshold}% required).
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-200 text-xs font-medium transition-all"
          >
            Clear Notification
          </button>
        </div>
      )}

      {/* Spoof Attack Detected Outcome */}
      {status === 'spoof_detected' && (
        <div className="rounded-2xl bg-slate-900/80 border border-rose-500/60 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400 text-rose-300 shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-bold">
                  Presentation Attack Detected
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Spoof Defense Activated
              </h2>
              <p className="text-xs text-rose-200 max-w-xl mt-0.5">
                2D photo or recorded voice playback detected. Natural eye micro-saccades and volumetric facial depth were missing. Event logged to security audit.
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-rose-500 text-rose-300 text-xs font-semibold transition-all shrink-0"
          >
            Acknowledge Alert
          </button>
        </div>
      )}
    </div>
  );
};
