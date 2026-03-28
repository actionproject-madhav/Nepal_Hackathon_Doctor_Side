/**
 * Parity Guard Engine — MHPAEA Compliance Scanner
 * 
 * Rule-based engine that detects potential Mental Health Parity and 
 * Addiction Equity Act (MHPAEA) violations for insurance claims.
 * Uses real CFR/statute citations for demo authenticity.
 */

/**
 * Scan for potential MHPAEA parity violations based on patient, session, and insurer data.
 * @param {Object} params
 * @param {Object} params.patient - Patient object
 * @param {Array} params.sessions - Patient sessions
 * @param {Array} params.analytics - Computed analytics from sessions
 * @param {Object} params.insurer - Insurer provider object
 * @param {Object} params.formData - Current form data
 * @returns {Array} Array of violation objects
 */
export function scanForParityViolations({ patient, sessions, analytics, insurer, formData }) {
  const violations = [];

  // Rule 1: NQTL — Documentation Standard for Nonverbal Patients
  if (patient?.isNonverbal) {
    violations.push({
      id: 'NQTL-DOC-001',
      type: 'NQTL — Documentation Standard',
      desc: `Requiring verbal communication for psychiatric evaluation is a non-quantitative treatment limitation (NQTL) that disproportionately affects nonverbal patients. ${patient.name}'s condition (${patient.communicationLevel}) makes verbal-only assessment criteria discriminatory under MHPAEA.`,
      code: 'MHPAEA § 712(c)(4)(ii)',
      cfr: '29 CFR § 2590.712(c)(4)',
      severity: 'high',
      category: 'Non-Quantitative Treatment Limitation',
      recommendation: 'Document that VoiceCanvas art-based assessment provides equivalent clinical data to verbal interview.',
    });
  }

  // Rule 2: Prior Authorization Asymmetry
  if (insurer?.policies?.priorAuthRequired) {
    violations.push({
      id: 'QTL-AUTH-001',
      type: 'Prior Authorization Asymmetry',
      desc: `${insurer.name} requires prior authorization for behavioral health services but typically does not require prior auth for comparable medical/surgical outpatient services (e.g., orthopedic consultation, dermatology visit).`,
      code: 'MHPAEA § 712(c)(4)(A)',
      cfr: '29 CFR § 2590.712(c)(2)',
      severity: 'medium',
      category: 'Quantitative Treatment Limitation',
      recommendation: 'Request comparative analysis of prior auth requirements for M/S services under same plan.',
    });
  }

  // Rule 3: Medical Necessity Despite Clinical Evidence
  const thresholdMetCount = analytics?.filter(a => a.thresholdMet).length || 0;
  if (sessions?.length >= 4 && thresholdMetCount >= 2) {
    violations.push({
      id: 'MN-EVID-001',
      type: 'Medical Necessity Denial Despite Evidence',
      desc: `${sessions.length} documented art therapy sessions with clinical threshold met in ${thresholdMetCount}. AI-analyzed stress scores, crisis flags, and SOAP notes constitute objective clinical evidence. Denial would contradict documented medical necessity.`,
      code: 'MHPAEA § 712(c)(3)',
      cfr: '29 CFR § 2590.712(c)(3)(i)',
      severity: 'high',
      category: 'Medical Necessity',
      recommendation: 'Attach all session evidence including stress trajectory (demonstrating clinical need for continued treatment).',
    });
  }

  // Rule 4: Network Adequacy / Out-of-Network Parity
  if (insurer && insurer.policies?.parityCompliant !== 'Yes' && insurer.policies?.parityCompliant !== 'N/A (Federal)') {
    violations.push({
      id: 'NET-PAR-001',
      type: 'Network Adequacy — Parity Gap',
      desc: `${insurer.name} has parity compliance status: "${insurer.policies.parityCompliant}". Insurers must ensure their network includes sufficient behavioral health providers at comparable reimbursement rates to medical/surgical providers.`,
      code: '45 CFR § 146.136(c)(4)',
      cfr: 'ACA § 1311(j)(3)(B)',
      severity: 'medium',
      category: 'Network Adequacy',
      recommendation: 'Document network adequacy concerns — compare BH provider counts to M/S counts in area.',
    });
  }

  // Rule 5: Reimbursement Disparity
  if (insurer?.policies?.reimbursement) {
    const bhRate = insurer.policies.reimbursement['90837'] || 0;
    // Average M/S comparable rate is ~$200 for a 60-min specialist visit
    const msComparableRate = 200;
    if (bhRate > 0 && bhRate < msComparableRate * 0.75) {
      violations.push({
        id: 'REIMB-001',
        type: 'Reimbursement Rate Disparity',
        desc: `${insurer.name} reimburses 60-min psychotherapy (90837) at $${bhRate}, which is ${Math.round((bhRate / msComparableRate) * 100)}% of comparable medical/surgical specialist consultation rates (~$${msComparableRate}). MHPAEA requires financial requirements to be no more restrictive for MH/SUD.`,
        code: 'MHPAEA § 712(c)(2)',
        cfr: '29 CFR § 2590.712(c)(2)(i)',
        severity: bhRate < msComparableRate * 0.6 ? 'high' : 'low',
        category: 'Financial Requirement',
        recommendation: 'Include reimbursement rate comparison in appeal if claim is denied.',
      });
    }
  }

  // Rule 6: Crisis documentation penalty
  const crisisCount = sessions?.filter(s => s.result?.crisis_flag).length || 0;
  if (crisisCount > 0 && insurer?.policies?.denialRate) {
    const denialNum = parseInt(insurer.policies.denialRate);
    if (denialNum >= 18) {
      violations.push({
        id: 'CRISIS-001',
        type: 'High-Risk Denial Pattern',
        desc: `Patient has ${crisisCount} crisis-flagged session(s). ${insurer.name} has a ${insurer.policies.denialRate} MH denial rate — above the 15% industry median. High-acuity MH cases face disproportionate denial rates compared to high-acuity M/S cases.`,
        code: 'MHPAEA § 712(c)(3)(v)',
        cfr: '42 USC § 18031(j)',
        severity: 'high',
        category: 'Discriminatory Denial Pattern',
        recommendation: 'Pre-emptively include crisis documentation and compare insurer\'s MH vs M/S denial rates.',
      });
    }
  }

  // Rule 7: Telehealth parity (if applicable — always flag as informational)
  if (formData?.placeOfService === '10' || formData?.placeOfService === '02') {
    violations.push({
      id: 'TELE-001',
      type: 'Telehealth Parity Consideration',
      desc: 'Telehealth mental health services must be covered at parity with in-person MH services and telehealth M/S services. Some insurers apply additional restrictions to telehealth BH that do not apply to telehealth M/S.',
      code: 'ACA § 1557',
      cfr: 'CMS Final Rule CY2025',
      severity: 'low',
      category: 'Telehealth Parity',
      recommendation: 'Verify insurer does not impose stricter telehealth requirements for BH vs M/S.',
    });
  }

  // Rule 8: Quantitative Limit — Session Frequency
  if (formData?.requestedService === 'both' || formData?.requestedService === 'psychiatric eval') {
    violations.push({
      id: 'QTL-FREQ-001',
      type: 'Quantitative Limit — Service Frequency',
      desc: 'Pre-authorization requirements for psychiatric evaluation and psychological testing exceed those for comparable medical/surgical diagnostic procedures (e.g., MRI, CT scan require no pre-auth under most plans).',
      code: 'MHPAEA § 29 CFR 2590.712(c)(4)',
      cfr: '29 CFR § 2590.712(c)(2)(ii)',
      severity: 'medium',
      category: 'Quantitative Treatment Limitation',
      recommendation: 'Compare pre-auth requirements: BH diagnostic eval vs M/S diagnostic imaging under same plan.',
    });
  }

  return violations;
}

