import { useState, useCallback } from 'react';

const STORAGE_KEYS = {
  USER_PROFILE: 'mc_user_profile',
  SESSIONS: 'mc_sessions',
  ANALYTICS: 'mc_analytics',
  ONBOARDED: 'mc_onboarded',
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed:', e);
  }
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const MOCK_PROFILE = {
  name: 'Raju Karki',
  language: 'ne',
  communicationLevel: 'limited',
  isNonverbal: true,
  role: 'patient',
  startDate: daysAgo(21),
};

const MOCK_SESSIONS = [
  {
    id: 1001,
    timestamp: daysAgo(20),
    promptId: 'energy',
    stressScore: 8.1,
    imageUrl: null,
    caregiverNote: null,
    result: {
      personal_statement: 'म थकित छु तर निद्रा लाग्दैन। मेरो दिमागले मलाई शान्त हुन दिँदैन।',
      personal_statement_en: "I'm exhausted but I can't sleep. My mind won't let me rest.",
      stress_score: 8.1,
      crisis_flag: false,
      feedback_short: 'High stress indicators with sleep disruption patterns.',
      indicators: { isolation: 4, red_pct: 55, somatic: true, line_pressure: 'heavy' },
      clinical_note: {
        subjective: 'Patient drew dark, heavy scribbles concentrated in upper half. A clock showing 3 AM visible. Small isolated figure in corner.',
        objective: 'Drawing exhibits heavy line pressure (>80th percentile), dark color dominance (55% red/black), isolated self-figure placement. Consistent with agitation and sleep disruption.',
        assessment: 'Indicators consistent with Major Depressive Episode with insomnia features. Elevated stress score (8.1/10). Cultural context: Nepali male, emotional expression culturally suppressed.',
        plan: 'Recommend immediate clinical evaluation. Screen for suicidal ideation. Consider sleep hygiene intervention and CBT-I referral.',
      },
    },
  },
  {
    id: 1002,
    timestamp: daysAgo(17),
    promptId: 'safe',
    stressScore: 7.9,
    imageUrl: null,
    caregiverNote: null,
    result: {
      personal_statement: 'कोही छैन। मलाई कोहीले बुझ्दैन। म यहाँ एक्लो छु।',
      personal_statement_en: "Nobody. Nobody understands me. I'm alone here.",
      stress_score: 7.9,
      crisis_flag: true,
      feedback_short: 'Isolation and emptiness. Crisis indicators present.',
      indicators: { isolation: 5, red_pct: 20, somatic: false, line_pressure: 'light' },
      clinical_note: {
        subjective: 'Patient drew a single small dot on an otherwise blank canvas. 30 seconds of inaction before drawing. Minimal output suggests difficulty externalizing emotion.',
        objective: 'Near-blank canvas with single central dot. Minimal line pressure. Facial analysis: suppressed crying detected at 0:45, jaw tension sustained throughout.',
        assessment: 'Severe isolation with alexithymia features. Crisis flag triggered by emptiness + isolation score 5/5. Cultural adjustment disorder likely comorbid.',
        plan: 'Crisis protocol: verify safety. Continue expressive therapy — patient responded to drawing even with minimal output. Increase session frequency.',
      },
    },
  },
  {
    id: 1003,
    timestamp: daysAgo(14),
    promptId: 'weather',
    stressScore: 8.4,
    imageUrl: null,
    caregiverNote: { skippedMeals: 2, sleep: 'Bad', meltdowns: 0 },
    result: {
      personal_statement: 'बाहिर तुफान छ। म भित्र लुकेर बसेको छु तर भित्ता हल्लिँदैछ।',
      personal_statement_en: "There's a storm outside. I'm hiding inside but the walls are shaking.",
      stress_score: 8.4,
      crisis_flag: false,
      feedback_short: 'Storm metaphor with environmental threat. Peak stress session.',
      indicators: { isolation: 3, red_pct: 65, somatic: true, line_pressure: 'heavy' },
      clinical_note: {
        subjective: 'Patient drew a violent storm with aggressive dark strokes. A small house at bottom with stick figure inside. Red lightning bolts.',
        objective: 'Highest red percentage (65%) across all sessions. Heavy pressure with rapid stroke patterns suggesting agitation. Self-figure enclosed and small relative to threat.',
        assessment: 'Acute anxiety episode expressed through environmental threat metaphor. Somatic markers present. Stress peak at 8.4/10.',
        plan: 'Monitor closely. Consider anxiolytic evaluation. Session replay shows rapid drawing with aggressive strokes — document for insurance evidence.',
      },
    },
  },
  {
    id: 1004,
    timestamp: daysAgo(10),
    promptId: 'worry',
    stressScore: 7.2,
    imageUrl: null,
    caregiverNote: { skippedMeals: 1, sleep: 'OK', meltdowns: 0 },
    result: {
      personal_statement: 'मेरो बुबाको आवाज सधैं मेरो दिमागमा छ। उहाँले भन्नुभयो म असफल हुन्छु।',
      personal_statement_en: "My father's voice is always in my head. He told me I would fail.",
      stress_score: 7.2,
      crisis_flag: false,
      feedback_short: 'Paternal criticism internalized. First narrative drawing.',
      indicators: { isolation: 3, red_pct: 35, somatic: false, line_pressure: 'medium' },
      clinical_note: {
        subjective: 'Patient drew two figures — one large (father), one small (self). Speech bubble from large figure contains angry scribbles. Small figure has no mouth.',
        objective: 'First session with representational human figures — indicates growing expressive capacity. Self-figure depicted without mouth = voicelessness metaphor. Red pct decreased from 65% to 35%.',
        assessment: 'Internalized paternal criticism driving self-worth issues. The "no mouth" motif directly connects to communication barriers. Stress declining (7.2 from 8.4).',
        plan: 'Explore paternal relationship in future prompts. Note: patient is making progress — first narrative scene, declining stress, reduced red intensity.',
      },
    },
  },
  {
    id: 1005,
    timestamp: daysAgo(7),
    promptId: 'body',
    stressScore: 6.8,
    imageUrl: null,
    caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
    result: {
      personal_statement: 'मेरो छाती गह्रौं छ। तर मेरा हातहरू हलुका महसुस हुन्छन् — रेखाचित्रले मद्दत गर्छ।',
      personal_statement_en: 'My chest feels heavy. But my hands feel lighter — drawing helps.',
      stress_score: 6.8,
      crisis_flag: false,
      feedback_short: 'Somatic awareness emerging. First positive self-reflection.',
      indicators: { isolation: 2, red_pct: 25, somatic: true, line_pressure: 'medium' },
      clinical_note: {
        subjective: 'Patient shaded chest area heavily on body map. Arms and hands drawn with lighter, flowing lines. Added small sun in upper corner — first positive symbol across all sessions.',
        objective: 'Body map shows tension concentration in chest/shoulders. Hands drawn with notably lighter pressure than torso. First inclusion of positive imagery (sun). Red pct at 25% — lowest.',
        assessment: 'Somatic symptom awareness developing. The contrast between heavy chest and light hands suggests drawing provides physical relief. First positive symbol is a clinical milestone.',
        plan: 'Continue body-awareness prompts. Stress trending down (6.8). Consider introducing guided breathing exercises alongside drawing.',
      },
    },
  },
  {
    id: 1006,
    timestamp: daysAgo(4),
    promptId: 'safe',
    stressScore: 5.5,
    imageUrl: null,
    caregiverNote: null,
    result: {
      personal_statement: 'म सुरक्षित महसुस गर्छु जब म चित्र बनाउँछु। यो मेरो एउटा ठाउँ हो।',
      personal_statement_en: 'I feel safe when I draw. This is my one place.',
      stress_score: 5.5,
      crisis_flag: false,
      feedback_short: 'Therapeutic alliance with drawing modality established.',
      indicators: { isolation: 1, red_pct: 10, somatic: false, line_pressure: 'light' },
      clinical_note: {
        subjective: 'Patient drew a room with a window. Self-figure seated at a table drawing. Warm colors (yellow, green) dominate. A second figure outside the window waving.',
        objective: 'Dramatic shift: warm palette (90%), self-figure engaged in activity (drawing), second figure present = social connection emerging. Isolation score dropped to 1/5.',
        assessment: 'Significant improvement. Therapeutic alliance with art therapy modality clearly established. Social imagery emerging. Stress at 5.5 — below clinical threshold for first time.',
        plan: 'Maintain current approach. Patient is responding strongly to expressive therapy. Prepare insurance submission with 6-session evidence package.',
      },
    },
  },
  {
    id: 1007,
    timestamp: daysAgo(1),
    promptId: 'energy',
    stressScore: 4.8,
    imageUrl: null,
    caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
    result: {
      personal_statement: 'आज राम्रो दिन हो। म अलि बढी ऊर्जा महसुस गर्छु। हिजो म सुतेँ।',
      personal_statement_en: 'Today is a good day. I feel a little more energy. I slept last night.',
      stress_score: 4.8,
      crisis_flag: false,
      feedback_short: 'Best session. Sleep restored. Energy improving.',
      indicators: { isolation: 1, red_pct: 5, somatic: false, line_pressure: 'medium' },
      clinical_note: {
        subjective: 'Patient filled energy circle with yellow and green spirals. Drew a small smiling face at center. Smooth, confident strokes throughout. Fastest session completion (under 2 min).',
        objective: 'Lowest stress score (4.8). Energy assessment shows warm palette, organized patterns, and a smile — all absent from Sessions 1-3. Caregiver reports sleep restored.',
        assessment: 'Marked improvement across all indicators. Stress trajectory: 8.1 → 7.9 → 8.4 → 7.2 → 6.8 → 5.5 → 4.8. Clinical threshold no longer met. Art therapy is effective for this patient.',
        plan: 'Continue weekly sessions. Submit insurance with full 7-session evidence package. Recommend stepping down to biweekly in 4 weeks if progress sustained.',
      },
    },
  },
];

