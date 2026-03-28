function daysAgo(n, hour = null) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour ?? (9 + Math.floor(Math.random() * 9)), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

export const MOCK_PATIENTS = [
  {
    id: 'pt-001',
    name: 'Raju Karki',
    age: 28,
    language: 'ne',
    languageLabel: 'Nepali',
    communicationLevel: 'limited',
    isNonverbal: true,
    role: 'patient',
    startDate: daysAgo(21),
    diagnosis: 'F32.1 Major Depressive Disorder, moderate',
    status: 'active',
    riskLevel: 'high',
    insuranceProvider: 'Aetna',
    lastSessionDate: daysAgo(1),
    avatar: 'R',
    connectionState: 'accepted', // 'pending' | 'accepted' | null
    sessions: [
      {
        id: 1001, timestamp: daysAgo(20, 10), promptId: 'energy', stressScore: 8.1,
        caregiverNote: null,
        result: {
          personal_statement_en: "I'm exhausted but I can't sleep. My mind won't let me rest.",
          stress_score: 8.1, crisis_flag: false,
          feedback_short: 'High stress indicators with sleep disruption patterns.',
          indicators: { isolation: 4, red_pct: 55, somatic: true, line_pressure: 'heavy' },
          clinical_note: {
            subjective: 'Patient drew dark, heavy scribbles concentrated in upper half. A clock showing 3 AM visible. Small isolated figure in corner.',
            objective: 'Drawing exhibits heavy line pressure (>80th percentile), dark color dominance (55% red/black), isolated self-figure placement.',
            assessment: 'Indicators consistent with Major Depressive Episode with insomnia features. Elevated stress score (8.1/10).',
            plan: 'Recommend immediate clinical evaluation. Screen for suicidal ideation. Consider sleep hygiene intervention.',
          },
        },
      },
      {
        id: 1002, timestamp: daysAgo(17, 11), promptId: 'safe', stressScore: 7.9,
        caregiverNote: null,
        result: {
          personal_statement_en: "Nobody understands me. I'm alone here.",
          stress_score: 7.9, crisis_flag: true,
          feedback_short: 'Isolation and emptiness. Crisis indicators present.',
          indicators: { isolation: 5, red_pct: 20, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Patient drew a single small dot on an otherwise blank canvas. 30 seconds of inaction before drawing.',
            objective: 'Near-blank canvas with single central dot. Minimal line pressure. Facial analysis: suppressed crying detected.',
            assessment: 'Severe isolation with alexithymia features. Crisis flag triggered by emptiness + isolation score 5/5.',
            plan: 'Crisis protocol: verify safety. Continue expressive therapy. Increase session frequency.',
          },
        },
      },
      {
        id: 1003, timestamp: daysAgo(14, 14), promptId: 'weather', stressScore: 8.4,
        caregiverNote: { skippedMeals: 2, sleep: 'Bad', meltdowns: 0 },
        result: {
          personal_statement_en: "There's a storm outside. I'm hiding inside but the walls are shaking.",
          stress_score: 8.4, crisis_flag: false,
          feedback_short: 'Storm metaphor with environmental threat. Peak stress session.',
          indicators: { isolation: 3, red_pct: 65, somatic: true, line_pressure: 'heavy' },
          clinical_note: {
            subjective: 'Patient drew a violent storm with aggressive dark strokes. A small house at bottom with stick figure inside.',
            objective: 'Highest red percentage (65%) across all sessions. Heavy pressure with rapid stroke patterns.',
            assessment: 'Acute anxiety episode expressed through environmental threat metaphor. Stress peak at 8.4/10.',
            plan: 'Monitor closely. Consider anxiolytic evaluation. Document for insurance evidence.',
          },
        },
      },
      {
        id: 1004, timestamp: daysAgo(10, 10), promptId: 'worry', stressScore: 7.2,
        caregiverNote: { skippedMeals: 1, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: "My father's voice is always in my head. He told me I would fail.",
          stress_score: 7.2, crisis_flag: false,
          feedback_short: 'Paternal criticism internalized. First narrative drawing.',
          indicators: { isolation: 3, red_pct: 35, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Patient drew two figures — one large (father), one small (self). Speech bubble from large figure contains angry scribbles. Small figure has no mouth.',
            objective: 'First session with representational human figures. Self-figure depicted without mouth = voicelessness metaphor.',
            assessment: 'Internalized paternal criticism driving self-worth issues. Stress declining (7.2 from 8.4).',
            plan: 'Explore paternal relationship in future prompts. Patient is making progress — first narrative scene.',
          },
        },
      },
      {
        id: 1005, timestamp: daysAgo(7, 15), promptId: 'body', stressScore: 6.8,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: 'My chest feels heavy. But my hands feel lighter — drawing helps.',
          stress_score: 6.8, crisis_flag: false,
          feedback_short: 'Somatic awareness emerging. First positive self-reflection.',
          indicators: { isolation: 2, red_pct: 25, somatic: true, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Patient shaded chest area heavily on body map. Arms and hands drawn with lighter, flowing lines. Added small sun.',
            objective: 'Body map shows tension in chest/shoulders. Hands drawn with lighter pressure. First positive imagery (sun).',
            assessment: 'Somatic symptom awareness developing. Drawing provides physical relief. First positive symbol is clinical milestone.',
            plan: 'Continue body-awareness prompts. Stress trending down (6.8). Consider breathing exercises.',
          },
        },
      },
      {
        id: 1006, timestamp: daysAgo(4, 11), promptId: 'safe', stressScore: 5.5,
        caregiverNote: null,
        result: {
          personal_statement_en: 'I feel safe when I draw. This is my one place.',
          stress_score: 5.5, crisis_flag: false,
          feedback_short: 'Therapeutic alliance with drawing modality established.',
          indicators: { isolation: 1, red_pct: 10, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Patient drew a room with window. Self-figure seated at a table drawing. Warm colors dominate.',
            objective: 'Dramatic shift: warm palette (90%), self-figure engaged in activity, second figure present.',
            assessment: 'Significant improvement. Therapeutic alliance clearly established. Social imagery emerging.',
            plan: 'Maintain current approach. Prepare insurance submission with 6-session evidence package.',
          },
        },
      },
      {
        id: 1007, timestamp: daysAgo(1, 16), promptId: 'energy', stressScore: 4.8,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'Today is a good day. I feel a little more energy. I slept last night.',
          stress_score: 4.8, crisis_flag: false,
          feedback_short: 'Best session. Sleep restored. Energy improving.',
          indicators: { isolation: 1, red_pct: 5, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Patient filled energy circle with yellow and green spirals. Smooth, confident strokes.',
            objective: 'Lowest stress (4.8). Warm palette, organized patterns, and a smile — all absent from early sessions.',
            assessment: 'Marked improvement. Stress trajectory: 8.1 -> 4.8. Art therapy is effective for this patient.',
            plan: 'Continue weekly sessions. Submit insurance with full 7-session evidence package.',
          },
        },
      },
    ],
  },

  {
    id: 'pt-002',
    name: 'Mia Chen',
    age: 8,
    language: 'zh',
    languageLabel: 'Mandarin',
    communicationLevel: 'nonverbal',
    isNonverbal: true,
    role: 'caregiver-managed',
    startDate: daysAgo(30),
    diagnosis: 'F84.0 Autism Spectrum Disorder; F80.2 Expressive Language Disorder',
    status: 'active',
    riskLevel: 'moderate',
    insuranceProvider: 'UnitedHealth',
    lastSessionDate: daysAgo(2),
    avatar: 'M',
    connectionState: 'pending', // Patient requested connection, doctor hasn't accepted yet
    sessions: [
      {
        id: 2001, timestamp: daysAgo(28, 9), promptId: 'energy', stressScore: 6.2,
        caregiverNote: { skippedMeals: 1, sleep: 'Bad', meltdowns: 2 },
        result: {
          personal_statement_en: 'Everything is spinning. Too many sounds.',
          stress_score: 6.2, crisis_flag: false,
          feedback_short: 'Sensory overload indicators. Repetitive circular patterns.',
          indicators: { isolation: 2, red_pct: 30, somatic: true, line_pressure: 'heavy' },
          clinical_note: {
            subjective: 'Patient drew repetitive concentric circles with increasing pressure. Hands covered ears during drawing.',
            objective: 'Circular repetitive patterns (>20 concentric rings). Heavy line pressure escalating throughout session.',
            assessment: 'Sensory processing difficulties prominent. Repetitive drawing patterns consistent with ASD profile.',
            plan: 'Introduce structured drawing prompts with clear boundaries. Monitor sensory triggers.',
          },
        },
      },
      {
        id: 2002, timestamp: daysAgo(21, 10), promptId: 'safe', stressScore: 5.8,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 1 },
        result: {
          personal_statement_en: 'My cat. Soft. Warm. Purr sound.',
          stress_score: 5.8, crisis_flag: false,
          feedback_short: 'Attachment to pet. Sensory comfort seeking.',
          indicators: { isolation: 2, red_pct: 15, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Drew recognizable cat shape with careful detail on fur texture. Spent 3 minutes on texture alone.',
            objective: 'First representational drawing. Unusual attention to texture detail suggests tactile processing preference.',
            assessment: 'Pet attachment as primary comfort source. Texture focus indicates sensory processing style.',
            plan: 'Use texture-based prompts to leverage sensory processing strengths.',
          },
        },
      },
      {
        id: 2003, timestamp: daysAgo(14, 9), promptId: 'weather', stressScore: 5.1,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'Rain but not scary rain. Soft rain. I like the pattern.',
          stress_score: 5.1, crisis_flag: false,
          feedback_short: 'Positive weather interpretation. Pattern recognition emerging.',
          indicators: { isolation: 1, red_pct: 10, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Drew organized rain pattern with blue dots. Added small umbrella with detailed handle pattern.',
            objective: 'Organized, patterned drawing. Color palette calmer. First positive weather interpretation.',
            assessment: 'Improving emotional regulation. Pattern-based expression is a strength for this patient.',
            plan: 'Continue pattern-based prompts. Meltdown frequency decreasing.',
          },
        },
      },
      {
        id: 2004, timestamp: daysAgo(7, 10), promptId: 'body', stressScore: 4.5,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'Ears hurt sometimes. Hands are good. Hands can draw.',
          stress_score: 4.5, crisis_flag: false,
          feedback_short: 'Body awareness developing. Self-advocacy emerging.',
          indicators: { isolation: 1, red_pct: 8, somatic: true, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Shaded ears in red on body map. Drew elaborate patterns on hands. Added small stars near hands.',
            objective: 'Clear somatic mapping: ears = discomfort, hands = positive association with creative expression.',
            assessment: 'Developing body awareness and self-advocacy through drawing. Identifying sensory triggers.',
            plan: 'Introduce ear protection discussion with caregiver. Stress below clinical threshold.',
          },
        },
      },
      {
        id: 2005, timestamp: daysAgo(2, 11), promptId: 'worry', stressScore: 4.2,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'The loud place. School cafeteria. Too many people talking.',
          stress_score: 4.2, crisis_flag: false,
          feedback_short: 'Environmental stressor identified. Clear communication.',
          indicators: { isolation: 1, red_pct: 20, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Drew school cafeteria with many jagged lines (noise representation). Self-figure under a table.',
            objective: 'Environmental stressor clearly identified through drawing. Coping behavior (hiding) visible.',
            assessment: 'Patient successfully communicating specific environmental triggers through drawing. Major progress.',
            plan: 'Share cafeteria concern with school. Consider IEP accommodation for lunch setting.',
          },
        },
      },
    ],
  },

  {
    id: 'pt-003',
    name: 'Marcus Williams',
    age: 45,
    language: 'en',
    languageLabel: 'English',
    communicationLevel: 'limited-post-stroke',
    isNonverbal: true,
    role: 'patient',
    startDate: daysAgo(14),
    diagnosis: 'F06.32 Mood Disorder Due to CVA; R47.01 Aphasia',
    status: 'active',
    riskLevel: 'high',
    insuranceProvider: 'Cigna',
    lastSessionDate: daysAgo(3),
    avatar: 'M',
    connectionState: 'accepted',
    sessions: [
      {
        id: 3001, timestamp: daysAgo(13, 14), promptId: 'body', stressScore: 9.1,
        caregiverNote: null,
        result: {
          personal_statement_en: 'Half of me is gone. The left side is dark. I used to be whole.',
          stress_score: 9.1, crisis_flag: true,
          feedback_short: 'Acute post-stroke distress. Body image disruption. Crisis-level.',
          indicators: { isolation: 5, red_pct: 70, somatic: true, line_pressure: 'asymmetric' },
          clinical_note: {
            subjective: 'Drew body with left half completely blacked out. Right half drawn with detail. Facial expression showed tears during session.',
            objective: 'Asymmetric body representation reflecting hemiplegic awareness. Highest red/black percentage (70%). Crisis flag: isolation 5/5 + somatic.',
            assessment: 'Acute adjustment disorder post-CVA. Body image grief. Immediate crisis risk.',
            plan: 'CRISIS: Safety assessment required. Coordinate with neurology. Begin grief-focused art therapy.',
          },
        },
      },
      {
        id: 3002, timestamp: daysAgo(10, 15), promptId: 'weather', stressScore: 8.5,
        caregiverNote: null,
        result: {
          personal_statement_en: 'Thunderstorm. Lightning hit my house and split it in two.',
          stress_score: 8.5, crisis_flag: false,
          feedback_short: 'Stroke metaphor through weather. Processing trauma.',
          indicators: { isolation: 4, red_pct: 55, somatic: true, line_pressure: 'heavy' },
          clinical_note: {
            subjective: 'Drew a house split by lightning bolt. Left half dark and crumbling, right half intact. Rain falling only on left side.',
            objective: 'Strong metaphorical processing of stroke event. Left-right asymmetry persistent theme.',
            assessment: 'Patient is processing neurological event through metaphor. High distress but engaging with therapeutic modality.',
            plan: 'Continue metaphor-based prompts. Left-right theme is clinically significant for rehabilitation awareness.',
          },
        },
      },
      {
        id: 3003, timestamp: daysAgo(6, 14), promptId: 'worry', stressScore: 7.8,
        caregiverNote: null,
        result: {
          personal_statement_en: 'My words are trapped inside a box. I can see them but they won\'t come out.',
          stress_score: 7.8, crisis_flag: false,
          feedback_short: 'Aphasia frustration expressed through drawing. Verbal grief.',
          indicators: { isolation: 3, red_pct: 40, somatic: false, line_pressure: 'heavy' },
          clinical_note: {
            subjective: 'Drew a locked box with letters visible inside through a small window. A key floating out of reach.',
            objective: 'Powerful metaphor for expressive aphasia. Drawing demonstrates intact cognitive/creative capacity despite verbal limitations.',
            assessment: 'Grief over lost verbal communication. Drawing is proving to be a viable alternative communication pathway.',
            plan: 'Submit VoiceCanvas evidence to insurer — demonstrates medical necessity for alternative communication therapy.',
          },
        },
      },
      {
        id: 3004, timestamp: daysAgo(3, 10), promptId: 'energy', stressScore: 7.0,
        caregiverNote: null,
        result: {
          personal_statement_en: 'Low battery. But the charger is plugged in now. Slowly.',
          stress_score: 7.0, crisis_flag: false,
          feedback_short: 'Hope emerging. Recovery metaphor. First positive shift.',
          indicators: { isolation: 2, red_pct: 25, somatic: true, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Drew a battery at 15% with a charger attached. Small green bar starting to fill. Lightning bolt symbol near charger.',
            objective: 'First use of positive/hope imagery. Stress declining from 9.1 to 7.0 across 4 sessions.',
            assessment: 'Recovery awareness emerging. Patient beginning to conceptualize rehabilitation as gradual process.',
            plan: 'Reinforce recovery narrative. Prepare insurance appeal — 4 sessions of documented progress.',
          },
        },
      },
    ],
  },

  {
    id: 'pt-004',
    name: 'Aisha Patel',
    age: 16,
    language: 'hi',
    languageLabel: 'Hindi',
    communicationLevel: 'selective-mute',
    isNonverbal: true,
    role: 'patient',
    startDate: daysAgo(35),
    diagnosis: 'F94.0 Selective Mutism; F40.10 Social Anxiety Disorder',
    status: 'active',
    riskLevel: 'moderate',
    insuranceProvider: 'Anthem',
    lastSessionDate: daysAgo(0),
    avatar: 'A',
    connectionState: 'accepted',
    sessions: [
      {
        id: 4001, timestamp: daysAgo(33, 16), promptId: 'worry', stressScore: 7.5,
        caregiverNote: { skippedMeals: 1, sleep: 'Bad', meltdowns: 0 },
        result: {
          personal_statement_en: 'Everyone is staring. Their eyes are big. I am small. I want to disappear.',
          stress_score: 7.5, crisis_flag: false,
          feedback_short: 'Social anxiety visualization. Surveillance fear.',
          indicators: { isolation: 4, red_pct: 35, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Drew many large eyes surrounding a tiny figure in the center. Figure drawn with minimal detail. Eyes drawn with heavy detail.',
            objective: 'Classic surveillance anxiety motif. Self-figure diminished. Significant size contrast between threatening elements and self.',
            assessment: 'Social anxiety with selective mutism presentation. Drawing reveals depth of perceived social threat.',
            plan: 'Gradual exposure hierarchy through drawing scenarios. Build self-figure size over sessions.',
          },
        },
      },
      {
        id: 4002, timestamp: daysAgo(26, 15), promptId: 'safe', stressScore: 6.5,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: 'My bedroom. Door closed. Music playing. Nobody asking me to talk.',
          stress_score: 6.5, crisis_flag: false,
          feedback_short: 'Safe space = solitude. Pressure to speak identified as stressor.',
          indicators: { isolation: 3, red_pct: 15, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Drew bedroom with closed door, headphones, and music notes. Outside the door: speech bubbles with question marks.',
            objective: 'Clear boundary-setting imagery. Communication pressure from environment identified as threat.',
            assessment: 'Safe space imagery reveals speaking demands as primary anxiety trigger. Protective isolation functional.',
            plan: 'Explore non-verbal communication acceptance. Reduce environmental speaking pressure.',
          },
        },
      },
      {
        id: 4003, timestamp: daysAgo(19, 16), promptId: 'energy', stressScore: 5.8,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: 'I have energy for drawing. Not for talking. Drawing is my voice.',
          stress_score: 5.8, crisis_flag: false,
          feedback_short: 'Drawing as communication modality accepted. Key therapeutic milestone.',
          indicators: { isolation: 2, red_pct: 10, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Energy circle filled with colorful spirals. Words "my voice" written small in center — first text in any session.',
            objective: 'First text inclusion across all sessions. "Drawing is my voice" = therapeutic breakthrough statement.',
            assessment: 'Patient has identified drawing as a valid communication modality. Selective mutism barrier partially circumvented.',
            plan: 'Build on this breakthrough. Introduce text-in-drawing as bridge to communication.',
          },
        },
      },
      {
        id: 4004, timestamp: daysAgo(12, 15), promptId: 'weather', stressScore: 5.2,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'Partly cloudy but the sun is peeking through. Maybe it will be okay.',
          stress_score: 5.2, crisis_flag: false,
          feedback_short: 'Cautious optimism. First conditional positive statement.',
          indicators: { isolation: 1, red_pct: 10, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Drew partly cloudy sky with sun partially visible. Small figure looking up at the sun, not hiding.',
            objective: 'Self-figure looking upward (first time facing outward). Positive/neutral color palette. Isolation score at 1.',
            assessment: 'Cautious optimism emerging. Self-figure orientation shift from inward to outward is clinically significant.',
            plan: 'Encourage outward-facing imagery. Social scenario prompts in next sessions.',
          },
        },
      },
      {
        id: 4005, timestamp: daysAgo(5, 16), promptId: 'body', stressScore: 4.8,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'My throat is tight. But my fingers are free. They can say what my voice cannot.',
          stress_score: 4.8, crisis_flag: false,
          feedback_short: 'Somatic awareness of mutism. Strong self-advocacy.',
          indicators: { isolation: 1, red_pct: 12, somatic: true, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Highlighted throat area in red on body map. Drew elaborate decorative patterns on fingertips. Wrote "free" near hands.',
            objective: 'Clear somatic localization of mutism symptom. Hands/fingers = expression pathway. Second text inclusion.',
            assessment: 'Remarkable self-awareness for 16yo with selective mutism. Drawing-based communication fully established.',
            plan: 'Prepare IEP recommendation: drawing-based assessments as accommodation. Insurance submission ready.',
          },
        },
      },
      {
        id: 4006, timestamp: daysAgo(0, 10), promptId: 'safe', stressScore: 4.2,
        caregiverNote: { skippedMeals: 0, sleep: 'Good', meltdowns: 0 },
        result: {
          personal_statement_en: 'I showed my drawing to my friend today. She said it was beautiful. I smiled.',
          stress_score: 4.2, crisis_flag: false,
          feedback_short: 'Social breakthrough! Shared drawing with peer. Positive response.',
          indicators: { isolation: 0, red_pct: 5, somatic: false, line_pressure: 'medium' },
          clinical_note: {
            subjective: 'Drew two figures side by side looking at a canvas together. Bright colors. Both figures smiling.',
            objective: 'TWO smiling figures — first peer interaction depicted. Isolation score 0/5. Stress at all-time low (4.2).',
            assessment: 'Social breakthrough: used drawing as bridge to peer connection. Selective mutism management through creative expression validated.',
            plan: 'Document for insurance: drawing therapy → social connection outcome. Exceptional progress over 6 sessions.',
          },
        },
      },
    ],
  },

  {
    id: 'pt-005',
    name: 'James Rivera',
    age: 72,
    language: 'es',
    languageLabel: 'Spanish',
    communicationLevel: 'declining-dementia',
    isNonverbal: false,
    role: 'caregiver-managed',
    startDate: daysAgo(42),
    diagnosis: 'F03.90 Unspecified Dementia; F32.9 Depressive Disorder',
    status: 'active',
    riskLevel: 'moderate',
    insuranceProvider: 'Medicare/Cigna Supplement',
    lastSessionDate: daysAgo(5),
    avatar: 'J',
    connectionState: 'accepted',
    sessions: [
      {
        id: 5001, timestamp: daysAgo(40, 10), promptId: 'safe', stressScore: 6.0,
        caregiverNote: { skippedMeals: 1, sleep: 'Bad', meltdowns: 1 },
        result: {
          personal_statement_en: 'My old house in San Juan. I remember the garden. My wife was there.',
          stress_score: 6.0, crisis_flag: false,
          feedback_short: 'Long-term memory access through drawing. Positive nostalgia.',
          indicators: { isolation: 2, red_pct: 15, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Drew detailed house with garden, two figures, and a tree. Colors warm. Slow, deliberate strokes with pauses.',
            objective: 'Drawing demonstrates preserved long-term memory and visual-spatial skills. Detail level exceeds verbal capacity.',
            assessment: 'Drawing accesses preserved memories that verbal interview cannot. Valuable for cognitive assessment.',
            plan: 'Use drawing for ongoing cognitive monitoring. Compare detail levels over time.',
          },
        },
      },
      {
        id: 5002, timestamp: daysAgo(33, 11), promptId: 'energy', stressScore: 5.5,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: 'Tired. But the colors help me remember. I like yellow.',
          stress_score: 5.5, crisis_flag: false,
          feedback_short: 'Color preference stable. Engagement maintained despite cognitive decline.',
          indicators: { isolation: 2, red_pct: 10, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Filled energy circle predominantly with yellow. Some green. Slow, careful strokes.',
            objective: 'Color preference (yellow) consistent across sessions — indicates preserved aesthetic preference. Motor control adequate.',
            assessment: 'Engagement with drawing modality sustained. Mood appears calmer during sessions per caregiver report.',
            plan: 'Continue weekly sessions. Use color consistency as cognitive stability marker.',
          },
        },
      },
      {
        id: 5003, timestamp: daysAgo(19, 10), promptId: 'weather', stressScore: 6.8,
        caregiverNote: { skippedMeals: 2, sleep: 'Bad', meltdowns: 2 },
        result: {
          personal_statement_en: 'Fog. I can not see the path. Where am I going?',
          stress_score: 6.8, crisis_flag: false,
          feedback_short: 'Cognitive fog metaphor. Disorientation expressed.',
          indicators: { isolation: 3, red_pct: 20, somatic: false, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Drew heavy fog with a faint path disappearing into it. Small figure at the start of the path.',
            objective: 'Fog metaphor directly maps to cognitive experience. Path imagery suggests awareness of decline.',
            assessment: 'Patient retains awareness of cognitive changes. Drawing reveals emotional processing of dementia experience.',
            plan: 'Monitor cognitive decline markers in drawing complexity. Increase caregiver support.',
          },
        },
      },
      {
        id: 5004, timestamp: daysAgo(5, 10), promptId: 'body', stressScore: 5.8,
        caregiverNote: { skippedMeals: 0, sleep: 'OK', meltdowns: 0 },
        result: {
          personal_statement_en: 'My head is cloudy. But my hands remember things my words forget.',
          stress_score: 5.8, crisis_flag: false,
          feedback_short: 'Procedural memory through drawing. Profound self-insight.',
          indicators: { isolation: 2, red_pct: 15, somatic: true, line_pressure: 'light' },
          clinical_note: {
            subjective: 'Shaded head area with gray on body map. Drew hands in vibrant colors with detailed patterns.',
            objective: 'Head = gray/cloudy vs hands = colorful/detailed. Reflects procedural vs declarative memory preservation.',
            assessment: 'Drawing captures preserved procedural memory pathways. Hands-based creative expression bypasses verbal deficits.',
            plan: 'Prepare insurance documentation: art therapy as cognitive preservation intervention for dementia patients.',
          },
        },
      },
    ],
  },
];

