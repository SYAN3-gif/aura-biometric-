import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Cpu,
  Info
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { soundFx } from '../utils/soundEffects';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'granted' | 'denied' | 'flagged'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const grantedCount = logs.filter((l) => l.status === 'granted').length;
  const deniedCount = logs.filter((l) => l.status === 'denied').length;
  const flaggedCount = logs.filter((l) => l.status === 'flagged').length;
  const passRate = logs.length > 0 ? ((grantedCount / logs.length) * 100).toFixed(1) : '100.0';

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `biometric_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    soundFx.playScanBeep();
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TOTAL VERIFICATIONS</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{logs.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>Active Real-Time Monitoring</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>PASS RATE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{passRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {grantedCount} Granted • {deniedCount} Denied
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>SPOOF ATTACKS BLOCKED</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{flaggedCount}</div>
          <div className="text-[11px] text-rose-400/80 mt-1 font-mono">
            Anti-spoofing heuristics active
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>MEAN ENGINE LATENCY</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">248 ms</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Hardware acceleration active
          </div>
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 shadow-xl space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(['all', 'granted', 'denied', 'flagged'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  soundFx.playScanBeep();
                }}
                className={`px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                  filter === status
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">TIMESTAMP</th>
                <th className="pb-3 font-semibold">SUBJECT</th>
                <th className="pb-3 font-semibold">CLEARANCE</th>
                <th className="pb-3 font-semibold">FACE MATCH</th>
                <th className="pb-3 font-semibold">VOICE MATCH</th>
                <th className="pb-3 font-semibold">COMPOSITE</th>
                <th className="pb-3 font-semibold">OUTCOME</th>
                <th className="pb-3 font-semibold text-right">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 text-white font-medium whitespace-nowrap">
                    <div>{log.subjectName}</div>
                    <div className="text-[10px] text-slate-500">{log.terminalId}</div>
                  </td>
                  <td className="py-3 text-slate-300 whitespace-nowrap">
                    {log.clearance.split(' - ')[0]}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span
                      className={
                        log.faceMatchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {log.faceMatchScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span
                      className={
                        log.voiceMatchScore >= 85 ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {log.voiceMatchScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap font-bold">
                    <span
                      className={
                        log.compositeScore >= 85 ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {log.compositeScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    {log.status === 'granted' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> GRANTED
                      </span>
                    )}
                    {log.status === 'denied' && (
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> DENIED
                      </span>
                    )}
                    {log.status === 'flagged' && (
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 text-[10px] font-bold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> SPOOF ALERT
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">{selectedLog.id}</span>
                <h3 className="text-base font-bold text-white">{selectedLog.subjectName}</h3>
                <p className="text-xs text-slate-400">{selectedLog.department}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terminal Gate:</span>
                <span className="text-blue-400">{selectedLog.terminalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Clearance Tier:</span>
                <span className="text-emerald-400 font-semibold">{selectedLog.clearance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Face Vector Score:</span>
                <span className="text-slate-200 font-bold">{selectedLog.faceMatchScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voiceprint Score:</span>
                <span className="text-slate-200 font-bold">{selectedLog.voiceMatchScore.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Liveness Verification:</span>
                <span className={selectedLog.livenessScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedLog.livenessScore.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Composite Fusion:</span>
                <span className={selectedLog.status === 'granted' ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedLog.compositeScore.toFixed(1)}%
                </span>
              </div>
            </div>

            {selectedLog.incidentNote && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                <div className="font-bold mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Security Incident Telemetry:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200/90">{selectedLog.incidentNote}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Dismiss Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
