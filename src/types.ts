export type BiometricStatus = 
  | 'idle' 
  | 'scanning_face' 
  | 'listening_voice' 
  | 'analyzing' 
  | 'authenticated' 
  | 'rejected' 
  | 'spoof_detected';

export type SecurityClearance = 'Level 1 - Public' | 'Level 2 - Staff' | 'Level 3 - Operator' | 'Level 4 - Executive' | 'Level 5 - Director';

export interface EnrolledProfile {
  id: string;
  name: string;
  department: string;
  role: string;
  clearance: SecurityClearance;
  avatar: string;
  faceVectorHash: string;
  voiceprintHash: string;
  enrolledAt: string;
  lastAccess: string;
  status: 'active' | 'suspended' | 'probationary';
  matchPresetKey: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  subjectName: string;
  department: string;
  clearance: SecurityClearance;
  faceMatchScore: number;
  voiceMatchScore: number;
  compositeScore: number;
  livenessScore: number;
  status: 'granted' | 'denied' | 'flagged';
  terminalId: string;
  verificationMode: 'Dual Face+Voice' | 'Face Only' | 'Voice Only';
  incidentNote?: string;
}

export interface BiometricTelemetry {
  // Face metrics
  faceDetected: boolean;
  landmarksCount: number;
  yaw: number;
  pitch: number;
  roll: number;
  pupilDistanceMm: number;
  livenessBlinkDetected: boolean;
  thermalVariance: number;
  faceConfidence: number;

  // Voice metrics
  voiceDetected: boolean;
  audioDbLevel: number;
  fundamentalFreqHz: number;
  formants: [number, number, number];
  jitterPercent: number;
  spectralEntropy: number;
  voiceprintConfidence: number;

  // System
  spoofProbability: number;
  compositeConfidence: number;
}

export interface EngineSettings {
  faceThreshold: number; // 0 - 100
  voiceThreshold: number; // 0 - 100
  livenessStrictness: 'standard' | 'strict' | 'maximum';
  verificationMode: 'dual_strict' | 'adaptive' | 'face_preferred' | 'voice_preferred';
  soundFxEnabled: boolean;
  antiSpoofingEnforced: boolean;
  infraredSimulation: boolean;
  autoResetSeconds: number;
}
