import React, { useState, useEffect } from 'react';
import { ShieldCheck, Volume2, VolumeX, ShieldAlert, Cpu, Lock } from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface HeaderProps {
  activeTab: 'scanner' | 'profiles' | 'audit' | 'settings';
  setActiveTab: (tab: 'scanner' | 'profiles' | 'audit' | 'settings') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  systemStatus: 'nominal' | 'alert' | 'lockdown';
  onEmergencyLockdown: () => void;
  activeScansCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  systemStatus,
  onEmergencyLockdown,
  activeScansCount,
}) => {
  const [utcTime, setUtcTime] = useState<string>('00:00:00 UTC');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(`${now.toTimeString().split(' ')[0]} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    if (next) {
      soundFx.playTone(880, 'sine', 0.08, 0.04);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#020617]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-b from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm border border-blue-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  Aura <span className="text-slate-400 font-normal">Biometrics</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  v4.9
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multimodal Face & Voice Authentication
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <button
              onClick={() => {
                setActiveTab('scanner');
                soundFx.playScanBeep();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'scanner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Scanner Gate
            </button>
            <button
              onClick={() => {
                setActiveTab('profiles');
                soundFx.playScanBeep();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'profiles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Enrolled Personnel
            </button>
            <button
              onClick={() => {
                setActiveTab('audit');
                soundFx.playScanBeep();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Audit Log
              {activeScansCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {activeScansCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                soundFx.playScanBeep();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              Calibration
            </button>
          </nav>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium text-slate-300">Station Online</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="text-slate-400 font-mono text-[11px]">{utcTime}</div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Emergency Lockdown Action */}
            <button
              onClick={onEmergencyLockdown}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all duration-200 ${
                systemStatus === 'lockdown'
                  ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-sm animate-pulse'
                  : 'bg-slate-900/60 border-slate-800 text-rose-400 hover:bg-rose-950/30 hover:border-rose-800/60'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{systemStatus === 'lockdown' ? 'Release Lockdown' : 'Lockdown'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between pb-3 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'scanner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 bg-slate-900/50'
            }`}
          >
            Biometric Gateway
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'profiles'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 bg-slate-900/50'
            }`}
          >
            Personnel
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 bg-slate-900/50'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 bg-slate-900/50'
            }`}
          >
            Calibration
          </button>
        </div>
      </div>
    </header>
  );
};
