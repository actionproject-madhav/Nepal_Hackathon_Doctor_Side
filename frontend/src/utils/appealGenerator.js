/**
 * Appeal Letter Generator
 * 
 * Generates professional insurance appeal letters using either:
 * 1. LLM API (if key available in localStorage)
 * 2. Template engine (sophisticated fallback)
 */

/**
 * Generate an appeal letter from claim/denial context.
 * @param {Object} context
 * @param {Object} context.patient - Patient object
 * @param {Object} context.insurer - Insurer provider object
 * @param {Object} context.formData - Claim form data
 * @param {string} context.denialCode - Denial code (e.g., 'MN-4021')
 * @param {string} context.denialReason - Text denial reason
 * @param {Object} context.denialCategory - From classifyDenialReason()
 * @param {Array} context.violations - Parity violations detected
 * @param {Array} context.precedents - Matched legal precedents
 * @param {number} context.winProbability - Calculated win probability
 * @param {Array} context.sessions - Patient sessions
 * @param {Array} context.analytics - Computed analytics
 * @returns {Promise<string>} Appeal letter text
 */
export async function generateAppealLetter(context) {
  // Check for LLM API key (from .env or localStorage for demo)
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('vc_openai_key');
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY || localStorage.getItem('vc_anthropic_key');

  if (openaiKey) {
    try {
      return await generateWithOpenAI(context, openaiKey);
    } catch (e) {
      console.warn('OpenAI appeal generation failed, falling back to template:', e);
    }
  }
  
  if (anthropicKey) {
    try {
      return await generateWithAnthropic(context, anthropicKey);
    } catch (e) {
      console.warn('Anthropic appeal generation failed, falling back to template:', e);
    }
  }

  return generateWithTemplate(context);
}

function buildPrompt(context) {
  const { patient, insurer, formData, denialCode, denialReason, denialCategory, violations, precedents, winProbability, sessions, analytics } = context;
  
  const avgStress = analytics?.length > 0
    ? (analytics.reduce((a, b) => a + (b.stressScore || 0), 0) / analytics.length).toFixed(1)
    : 'N/A';
  const thresholdMet = analytics?.filter(a => a.thresholdMet).length || 0;
  const crisisCount = sessions?.filter(s => s.result?.crisis_flag).length || 0;

  return `You are a healthcare attorney specializing in mental health insurance appeals under MHPAEA. Generate a formal appeal letter for the following denial:

PATIENT: ${formData.patientName}, DOB ${formData.dob}, Member ID ${formData.insuranceId}
INSURER: ${insurer?.name || formData.insurerName}
DENIAL CODE: ${denialCode}
DENIAL REASON: ${denialReason}
DENIAL CATEGORY: ${denialCategory?.category || 'Unknown'}

CLINICAL EVIDENCE:
- ${sessions?.length || 0} AI-analyzed art therapy sessions via VoiceCanvas
- Average stress score: ${avgStress}/10
- Clinical threshold met in ${thresholdMet} sessions
- Crisis flags triggered: ${crisisCount}
- Diagnosis: ${formData.diagnosisCategory}
- Chief complaint: ${formData.chiefComplaint}
- Functional impairment: ${formData.functionalImpairment}
- Duration: ${formData.symptomDuration}

PARITY VIOLATIONS DETECTED:
${violations?.map(v => `- ${v.type}: ${v.desc} (${v.code})`).join('\n') || 'None'}

LEGAL PRECEDENTS:
${precedents?.map(p => `- ${p.case}: ${p.outcome} — ${p.relevance}`).join('\n') || 'None'}

WIN PROBABILITY: ${winProbability}%

PROVIDER: ${formData.providerName}, NPI ${formData.providerNPI}

Generate a 400-600 word formal appeal letter including:
1. Formal header with date, addressee, and re: line
2. Statement of appeal citing MHPAEA
3. Clinical evidence summary with specific data points
4. Parity violation analysis with CFR citations
5. Legal precedent references
6. 30-day demand citing appeal window (${insurer?.policies?.appealWindow || '180 days'})
7. Professional signature block

Tone: firm but professional. Use specific numbers and citations. Do NOT use placeholder text.`;
}

