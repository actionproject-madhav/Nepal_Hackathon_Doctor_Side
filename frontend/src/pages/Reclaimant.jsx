import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatientById, getPatientAnalytics } from '../data/mockPatients';
import { findProviderById } from '../data/insuranceProviders';
import { getRelevantPrecedents } from '../data/precedentDB';
import { scanForParityViolations, calculateWinProbability, classifyDenialReason } from '../utils/parityEngine';
import { generateAppealLetter } from '../utils/appealGenerator';
import { draftGmailAppeal } from '../utils/gmailService';
import AgentAutomation from '../components/AgentAutomation';
import './Reclaimant.css';

const DENIAL_SCENARIOS = {
  united: { code: 'MN-4021', reason: 'Insufficient medical necessity documentation for requested mental health services. Level of care does not meet UBH clinical guidelines.' },
  aetna: { code: 'DN-1893', reason: 'Not medically necessary. Requested art therapy services do not meet Aetna clinical policy criteria for behavioral health coverage.' },
  cigna: { code: 'REJ-7042', reason: 'Documentation insufficient for medical necessity. Frequency of requested services exceeds Cigna behavioral health utilization guidelines.' },
  anthem: { code: 'DEN-3156', reason: 'Provider type not credentialed for billed CPT code. Art therapy requires BCBS behavioral health credential verification.' },
  humana: { code: 'MN-2201', reason: 'Benefit maximum reached for outpatient behavioral health services in current plan year.' },
  medicare: { code: 'CO-50', reason: 'Not deemed medically necessary per LCD/NCD criteria. Additional clinical documentation required.' },
  tricare: { code: 'RT-114', reason: 'Service not authorized. Prior referral not obtained through primary care manager.' },
  default: { code: 'MN-4021', reason: 'Insufficient medical necessity documentation for requested mental health services.' },
};