/**
 * Calculate appeal win probability based on violations, precedents, and insurer profile.
 * @param {Array} violations - Parity violations detected
 * @param {Array} precedents - Matched legal precedents
 * @param {Object} insurer - Insurer provider object
 * @returns {number} Win probability 0-100
 */
export function calculateWinProbability(violations, precedents, insurer) {
  let baseRate = 55; // National average internal appeal success rate ~44%, but with parity claims higher

  // Violations boost
  const highViolations = violations.filter(v => v.severity === 'high').length;
  const medViolations = violations.filter(v => v.severity === 'medium').length;
  baseRate += highViolations * 8;
  baseRate += medViolations * 3;

  // Precedent boost
  if (precedents.length > 0) {
    const avgPrecedentWin = precedents.reduce((a, b) => a + b.winRate, 0) / precedents.length;
    baseRate = (baseRate + avgPrecedentWin) / 2 + 5; // Weight toward precedent data
  }

  // Insurer-specific adjustment
  if (insurer) {
    const denialRate = parseInt(insurer.policies?.denialRate) || 15;
    if (denialRate >= 20) baseRate += 5; // High-denial insurers face more scrutiny
    if (insurer.policies?.parityCompliant === 'Under review' || insurer.policies?.parityCompliant === 'Partial') {
      baseRate += 7; // Non-compliant insurers = stronger appeal position
    }
  }

  return Math.min(95, Math.max(35, Math.round(baseRate)));
}

