/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { BiometricScanner } from './components/BiometricScanner';
import { ProfilesView } from './components/ProfilesView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { EnrollmentModal } from './components/EnrollmentModal';
import {
  BiometricStatus,
  EnrolledProfile,
  AuditLogEntry,
  EngineSettings
} from './types';
import {
  INITIAL_PROFILES,
  INITIAL_AUDIT_LOGS,
  DEFAULT_SETTINGS
} from './data/mockBiometrics';
import { soundFx } from './utils/soundEffects';
import { ShieldAlert, Radio, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'profiles' | 'audit' | 'settings'>('scanner');
  const [status, setStatus] = useState<BiometricStatus>('idle');
  const [profiles, setProfiles] = useState<EnrolledProfile[]>(INITIAL_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<EnrolledProfile | null>(INITIAL_PROFILES[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<'nominal' | 'alert' | 'lockdown'>('nominal');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleLogEntry = (entry: AuditLogEntry) => {
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const handleSelectProfileForScan = (profile: EnrolledProfile) => {
    setSelectedProfile(profile);
    setStatus('idle');
    setActiveTab('scanner');
    showNotification(`Subject loaded into scanner: ${profile.name}`);
  };

  const handleEnrollProfile = (newProfile: EnrolledProfile) => {
    setProfiles((prev) => [newProfile, ...prev]);
    showNotification(`Enrolled new identity: ${newProfile.name}`);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (selectedProfile?.id === id) {
      setSelectedProfile(profiles.find((p) => p.id !== id) || null);
    }
  };

  const handleEmergencyLockdown = () => {
    if (systemStatus === 'lockdown') {
      setSystemStatus('nominal');
      soundFx.playSuccessChime();
      showNotification('Emergency lockdown lifted. Gate returned to nominal state.');
    } else {
      setSystemStatus('lockdown');
      setStatus('idle');
      soundFx.playDeniedWarning();
      showNotification('Emergency lockdown activated. All biometric gate access halted.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col selection:bg-blue-600/30 selection:text-blue-200 font-sans">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        systemStatus={systemStatus}
        onEmergencyLockdown={handleEmergencyLockdown}
        activeScansCount={auditLogs.length}
      />

      {/* Emergency Lockdown Alert Banner */}
      {systemStatus === 'lockdown' && (
        <div className="bg-rose-950/90 border-b border-rose-600/70 px-4 py-3 text-xs text-rose-200">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="font-semibold">
                Lockdown mode active: Biometric scanners de-energized. Access gates held secure.
              </span>
            </div>
            <button
              onClick={handleEmergencyLockdown}
              className="px-3 py-1 rounded-xl bg-rose-900 border border-rose-400/60 text-rose-100 font-medium hover:bg-rose-800 transition-colors"
            >
              Lift Lockdown
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl text-xs text-slate-200 flex items-center gap-2.5 max-w-sm backdrop-blur-md">
          <Radio className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {systemStatus === 'lockdown' ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/80 border border-rose-500/80 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Terminal Locked Down
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Facial optical arrays and acoustic vectorizers are offline. Station personnel can disengage this lockdown using the emergency override.
            </p>
            <button
              onClick={handleEmergencyLockdown}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              Disengage Lockdown & Resume
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'scanner' && (
              <BiometricScanner
                status={status}
                setStatus={setStatus}
                selectedProfile={selectedProfile}
                setSelectedProfile={setSelectedProfile}
                allProfiles={profiles}
                onLogEntry={handleLogEntry}
                settings={settings}
              />
            )}

            {activeTab === 'profiles' && (
              <ProfilesView
                profiles={profiles}
                onSelectForScan={handleSelectProfileForScan}
                onOpenEnrollModal={() => setIsEnrollModalOpen(true)}
                onDeleteProfile={handleDeleteProfile}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogView
                logs={auditLogs}
                onClearLogs={() => setAuditLogs([])}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                setSettings={setSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Enrollment Modal */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollProfile}
      />

      {/* Footer System Telemetry */}
      <footer className="border-t border-slate-800/80 bg-[#020617] py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Aura Biometric Gateway</span>
            <span className="text-slate-600">•</span>
            <span>Zero-Trust Multimodal Security</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Contour Mesh</span>
            <span>•</span>
            <span>Harmonic Resonance</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Liveness Guard Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
