import React, { useState } from 'react';
import {
  X,
  User,
  Camera,
  Mic,
  Shield,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { EnrolledProfile, SecurityClearance } from '../types';
import { soundFx } from '../utils/soundEffects';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (profile: EnrolledProfile) => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Cybersecurity Research');
  const [role, setRole] = useState('Security Operations Analyst');
  const [clearance, setClearance] = useState<SecurityClearance>('Level 3 - Operator');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop');
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [voiceCaptured, setVoiceCaptured] = useState(false);
  const [isSamplingVoice, setIsSamplingVoice] = useState(false);

  if (!isOpen) return null;

  const handleCaptureFace = () => {
    soundFx.playScanBeep();
    setFaceCaptured(true);
    soundFx.playLockAcquired();
  };

  const handleSampleVoice = () => {
    setIsSamplingVoice(true);
    soundFx.playVoiceSampleTick();
    setTimeout(() => {
      setIsSamplingVoice(false);
      setVoiceCaptured(true);
      soundFx.playLockAcquired();
    }, 2000);
  };

  const handleFinalize = () => {
    const newId = `BIO-ID-${Math.floor(2000 + Math.random() * 7000)}`;
    const faceHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const voiceHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newProfile: EnrolledProfile = {
      id: newId,
      name: name || 'Agent Alex Thorne',
      department,
      role,
      clearance,
      avatar: avatarUrl,
      faceVectorHash: faceHash,
      voiceprintHash: voiceHash,
      enrolledAt: 'Just now',
      lastAccess: 'Never',
      status: 'active',
      matchPresetKey: 'custom_' + Date.now(),
    };

    onEnroll(newProfile);
    soundFx.playSuccessChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-500/40 text-blue-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Biometric Identity Enrollment Wizard
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px]">
          <div className={`p-1.5 rounded border ${step === 1 ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            1. Identity
          </div>
          <div className={`p-1.5 rounded border ${step === 2 ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            2. Face Mesh
          </div>
          <div className={`p-1.5 rounded border ${step === 3 ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            3. Voiceprint
          </div>
          <div className={`p-1.5 rounded border ${step === 4 ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            4. Enclave Lock
          </div>
        </div>

        {/* Step 1: Personal & Clearance Metadata */}
        {step === 1 && (
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Full Personnel Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Alex Thorne"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Role Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Security Clearance Tier</label>
              <select
                value={clearance}
                onChange={(e) => setClearance(e.target.value as SecurityClearance)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Level 2 - Staff">Level 2 - Staff</option>
                <option value="Level 3 - Operator">Level 3 - Operator</option>
                <option value="Level 4 - Executive">Level 4 - Executive</option>
                <option value="Level 5 - Director">Level 5 - Director</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => {
                  setStep(2);
                  soundFx.playScanBeep();
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Proceed to Face Capture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Facial Vector Capture */}
        {step === 2 && (
          <div className="space-y-4 text-center font-mono">
            <div className="relative mx-auto w-40 h-40 rounded-2xl overflow-hidden border-2 border-blue-500/60 bg-slate-950 flex items-center justify-center">
              <img src={avatarUrl} alt="Subject Face" className="w-full h-full object-cover" />
              {faceCaptured && (
                <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-8 h-8 mb-1" />
                  <span className="text-[11px] font-bold">68 POINTS ENCODED</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Align subject within optical reticle. Calibrating interpupillary distance and volumetric 3D coordinates.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCaptureFace}
                className="px-4 py-2 rounded-xl bg-blue-950 border border-blue-500 text-blue-300 text-xs font-bold hover:bg-blue-900 transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>{faceCaptured ? 'Re-sample 3D Mesh' : 'Capture 3D Face Vector'}</span>
              </button>
            </div>

            <div className="pt-3 flex justify-between border-t border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setStep(3);
                  soundFx.playScanBeep();
                }}
                disabled={!faceCaptured}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40"
              >
                Proceed to Voiceprint
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Voiceprint Calibration */}
        {step === 3 && (
          <div className="space-y-4 text-center font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">PROMPT PHRASE</span>
              <p className="text-sm font-bold text-white uppercase tracking-wider">
                "AURA NINE VERIFY ACCESS PROTOCOL"
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center">
              <Mic className={`w-10 h-10 mb-2 ${isSamplingVoice ? 'text-blue-400 animate-bounce' : 'text-slate-500'}`} />
              <button
                onClick={handleSampleVoice}
                disabled={isSamplingVoice}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSamplingVoice
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isSamplingVoice ? 'Recording Acoustic Harmonics...' : voiceCaptured ? 'Re-Record Voice Sample' : 'Record 3s Voice Sample'}
              </button>
            </div>

            {voiceCaptured && (
              <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Formants F1-F3 and vocal tract hash calibrated!</span>
              </div>
            )}

            <div className="pt-3 flex justify-between border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setStep(4);
                  soundFx.playScanBeep();
                }}
                disabled={!voiceCaptured}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40"
              >
                Review & Register
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Final Enclave Registration */}
        {step === 4 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Personnel:</span>
                <span className="text-white font-bold">{name || 'Agent Alex Thorne'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clearance:</span>
                <span className="text-emerald-400 font-bold">{clearance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">3D Face Embedding:</span>
                <span className="text-blue-400">SHA-256 Validated</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voiceprint FFT:</span>
                <span className="text-blue-400">Harmonics Synced</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-[11px] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Identity vector will be encrypted via AES-256 GCM into the biometric hardware security enclave.</span>
            </div>

            <div className="pt-3 flex justify-between border-t border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
              >
                Back
              </button>
              <button
                onClick={handleFinalize}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>Commit & Enroll Identity</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