async function generateWithOpenAI(context, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a healthcare attorney specializing in MHPAEA insurance appeals. Generate professional appeal letters.' },
        { role: 'user', content: buildPrompt(context) },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithAnthropic(context, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        { role: 'user', content: buildPrompt(context) },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

/**
 * Template-based appeal letter generator. Produces a convincing letter
 * from structured data without requiring any API calls.
 */
function generateWithTemplate(context) {
  const { patient, insurer, formData, denialCode, denialReason, denialCategory, violations, precedents, winProbability, sessions, analytics } = context;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const insurerName = insurer?.name || formData?.insurerName || 'Insurance Provider';
  const appealWindow = insurer?.policies?.appealWindow || '180 days';
  
  const avgStress = analytics?.length > 0
    ? (analytics.reduce((a, b) => a + (b.stressScore || 0), 0) / analytics.length).toFixed(1)
    : 'N/A';
  const thresholdMet = analytics?.filter(a => a.thresholdMet).length || 0;
  const crisisCount = sessions?.filter(s => s.result?.crisis_flag).length || 0;
  const sessionCount = sessions?.length || 0;
  
  const stressTrajectory = sessions?.length >= 2
    ? `${sessions[0].stressScore.toFixed(1)} → ${sessions[sessions.length - 1].stressScore.toFixed(1)}`
    : 'N/A';

  let letter = `${today}

${insurerName}
Appeals & Grievances Department
${insurer?.claimsAddress || 'Claims Processing Center'}

Re: FORMAL APPEAL — Denial ${denialCode || 'N/A'}
Patient: ${formData?.patientName || 'N/A'}
Member ID: ${formData?.insuranceId || 'N/A'}
Group: ${formData?.groupNumber || 'N/A'}
Date of Service: ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
Claim ID: CLM-${Date.now().toString(36).toUpperCase()}

Dear Appeals Officer,

We are writing to formally appeal the denial of pre-authorization for ${formData?.patientName || 'our patient'} (DOB: ${formData?.dob || 'N/A'}) under the Mental Health Parity and Addiction Equity Act (MHPAEA), 29 U.S.C. § 1185a.

DENIAL ANALYSIS

Your denial (Code: ${denialCode || 'N/A'}) cites "${denialReason || 'insufficient medical necessity documentation'}." We respectfully submit that this denial${denialCategory ? `, categorized as "${denialCategory.category},"` : ''} fails to comply with federal parity requirements and is contradicted by substantial clinical evidence.

CLINICAL EVIDENCE

${formData?.patientName || 'The patient'} has completed ${sessionCount} documented art therapy sessions via VoiceCanvas, an AI-assisted clinical screening platform. The clinical data demonstrates clear medical necessity:

• Diagnosis: ${formData?.diagnosisCategory || 'See attached clinical notes'}
• Chief Complaint: ${formData?.chiefComplaint || 'See attached clinical notes'}
• Functional Impairment: ${formData?.functionalImpairment || 'Significant — see attached assessment'}
• Symptom Duration: ${formData?.symptomDuration || 'See attached treatment history'}
• Average Stress Score: ${avgStress}/10 (clinical threshold: 7.0)
• Sessions Above Clinical Threshold: ${thresholdMet} of ${sessionCount}${crisisCount > 0 ? `\n• Crisis Flags Triggered: ${crisisCount} session(s) — indicating acute clinical need` : ''}
• Stress Trajectory: ${stressTrajectory} — demonstrating ${sessions?.length >= 2 && sessions[sessions.length - 1].stressScore < sessions[0].stressScore ? 'therapeutic effectiveness requiring continued treatment' : 'persistent clinical severity requiring intervention'}

Each session includes AI-generated SOAP notes, validated stress scoring, facial affect analysis, and objective behavioral indicators. This level of documentation exceeds the standard clinical note requirements for comparable medical/surgical outpatient services.`;

  // Add parity violations section
  if (violations?.length > 0) {
    letter += `

MHPAEA PARITY VIOLATIONS

Our analysis has identified ${violations.length} potential parity violation${violations.length > 1 ? 's' : ''} in ${insurerName}'s handling of this claim:

`;
    violations.forEach((v, i) => {
      letter += `${i + 1}. ${v.type} (${v.severity.toUpperCase()} severity)
   ${v.desc}
   Citation: ${v.code} (${v.cfr})

`;
    });

    letter += `Under MHPAEA and the 2024 Final Rule (89 FR 77586), ${insurerName} is required to demonstrate that the criteria, factors, and processes used to deny this mental health claim are comparable to and applied no more stringently than those used for analogous medical/surgical benefits. We request that ${insurerName} provide its comparative analysis pursuant to 29 CFR § 2590.712(d)(3).`;
  }

  // Add precedents section
  if (precedents?.length > 0) {
    letter += `

LEGAL PRECEDENT

The following legal precedents support our appeal:

`;
    precedents.forEach(p => {
      letter += `• ${p.case}${p.citation ? ` (${p.citation})` : ''} — ${p.outcome}
  Relevance: ${p.relevance}

`;
    });
    letter += `These cases establish that ${denialCategory?.category === 'Medical Necessity' ? 'denials based on overly restrictive medical necessity criteria for mental health services' : 'similar denials of mental health coverage'} have been successfully challenged under MHPAEA, with an average success rate of ${winProbability}%.`;
  }

  letter += `

DEMAND

Pursuant to ${insurerName}'s ${appealWindow} appeal window and MHPAEA requirements, we formally demand:

1. Immediate reversal of Denial ${denialCode || 'N/A'} and approval of the requested services
2. A written explanation of ${insurerName}'s comparative analysis of MH/SUD vs. M/S benefit restrictions, as required under 29 CFR § 2590.712(d)(3)
3. If this appeal is denied, we request an expedited external review pursuant to 29 CFR § 2590.715-2719(c)

We expect a response within 30 calendar days. Failure to respond or continued non-compliance may result in a formal complaint to the U.S. Department of Labor Employee Benefits Security Administration (EBSA) and/or the applicable State Department of Insurance.

Respectfully submitted,

${formData?.providerName || 'Provider Name'}
NPI: ${formData?.providerNPI || 'N/A'}
VoiceCanvas Clinic
Date: ${today}

cc: Patient file
    State Department of Insurance (if applicable)
    U.S. Department of Labor, EBSA (reserved)`;

  return letter;
}