/**
 * Classify a denial reason into MHPAEA categories.
 * @param {string} denialReason - Raw denial reason text
 * @returns {Object} Category info
 */
export function classifyDenialReason(denialReason) {
  const lower = (denialReason || '').toLowerCase();
  
  if (lower.includes('medical necessity') || lower.includes('not medically necessary')) {
    return {
      category: 'Medical Necessity',
      code: 'MN',
      regulation: 'MHPAEA § 712(c)(3) — Medical necessity criteria for MH/SUD must be comparable to M/S',
      parityImplication: 'If MH medical necessity criteria are stricter than M/S criteria, this constitutes an NQTL violation.',
    };
  }
  if (lower.includes('documentation') || lower.includes('insufficient')) {
    return {
      category: 'Documentation Requirement',
      code: 'DR',
      regulation: '29 CFR § 2590.712(c)(4)(ii) — Documentation requirements cannot be more stringent for MH/SUD',
      parityImplication: 'Excessive documentation requirements for MH services that are not required for comparable M/S services violate MHPAEA.',
    };
  }
  if (lower.includes('not covered') || lower.includes('not a covered benefit')) {
    return {
      category: 'Benefit Classification',
      code: 'BC',
      regulation: 'MHPAEA § 712(c)(1) — Classification parity across benefit categories',
      parityImplication: 'If comparable M/S services are covered, excluding MH services from coverage may violate parity.',
    };
  }
  if (lower.includes('authorization') || lower.includes('prior auth')) {
    return {
      category: 'Prior Authorization',
      code: 'PA',
      regulation: '29 CFR § 2590.712(c)(4)(A) — NQTLs including prior authorization',
      parityImplication: 'Prior auth requirements for MH must be no more restrictive than those for comparable M/S services.',
    };
  }
  if (lower.includes('level of care') || lower.includes('level-of-care')) {
    return {
      category: 'Level of Care',
      code: 'LC',
      regulation: 'MHPAEA § 712(c)(3)(v) — Level of care determinations',
      parityImplication: 'Level-of-care guidelines for MH must use comparable criteria to M/S level-of-care decisions.',
    };
  }
  return {
    category: 'General Denial',
    code: 'GD',
    regulation: 'MHPAEA § 712 — General parity requirements',
    parityImplication: 'All MH/SUD coverage decisions must meet parity with M/S coverage under MHPAEA.',
  };
}
