import React from 'react';
import {
  Sliders,
  Shield,
  Volume2,
  Cpu,
  Lock,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { EngineSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/mockBiometrics';
import { soundFx } from '../utils/soundEffects';

interface SettingsViewProps {
  settings: EngineSettings;
  setSettings: (s: EngineSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, setSettings }) => {
  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    soundFx.playScanBeep();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-950/70 border border-blue-500/30 text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Biometric Engine Calibration & Security Policies
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Adjust Zero-Trust Gate Verification Tolerances
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Defaults</span>
        </button>
      </div>

      {/* Threshold Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Face Match Sensitivity */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200">
              FACIAL VECTOR THRESHOLD
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">
              {settings.faceThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="70"
            max="99"
            value={settings.faceThreshold}
            onChange={(e) => {
              setSettings({ ...settings, faceThreshold: Number(e.target.value) });
            }}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>70% (Tolerant)</span>
            <span>90% (Recommended)</span>
            <span>99% (Military Grade)</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Minimum cosine similarity distance required across 68 facial landmark coordinates before authorizing entry.
          </p>
        </div>

        {/* Voiceprint FFT Threshold */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-200">
              VOICEPRINT HARMONIC MATCH
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {settings.voiceThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="70"
            max="98"
            value={settings.voiceThreshold}
            onChange={(e) => {
              setSettings({ ...settings, voiceThreshold: Number(e.target.value) });
            }}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>70% (Noisy room)</span>
            <span>88% (Standard)</span>
            <span>98% (Ultra Strict)</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Acoustic frequency formant alignment tolerance across F1, F2, F3 bands against enrolled biometric vectors.
          </p>
        </div>
      </div>

      {/* Policy & Enforcement */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-5 shadow-lg">
        <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
          Authentication Modality Enforcement
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'dual_strict',
              title: 'Dual Strict (Default)',
              desc: 'Requires simultaneous face match & voiceprint verification.',
            },
            {
              id: 'adaptive',
              title: 'Adaptive Gate',
              desc: 'Face primary; voice utilized if lighting conditions are degraded.',
            },
            {
              id: 'fast_track',
              title: 'Rapid Access Mode',
              desc: 'Optimized for high-throughput personnel checkpoint gates.',
            },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setSettings({ ...settings, verificationMode: mode.id as any });
                soundFx.playScanBeep();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                settings.verificationMode === mode.id
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="text-xs font-bold font-mono mb-1">{mode.title}</div>
              <p className="text-[11px] text-slate-400 leading-normal">{mode.desc}</p>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Anti-Spoofing & Liveness Heuristics
          </h3>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-medium text-slate-200">2D Screen & Paper Print Defense</div>
              <div className="text-[11px] text-slate-400">
                Detect planar specular reflections and absence of micro-saccadic eye movement
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.antiSpoofingEnforced}
              onChange={(e) => setSettings({ ...settings, antiSpoofingEnforced: e.target.checked })}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-medium text-slate-200">Acoustic Synthesizer Feedback Sound</div>
              <div className="text-[11px] text-slate-400">
                Play real-time telemetry oscillator beeps, chime tones, and warning signals
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundFxEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                setSettings({ ...settings, soundFxEnabled: next });
                soundFx.setEnabled(next);
              }}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