export function getPatientById(id) {
  return MOCK_PATIENTS.find(p => p.id === id);
}

export function getPatientAnalytics(patient) {
  return patient.sessions.map(s => ({
    sessionId: s.id,
    timestamp: s.timestamp,
    promptId: s.promptId,
    stressScore: s.stressScore,
    thresholdMet: s.stressScore >= 7,
    indicators: s.result.indicators,
    pattern: s.result.clinical_note.assessment.split('.')[0],
    diagnosis: patient.diagnosis,
    insurance_data: {
      chief_complaint: s.result.feedback_short,
      symptom_duration: `${patient.sessions.length} sessions over ${Math.ceil((new Date() - new Date(patient.startDate)) / (1000 * 60 * 60 * 24))} days`,
      functional_impairment: s.result.clinical_note.assessment,
      diagnosis_category: patient.diagnosis,
      requested_service: 'both',
    },
  }));
}

export function getOverviewStats() {
  const totalPatients = MOCK_PATIENTS.length;
  const activeAlerts = MOCK_PATIENTS.filter(p => p.riskLevel === 'high').length;
  const totalSessions = MOCK_PATIENTS.reduce((sum, p) => sum + p.sessions.length, 0);
  const avgStress = MOCK_PATIENTS.reduce((sum, p) => {
    const scores = p.sessions.map(s => s.stressScore);
    return sum + scores.reduce((a, b) => a + b, 0) / scores.length;
  }, 0) / totalPatients;
  const crisisFlags = MOCK_PATIENTS.reduce((sum, p) =>
    sum + p.sessions.filter(s => s.result.crisis_flag).length, 0);
  const pendingInsurance = MOCK_PATIENTS.filter(p =>
    p.sessions.length >= 4 && p.sessions.some(s => s.stressScore >= 7)).length;

  return { totalPatients, activeAlerts, totalSessions, avgStress, crisisFlags, pendingInsurance };
}

