import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  Fingerprint,
  Mic,
  Eye,
  Key,
  Trash2,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { EnrolledProfile } from '../types';
import { soundFx } from '../utils/soundEffects';

interface ProfilesViewProps {
  profiles: EnrolledProfile[];
  onSelectForScan: (profile: EnrolledProfile) => void;
  onOpenEnrollModal: () => void;
  onDeleteProfile: (id: string) => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  onSelectForScan,
  onOpenEnrollModal,
  onDeleteProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClearance, setSelectedClearance] = useState<string>('all');
  const [inspectingProfile, setInspectingProfile] = useState<EnrolledProfile | null>(null);

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClearance =
      selectedClearance === 'all' || p.clearance.toLowerCase().includes(selectedClearance.toLowerCase());

    return matchesSearch && matchesClearance;
  });

  const getClearanceBadgeClass = (clearance: string) => {
    if (clearance.includes('Level 5')) return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
    if (clearance.includes('Level 4')) return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
    if (clearance.includes('Level 3')) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
    return 'bg-slate-800 border-slate-700 text-slate-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Enrolled Personnel Directory
            </h2>
            <p className="text-xs text-slate-400">
              {profiles.length} Active Verified Biometric Identities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, role or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-all"
            />
          </div>

          {/* Enroll Action */}
          <button
            onClick={() => {
              onOpenEnrollModal();
              soundFx.playScanBeep();
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Identity</span>
          </button>
        </div>
      </div>

      {/* Clearance Level Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-xs font-medium mr-1">Filter by Clearance:</span>
        {['all', 'Level 5', 'Level 4', 'Level 3', 'Level 2'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => {
              setSelectedClearance(lvl);
              soundFx.playScanBeep();
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              selectedClearance === lvl
                ? 'bg-blue-600/15 border-blue-500/50 text-blue-200 font-medium'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {lvl === 'all' ? 'All Personnel' : lvl}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((profile) => (
          <div
            key={profile.id}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/90 transition-all flex flex-col justify-between gap-4 shadow-sm group backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 group-hover:border-blue-500/50 transition-colors"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border-2 border-slate-950"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {profile.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                      {profile.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{profile.role}</p>
                  <p className="text-[11px] text-slate-400">{profile.department}</p>
                </div>
              </div>

              {/* Clearance badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getClearanceBadgeClass(
                  profile.clearance
                )}`}
              >
                {profile.clearance.split(' - ')[0]}
              </span>
            </div>

            {/* Cryptographic Biometric Hashes */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                  <span>3D Facial Signature:</span>
                </span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[170px]">
                  {profile.faceVectorHash.substring(0, 16)}...
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice Acoustic Hash:</span>
                </span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[170px]">
                  {profile.voiceprintHash.substring(0, 16)}...
                </span>
              </div>
            </div>

            {/* Meta & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
              <span className="text-slate-400 text-xs">Last verified: {profile.lastAccess}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingProfile(profile)}
                  className="p-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                  title="View full credentials"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onSelectForScan(profile);
                    soundFx.playScanBeep();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/40 text-blue-300 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Select for Scan</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Modal */}
      {inspectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <img
                  src={inspectingProfile.avatar}
                  alt={inspectingProfile.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <h3 className="text-base font-semibold text-white">{inspectingProfile.name}</h3>
                  <p className="text-xs text-slate-300">{inspectingProfile.role}</p>
                  <span className="text-xs font-mono text-blue-400">{inspectingProfile.id}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectingProfile(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-medium">Facial Mesh Hash (SHA-256)</div>
                <div className="text-slate-200 font-mono break-all text-xs">{inspectingProfile.faceVectorHash}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-slate-400 text-[11px] font-medium">Voiceprint Spectral Hash (SHA-256)</div>
                <div className="text-slate-200 font-mono break-all text-xs">{inspectingProfile.voiceprintHash}</div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-xs">Clearance Level:</span>
                  <div className="text-emerald-400 font-semibold mt-0.5">{inspectingProfile.clearance}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-xs">Enrolled Date:</span>
                  <div className="text-slate-200 font-medium mt-0.5">{inspectingProfile.enrolledAt}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  onSelectForScan(inspectingProfile);
                  setInspectingProfile(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-sm"
              >
                Load into Biometric Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