const MOCK_ANALYTICS = MOCK_SESSIONS.map(s => ({
  sessionId: s.id,
  timestamp: s.timestamp,
  promptId: s.promptId,
  stressScore: s.stressScore,
  thresholdMet: s.stressScore >= 7,
  indicators: s.result.indicators,
  pattern: s.result.clinical_note.assessment.split('.')[0],
  diagnosis: 'F32.1 Major Depressive Disorder, moderate; F40.10 Social Anxiety Disorder',
}));

function getInitialData(key, fallback, mockData) {
  const stored = safeGet(key, null);
  if (stored && (Array.isArray(stored) ? stored.length > 0 : stored)) {
    return stored;
  }
  return mockData || fallback;
}

export function useStorage() {
  const [profile, setProfileState] = useState(() =>
    getInitialData(STORAGE_KEYS.USER_PROFILE, null, MOCK_PROFILE)
  );
  const [sessions, setSessionsState] = useState(() =>
    getInitialData(STORAGE_KEYS.SESSIONS, [], MOCK_SESSIONS)
  );
  const [analytics, setAnalyticsState] = useState(() =>
    getInitialData(STORAGE_KEYS.ANALYTICS, [], MOCK_ANALYTICS)
  );

  const isOnboarded = useCallback(() => {
    return safeGet(STORAGE_KEYS.ONBOARDED, false);
  }, []);

  const setOnboarded = useCallback((value) => {
    safeSet(STORAGE_KEYS.ONBOARDED, value);
  }, []);

  const setProfile = useCallback((data) => {
    setProfileState(data);
    safeSet(STORAGE_KEYS.USER_PROFILE, data);
  }, []);

  const saveSession = useCallback((session) => {
    setSessionsState(prev => {
      const updated = [...prev, { ...session, id: Date.now(), timestamp: new Date().toISOString() }];
      safeSet(STORAGE_KEYS.SESSIONS, updated);
      return updated;
    });
  }, []);

  const saveAnalytics = useCallback((entry) => {
    setAnalyticsState(prev => {
      const updated = [...prev, { ...entry, timestamp: new Date().toISOString() }];
      safeSet(STORAGE_KEYS.ANALYTICS, updated);
      return updated;
    });
  }, []);

  const getWeekNumber = useCallback(() => {
    if (!profile?.startDate) return 1;
    const start = new Date(profile.startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diff + 1, 1), 4);
  }, [profile]);

  const getWeekSessions = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.timestamp) >= weekStart);
  }, [sessions]);

  const getRecentSessions = useCallback((count = 5) => {
    return sessions.slice(-count);
  }, [sessions]);

  const getStressHistory = useCallback(() => {
    return analytics.map(a => ({
      date: a.timestamp,
      score: a.stressScore || 0,
      promptId: a.promptId,
    }));
  }, [analytics]);

  const getAverageStress = useCallback(() => {
    if (analytics.length === 0) return 0;
    const scores = analytics.map(a => a.stressScore || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [analytics]);

  const clearAll = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setProfileState(null);
    setSessionsState([]);
    setAnalyticsState([]);
  }, []);

  return {
    profile,
    sessions,
    analytics,
    isOnboarded,
    setOnboarded,
    setProfile,
    saveSession,
    saveAnalytics,
    getWeekNumber,
    getWeekSessions,
    getRecentSessions,
    getStressHistory,
    getAverageStress,
    clearAll,
  };
}