/**
 * Get alert badges for a patient based on clinical rules
 * @param {Object} patient - Patient object with sessions
 * @returns {Array} Array of alert badge objects
 */
export function getPatientAlerts(patient) {
  const alerts = [];

  if (!patient || !patient.sessions || patient.sessions.length === 0) {
    return alerts;
  }

  const sessions = patient.sessions;
  const latestSession = sessions[sessions.length - 1];

  // CRISIS: stress ≥ 8 OR crisis_flag on latest session
  if (latestSession.stressScore >= 8 || latestSession.result.crisis_flag) {
    alerts.push({
      type: 'crisis',
      label: 'Crisis',
      severity: 'critical',
      color: 'red',
      priority: 1
    });
  }

  // THRESHOLD: stress ≥ 7 on 3+ sessions
  const highStressSessions = sessions.filter(s => s.stressScore >= 7);
  if (highStressSessions.length >= 3) {
    alerts.push({
      type: 'threshold',
      label: 'Clinical Threshold',
      severity: 'high',
      color: 'orange',
      priority: 2,
      detail: `${highStressSessions.length} sessions ≥ 7.0`
    });
  }

  // IMPROVING: stress down 2+ sessions in a row
  if (sessions.length >= 2) {
    let consecutiveDecreases = 0;
    for (let i = sessions.length - 1; i > 0; i--) {
      if (sessions[i].stressScore < sessions[i - 1].stressScore) {
        consecutiveDecreases++;
      } else {
        break;
      }
    }
    if (consecutiveDecreases >= 2) {
      alerts.push({
        type: 'improving',
        label: 'Improving',
        severity: 'positive',
        color: 'green',
        priority: 4,
        detail: `${consecutiveDecreases} sessions declining`
      });
    }
  }

  // PENDING CONNECTION: patient requested link, not yet accepted
  if (patient.connectionState === 'pending') {
    alerts.push({
      type: 'pending_connection',
      label: 'Pending Connection',
      severity: 'info',
      color: 'blue',
      priority: 3
    });
  }

  // Sort by priority (lower number = higher priority)
  return alerts.sort((a, b) => a.priority - b.priority);
}

/**
 * Accept a pending connection request
 * @param {string} patientId - Patient ID
 * @returns {boolean} Success status
 */
export function acceptConnectionRequest(patientId) {
  const patient = MOCK_PATIENTS.find(p => p.id === patientId);
  if (patient && patient.connectionState === 'pending') {
    patient.connectionState = 'accepted';
    // In a real app, this would persist to localStorage or API
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`patient_${patientId}_connectionState`, 'accepted');
    }
    return true;
  }
  return false;
}
