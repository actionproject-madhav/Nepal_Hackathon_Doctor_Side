/**
 * Mock session replay: demo webcam footage + AI emotion timeline.
 * Use `getReplayForPatient(patient)` to bind this to the patient's real session id, prompt, and date.
 */

import { DRAWING_PROMPTS } from '../utils/drawingPrompts';

export const REPLAY_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4';

export const MOCK_REPLAY = {
  patientId: 'pt-001',
  sessionId: 1007,
  patientName: 'Raju Karki',
  sessionDate: new Date(Date.now() - 86400000).toISOString(),
  promptTitle: 'Energy Circle',
  duration: 15,
  videoUrl: REPLAY_VIDEO_URL,

  emotionTimeline: [
    { time: 0,  label: 'Session Start',        emotion: 'neutral',     confidence: 0.82, valence: 0.45, arousal: 0.30, notes: 'Patient seated, looking at screen. Hands resting.' },
    { time: 1,  label: 'Prompt Displayed',      emotion: 'curious',     confidence: 0.74, valence: 0.50, arousal: 0.40, notes: 'Eyes focused on prompt. Slight head tilt.' },
    { time: 2,  label: 'First Stroke',          emotion: 'focused',     confidence: 0.88, valence: 0.48, arousal: 0.55, notes: 'Right index finger raised. Drawing begins — slow, deliberate lines.' },
    { time: 3,  label: 'Building Momentum',     emotion: 'focused',     confidence: 0.91, valence: 0.52, arousal: 0.58, notes: 'Speed increasing. Yellow color selected. Spiral pattern emerging.' },
    { time: 4,  label: 'Color Selection',       emotion: 'calm',        confidence: 0.79, valence: 0.55, arousal: 0.35, notes: 'Paused drawing. Browsing colors. Selected green.' },
    { time: 5,  label: 'Expression Shift',      emotion: 'sadness',     confidence: 0.72, valence: 0.28, arousal: 0.45, notes: 'Brow furrowed. Drawing slowed. Darker strokes appearing.' },
    { time: 6,  label: 'Heavy Pressure',        emotion: 'frustration', confidence: 0.68, valence: 0.22, arousal: 0.70, notes: 'Line pressure increased significantly. Jaw tightened.' },
    { time: 7,  label: 'Self-Correction',       emotion: 'neutral',     confidence: 0.77, valence: 0.40, arousal: 0.42, notes: 'Erased last section. Deep breath detected. Restarting area.' },
    { time: 8,  label: 'Creative Flow',         emotion: 'engaged',     confidence: 0.85, valence: 0.62, arousal: 0.60, notes: 'Smooth continuous strokes. Adding detail to spiral center.' },
    { time: 9,  label: 'Micro-smile',           emotion: 'happiness',   confidence: 0.71, valence: 0.72, arousal: 0.50, notes: 'Brief smile detected (0.3s). First positive expression in session.' },
    { time: 10, label: 'Verbal Attempt',        emotion: 'effort',      confidence: 0.65, valence: 0.45, arousal: 0.55, notes: 'Mouth movement detected — possible subvocalization. No audio produced.' },
    { time: 11, label: 'Finishing Touches',      emotion: 'satisfaction',confidence: 0.80, valence: 0.68, arousal: 0.45, notes: 'Adding small details. Shoulders relaxed from earlier tension.' },
    { time: 12, label: 'Review Phase',          emotion: 'contemplative',confidence: 0.76, valence: 0.55, arousal: 0.30, notes: 'Stopped drawing. Looking at completed work. Hand on chin.' },
    { time: 13, label: 'Submission Gesture',    emotion: 'calm',        confidence: 0.83, valence: 0.60, arousal: 0.25, notes: 'Open hand gesture detected — submitting drawing.' },
    { time: 14, label: 'Session End',           emotion: 'relief',      confidence: 0.78, valence: 0.65, arousal: 0.20, notes: 'Visible exhale. Slight nod. Session complete.' },
  ],

  overallAnalysis: {
    dominantEmotion: 'focused',
    emotionalRange: 'moderate',
    positiveShift: true,
    startValence: 0.45,
    endValence: 0.65,
    peakStress: { time: 6, emotion: 'frustration', valence: 0.22 },
    peakPositive: { time: 9, emotion: 'happiness', valence: 0.72 },
    verbalAttempts: 1,
    smileCount: 1,
    stressIndicators: ['brow_furrow', 'jaw_clench', 'heavy_pressure'],
    positiveIndicators: ['micro_smile', 'shoulder_relax', 'deep_breath'],
  },

  drawingSnapshots: [
    { time: 2,  description: 'First yellow spiral stroke' },
    { time: 5,  description: 'Darker strokes added — mood shift visible in palette' },
    { time: 8,  description: 'Erased section redrawn with lighter, flowing lines' },
    { time: 11, description: 'Final composition: yellow/green spirals with small sun detail' },
  ],
};

export function getEmotionColor(emotion) {
  const map = {
    neutral: '#9CA3AF',
    curious: '#60A5FA',
    focused: '#38B2AC',
    calm: '#34D399',
    sadness: '#818CF8',
    frustration: '#FB7185',
    engaged: '#38B2AC',
    happiness: '#FBBF24',
    effort: '#F97316',
    satisfaction: '#22C55E',
    contemplative: '#A78BFA',
    relief: '#34D399',
  };
  return map[emotion] || '#9CA3AF';
}

export function getValenceLabel(v) {
  if (v >= 0.7) return 'Very Positive';
  if (v >= 0.55) return 'Positive';
  if (v >= 0.4) return 'Neutral';
  if (v >= 0.25) return 'Negative';
  return 'Very Negative';
}

/** Binds demo video + timeline to this patient's latest session from mockPatients. */
export function getReplayForPatient(patient) {
  if (!patient?.sessions?.length) {
    return {
      ...MOCK_REPLAY,
      patientId: patient?.id ?? '',
      patientName: patient?.name ?? 'Patient',
    };
  }
  const latest = patient.sessions[patient.sessions.length - 1];
  const prompt = DRAWING_PROMPTS.find((p) => p.id === latest.promptId);
  return {
    ...MOCK_REPLAY,
    patientId: patient.id,
    patientName: patient.name,
    sessionId: latest.id,
    sessionDate: latest.timestamp,
    promptTitle: prompt?.title || 'Art therapy session',
    sessionStressScore: latest.stressScore,
  };
}