export default function Reclaimant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId, insurerId, formData: passedFormData, claimId, estimatedCost: passedCost } = location.state || {};

  const patient = patientId ? getPatientById(patientId) : null;
  const analytics = patient ? getPatientAnalytics(patient) : [];
  const sessions = patient?.sessions || [];
  const insurer = insurerId ? findProviderById(insurerId) : null;

  const denial = DENIAL_SCENARIOS[insurerId] || DENIAL_SCENARIOS.default;
  const denialCategory = classifyDenialReason(denial.reason);
  const estimatedCost = passedCost || 4800;

  const [activeStep, setActiveStep] = useState(0);
  const [appealText, setAppealText] = useState('');
  const [appealGenerating, setAppealGenerating] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [trackerStage, setTrackerStage] = useState(0);

  const formData = passedFormData || {
    patientName: patient?.name || '',
    dob: '',
    insuranceId: claimId || '',
    insurerName: insurer?.name || '',
    groupNumber: '',
    chiefComplaint: '',
    symptomDuration: '',
    functionalImpairment: '',
    diagnosisCategory: patient?.diagnosis || '',
    requestedService: 'both',
    providerName: 'Dr. Sarah Mitchell, PhD, LCSW',
    providerNPI: '1234567890',
  };

  const parityViolations = useMemo(() => {
    if (!patient) return [];
    return scanForParityViolations({ patient, sessions, analytics, insurer, formData });
  }, [patient, sessions, analytics, insurer]);

  const matchedPrecedents = useMemo(() => {
    return getRelevantPrecedents(insurerId, patient, parityViolations);
  }, [insurerId, patient, parityViolations]);

  const winProbability = useMemo(() => {
    return calculateWinProbability(parityViolations, matchedPrecedents, insurer);
  }, [parityViolations, matchedPrecedents, insurer]);

  // Auto-advance through steps 1 & 2
  useEffect(() => {
    const t1 = setTimeout(() => setActiveStep(1), 1200);
    const t2 = setTimeout(() => setActiveStep(2), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleGenerateAppeal = async () => {
    setAppealGenerating(true);
    try {
      const letter = await generateAppealLetter({
        patient, insurer, formData,
        denialCode: denial.code,
        denialReason: denial.reason,
        denialCategory,
        violations: parityViolations,
        precedents: matchedPrecedents,
        winProbability,
        sessions, analytics,
      });
      setAppealText(letter);
      setActiveStep(3);
    } catch (e) {
      console.error('Appeal generation error:', e);
      setAppealText('Error generating appeal. Please try again.');
    }
    setAppealGenerating(false);
  };

  const handleSubmitAppeal = () => {
    setAgentSubmitting(true);
    setActiveStep(4);
  };

  const handleDraftEmailAppeal = () => {
    try {
      draftGmailAppeal(appealText, insurer, formData);
    } catch (error) {
      console.error('Email draft error:', error);
      alert('Failed to open Gmail. Please ensure popups are allowed.');
    }
  };

  const finalizeAppealSubmit = async () => {
    setAgentSubmitting(false);
    setAppealSubmitted(true);
    // Animate tracker
    for (let i = 1; i <= 3; i++) {
      await new Promise(r => setTimeout(r, 1500));
      setTrackerStage(i);
    }
    // Update localStorage for dashboard stats
    try {
      const recovered = parseFloat(localStorage.getItem('vc_recovered') || '0');
      localStorage.setItem('vc_recovered', String(recovered + Math.round(estimatedCost * winProbability / 100)));
      localStorage.setItem(`vc_appeal_${patientId}`, JSON.stringify({
        status: 'submitted', date: new Date().toISOString(), amount: estimatedCost,
        insurer: insurer?.name, winProbability, claimId,
      }));
    } catch { /* ignore */ }
  };

  if (!patient) {
    return (
      <div className="recl-page">
        <header className="ins-topnav">
          <button className="ins-back" onClick={() => navigate('/insurance')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
          <nav className="ins-nav-pills">
            <button className="ins-nav-pill" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="ins-nav-pill" onClick={() => navigate('/insurance')}>Claims</button>
            <button className="ins-nav-pill ins-nav-active">Reclaimant</button>
          </nav>
          <div className="ins-topnav-right"><div className="ins-user-avatar">Dr</div></div>
        </header>
        <div className="recl-empty">
          <h2>No Denial Selected</h2>
          <p>Please select a denied claim from the dashboard to initiate the appellate workflow.</p>
          <button className="ins-btn-submit" onClick={() => navigate('/insurance')}>Go to Insurance Claims</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recl-page">
      <header className="ins-topnav">
        <button className="ins-back" onClick={() => navigate('/insurance', { state: { patientId } })}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
        <nav className="ins-nav-pills">
          <button className="ins-nav-pill" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="ins-nav-pill" onClick={() => navigate('/insurance')}>Claims</button>
          <button className="ins-nav-pill ins-nav-active">Reclaimant</button>
        </nav>
        <div className="ins-topnav-right"><div className="ins-user-avatar">Dr</div></div>
      </header>

      <div className="recl-content">
        {/* Denial Banner */}
        <div className="recl-denial-banner">
          <div className="recl-db-icon">✕</div>
          <div className="recl-db-text">
            <h2>Claim Denied by {insurer?.name || 'Insurer'}</h2>
            <p>"{denial.reason}"</p>
            <div className="recl-db-meta">
              <span className="recl-db-code">Denial Code: {denial.code}</span>
              <span className="recl-db-cat">Category: {denialCategory.category} ({denialCategory.code})</span>
              {insurer && <span className="recl-db-window">Appeal Window: {insurer.policies.appealWindow}</span>}
            </div>
          </div>
        </div>

        {/* Reclaimant Engine Header */}
        <div className="recl-header">
          <div className="recl-h-left">
            <h1>Reclaimant</h1>
            <span className="recl-badge" style={{ background: insurer?.color || 'var(--green-500)' }}>LLM Appellate Engine</span>
          </div>
          <div className="recl-h-right">
            <div className="recl-win-badge" style={{ borderColor: insurer?.color ? `${insurer.color}40` : '', backgroundColor: insurer?.color ? `${insurer.color}15` : '' }}>
              <span className="recl-wb-val" style={{ color: insurer?.color || 'var(--green-500)' }}>{winProbability}%</span>
              <span className="recl-wb-label">Win Probability</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="recl-steps">
          {/* Step 1: Denial Scan */}
          <div className={`recl-step ${activeStep >= 1 ? 'recl-step-done' : 'recl-step-loading'}`}>
            <div className="recl-step-header">
              <span className="recl-step-num">{activeStep >= 1 ? '✓' : '⟳'}</span>
              <strong>Step 1 — Denial Scan</strong>
            </div>
            {activeStep >= 1 && (
              <motion.div className="recl-step-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="recl-scan-grid">
                  <div className="recl-scan-item"><span className="recl-si-label">Denial Reason</span><span className="recl-si-val">{denial.reason}</span></div>
                  <div className="recl-scan-item"><span className="recl-si-label">Parity Category</span><span className="recl-si-val">{denialCategory.category}</span></div>
                  <div className="recl-scan-item"><span className="recl-si-label">Regulation</span><span className="recl-si-val">{denialCategory.regulation}</span></div>
                  <div className="recl-scan-item"><span className="recl-si-label">Parity Implication</span><span className="recl-si-val recl-si-highlight">{denialCategory.parityImplication}</span></div>
                </div>
                {parityViolations.length > 0 && (
                  <div className="recl-violations-mini">
                    <strong>{parityViolations.length} MHPAEA Violation{parityViolations.length > 1 ? 's' : ''} Detected:</strong>
                    {parityViolations.slice(0, 3).map((v, i) => (
                      <div key={i} className="recl-vm-item">
                        <span className={`recl-vm-sev recl-vm-${v.severity}`}>{v.severity.toUpperCase()}</span>
                        <span>{v.type} — {v.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Step 2: Precedent Match */}
          <div className={`recl-step ${activeStep >= 2 ? 'recl-step-done' : activeStep === 1 ? 'recl-step-loading' : 'recl-step-wait'}`}>
            <div className="recl-step-header">
              <span className="recl-step-num">{activeStep >= 2 ? '✓' : activeStep === 1 ? '⟳' : '2'}</span>
              <strong>Step 2 — Precedent Match</strong>
              {insurer && <span className="recl-step-filter">Filtered: {insurer.name}</span>}
            </div>
            {activeStep >= 2 && (
              <motion.div className="recl-step-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="recl-prec-list">
                  {matchedPrecedents.slice(0, 5).map((p, i) => (
                    <div key={i} className="recl-prec-item">
                      <div className="recl-pi-top">
                        <span className="recl-pi-case">{p.case}</span>
                        <span className={`recl-pi-outcome ${p.outcome === 'Patient won' ? 'recl-pi-won' : 'recl-pi-settled'}`}>{p.outcome}</span>
                      </div>
                      {p.citation && <span className="recl-pi-cite">{p.citation}</span>}
                      <p className="recl-pi-rel">{p.relevance}</p>
                      <div className="recl-pi-bar"><div className="recl-pi-bar-fill" style={{ width: `${p.winRate}%` }} /></div>
                      <span className="recl-pi-rate">{p.winRate}% win rate</span>
                    </div>
                  ))}
                </div>
                <div className="recl-win-summary">
                  Overall win probability: <strong>{winProbability}%</strong> based on {matchedPrecedents.length} precedents + {parityViolations.length} parity violations
                </div>
              </motion.div>
            )}
          </div>

          {/* Step 3: Appeal Letter */}
          <div className={`recl-step ${activeStep >= 3 ? 'recl-step-done' : activeStep === 2 ? 'recl-step-active' : 'recl-step-wait'}`}>
            <div className="recl-step-header">
              <span className="recl-step-num">{activeStep >= 3 ? '✓' : '3'}</span>
              <strong>Step 3 — Appeal Letter</strong>
            </div>
            {activeStep >= 2 && (
              <motion.div className="recl-step-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {!appealText && !appealGenerating && (
                  <button className="ins-btn-submit recl-generate-btn" onClick={handleGenerateAppeal}>
                    Generate Appeal Letter
                  </button>
                )}
                {appealGenerating && (
                  <div className="recl-generating">
                    <div className="recl-gen-spinner" />
                    <span>Generating appeal letter with clinical evidence, parity analysis, and legal precedents...</span>
                  </div>
                )}
                {appealText && (
                  <div className="recl-appeal-container">
                    <div className="recl-appeal-toolbar">
                      <span>Appeal Letter — {insurer?.name || 'Insurer'}</span>
                      <span className="recl-appeal-win">Win Probability: {winProbability}%</span>
                    </div>
                    <textarea
                      className="recl-appeal-editor"
                      value={appealText}
                      onChange={e => setAppealText(e.target.value)}
                      rows={25}
                    />
                    {!appealSubmitted && (
                      <div className="recl-appeal-actions">
                        <button className="ins-btn-secondary" onClick={handleGenerateAppeal}>Regenerate</button>
                        <button className="ins-btn-secondary" onClick={handleDraftEmailAppeal} style={{ marginLeft: 10 }}>Draft in Gmail</button>
                        <button className="ins-btn-submit" onClick={handleSubmitAppeal} style={{ marginLeft: 10 }}>Submit Appeal to {insurer?.name || 'Insurer'}</button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Step 4: Submit & Track */}
          {(activeStep === 4 || appealSubmitted) && (
            <div className={`recl-step ${appealSubmitted ? 'recl-step-done' : 'recl-step-active'}`}>
              <div className="recl-step-header">
                <span className="recl-step-num">{appealSubmitted ? '✓' : '⟳'}</span>
                <strong>Step 4 — Appellate Execution</strong>
              </div>
              <motion.div className="recl-step-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {agentSubmitting ? (
                  <AgentAutomation
                    title={`Executing Appellate Workflow. Target: ${insurer?.name || 'Insurer'} Portal`}
                    insurerColor={insurer?.color}
                    onComplete={finalizeAppealSubmit}
                    tasks={[
                      { text: `Establishing secure connection to ${insurer?.name || 'Insurer'} Provider Portal...`, duration: 1500 },
                      { text: 'Navigating to Appeals & Grievances dashboard...', subtext: `Claim ID: ${formData.insuranceId}`, typeSpeed: 20, duration: 2000 },
                      { text: 'Compiling legal demand package...', subtext: `Attached: LLM_Appeal_Letter.pdf\nAttached: Clinical_Evidence_Summary.pdf\nAttached: MHPAEA_Parity_Log.pdf`, typeSpeed: 10, duration: 3000 },
                      { text: 'Drafting secure message to Appeals Coordinator...', subtext: `Subject: URGENT MHPAEA APPEAL - Claim ${formData.insuranceId}\nPlease find the attached formal demand under 29 U.S.C. 1185a.`, typeSpeed: 25, duration: 3500 },
                      { text: 'Transmitting final package...', duration: 1500 },
                      { text: 'Awaiting submission confirmation...', subtext: `Received Tracking ID: TICK-${Math.floor(Math.random() * 90000) + 10000}-A`, typeSpeed: 20, duration: 2500 }
                    ]}
                  />
                ) : (
                  <>
                    <div className="recl-tracker">
                      <div className={`recl-tk-step ${trackerStage >= 0 ? 'recl-tk-active' : ''}`}>Submitted</div>
                      <div className="recl-tk-line" />
                      <div className={`recl-tk-step ${trackerStage >= 1 ? 'recl-tk-active' : ''}`}>Under Review</div>
                      <div className="recl-tk-line" />
                      <div className={`recl-tk-step ${trackerStage >= 2 ? 'recl-tk-active' : ''}`}>Pending Decision</div>
                      <div className="recl-tk-line" />
                      <div className={`recl-tk-step ${trackerStage >= 3 ? 'recl-tk-active' : ''}`}>Decision</div>
                    </div>
                    <div className="recl-recovery">
                      <span className="recl-rec-label">Estimated Recovery</span>
                      <span className="recl-rec-amount">${Math.round(estimatedCost * winProbability / 100).toLocaleString()}</span>
                      <span className="recl-rec-detail">Based on ${estimatedCost.toLocaleString()} claim × {winProbability}% win rate</span>
                    </div>
                    <p className="recl-tracker-note">Expected response within 30–45 days. Dashboard "Recovered This Quarter" stat updated.</p>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>

        <div className="recl-bottom-actions">
          <button className="ins-btn-back" onClick={() => navigate(`/dashboard/${patient.id}`)}>Back to {patient.name}</button>
          <button className="ins-btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
