import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PATIENTS, getPatientById, getPatientAnalytics } from '../data/mockPatients';
import { findProviderByPatientInsurer, isInNetwork } from '../data/insuranceProviders';
import { getReplayForPatient, getEmotionColor } from '../data/mockReplay';
import { exportInsuranceFormPDF } from '../utils/pdfExport';
import { automatePortalSubmission, simulateEDITransmission } from '../utils/portalAutomation';
import { draftClaimSubmissionEmail } from '../utils/gmailService';
import AgentAutomation from '../components/AgentAutomation';
import TraceGuard from '../components/TraceGuard';
import './InsuranceForm.css';

const PRECEDENT_DB = [
  { case: 'Doe v. Aetna (2024)', outcome: 'Patient won', relevance: 'Nonverbal documentation accepted as primary evidence', winRate: 68 },
  { case: 'Smith v. UnitedHealth (2023)', outcome: 'Settled', relevance: 'Art therapy screening met medical necessity standard', winRate: 72 },
  { case: 'Johnson v. Cigna (2024)', outcome: 'Patient won', relevance: 'Parity Act violation — excessive documentation requirements', winRate: 65 },
  { case: 'Williams v. Anthem (2023)', outcome: 'Patient won', relevance: 'Nonverbal patient denied equal coverage', winRate: 71 },
];

export default function InsuranceForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId, result: passedResult } = location.state || {};

  const patient = patientId ? getPatientById(patientId) : null;
  const analytics = patient ? getPatientAnalytics(patient) : [];
  const sessions = patient?.sessions || [];
  const result = passedResult || (analytics.length > 0 ? analytics[analytics.length - 1] : null);

  const matchedInsurer = patient ? findProviderByPatientInsurer(patient.insuranceProvider) : null;
  const inNetwork = patient ? isInNetwork(patient.insuranceProvider) : false;

  const [formData, setFormData] = useState({
    chiefComplaint: result?.insurance_data?.chief_complaint || '',
    symptomDuration: result?.insurance_data?.symptom_duration || '',
    functionalImpairment: result?.insurance_data?.functional_impairment || '',
    diagnosisCategory: result?.insurance_data?.diagnosis_category || result?.diagnosis || patient?.diagnosis || '',
    requestedService: result?.insurance_data?.requested_service || 'both',
    patientName: patient?.name || '',
    dob: patient ? (patient.age === 8 ? '2018-03-15' : patient.age === 16 ? '2010-06-22' : patient.age === 28 ? '1998-01-10' : patient.age === 45 ? '1981-09-05' : '1954-11-30') : '',
    insuranceId: patient ? `INS-${patient.id.replace('pt-', '').toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}` : '',
    insurerName: patient?.insuranceProvider || '',
    groupNumber: patient?.insuranceProvider ? `GRP-${patient.insuranceProvider.substring(0, 3).toUpperCase()}-001` : '',
    providerName: 'Dr. Sarah Mitchell, PhD, LCSW',
    providerNPI: '1234567890',
  });

  const [step, setStep] = useState('form');

  const parityViolations = useMemo(() => {
    const violations = [];
    if (patient?.isNonverbal) {
      violations.push({
        type: 'NQTL — Documentation Standard',
        desc: 'Requiring verbal communication for psychiatric evaluation is a non-quantitative treatment limitation that disproportionately affects nonverbal patients.',
        code: 'MHPAEA § 712(c)(4)(ii)',
        severity: 'high',
      });
    }
    if (formData.requestedService === 'both' || formData.requestedService === 'psychiatric eval') {
      violations.push({
        type: 'Quantitative Limit',
        desc: 'Pre-authorization requirements for psychiatric evaluation exceed those for comparable medical/surgical procedures.',
        code: 'MHPAEA § 29 CFR 2590.712(c)(4)',
        severity: 'medium',
      });
    }
    if (sessions.length >= 4 && analytics.some(a => a.thresholdMet)) {
      violations.push({
        type: 'Medical Necessity Denial Despite Evidence',
        desc: `${sessions.length} documented art therapy sessions with clinical threshold met. Denial contradicts objective screening evidence.`,
        code: 'MHPAEA § 712(c)(3)',
        severity: 'high',
      });
    }
    return violations;
  }, [formData.requestedService, patient, sessions, analytics]);

  const matchedPrecedents = useMemo(() => {
    return PRECEDENT_DB.filter(p => {
      if (patient?.isNonverbal && p.relevance.toLowerCase().includes('nonverbal')) return true;
      if (p.relevance.toLowerCase().includes('art therapy')) return true;
      if (parityViolations.length > 0 && p.relevance.toLowerCase().includes('parity')) return true;
      return false;
    });
  }, [patient, parityViolations]);

  const avgWinRate = matchedPrecedents.length > 0
    ? Math.round(matchedPrecedents.reduce((a, b) => a + b.winRate, 0) / matchedPrecedents.length)
    : 60;

  const avgStress = analytics.length > 0
    ? analytics.reduce((a, b) => a + (b.stressScore || 0), 0) / analytics.length
    : 0;

  const replayEvidence = useMemo(() => getReplayForPatient(patient), [patient]);

  const estimatedCost = formData.requestedService === 'both' ? 4800 : 2400;
  const planPays = Math.round(estimatedCost * (inNetwork ? 0.8 : 0.5));
  const patientOwes = estimatedCost - planPays;
  const coveragePercent = inNetwork ? 80 : 50;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStep('agent_submitting');
  };

  const handleOpenPortal = async () => {
    try {
      await automatePortalSubmission(matchedInsurer?.id || 'united', formData, (step, message) => {
        console.log(`Step ${step}: ${message}`);
      });
    } catch (error) {
      console.error('Portal automation error:', error);
      alert(error.message);
    }
  };

  const handleDraftEmail = () => {
    try {
      draftClaimSubmissionEmail(patient, matchedInsurer, formData.insuranceId);
    } catch (error) {
      console.error('Email draft error:', error);
      alert('Failed to open Gmail. Please ensure popups are allowed.');
    }
  };

  if (!patient) {
    return (
      <div className="ins-page">
        <header className="ins-topnav">
          <button className="ins-back" onClick={() => navigate('/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <nav className="ins-nav-pills">
            <button className="ins-nav-pill" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="ins-nav-pill ins-nav-active">Claims</button>
            <button className="ins-nav-pill" onClick={() => navigate('/integrations')}>Network</button>
          </nav>
          <div className="ins-topnav-right">
            <div className="ins-user-avatar">Dr</div>
          </div>
        </header>

        <div className="ins-content">
          <div className="ins-no-patient">
            <div className="ins-np-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h2>Select a Patient to File a Claim</h2>
            <p>Start an insurance claim or appeal by selecting a patient from your active roster.</p>

            <div className="ins-patient-list">
              {MOCK_PATIENTS.map(p => (
                <div key={p.id} className="ins-pl-item" onClick={() => navigate('/insurance', { state: { patientId: p.id }, replace: true })}>
                  <div className={`ins-pl-avatar ins-pl-av-${p.riskLevel || 'low'}`}>{p.name.charAt(0)}</div>
                  <div className="ins-pl-info">
                    <span className="ins-pl-name">{p.name}</span>
                    <span className="ins-pl-sub">{p.diagnosis || 'Active Patient'}</span>
                  </div>
                  <div className="ins-pl-insurer">
                    <span className="ins-pl-insurer-name">{p.insuranceProvider}</span>
                    <span className={`ins-pl-network ${isInNetwork(p.insuranceProvider) ? 'ins-pl-in' : 'ins-pl-out'}`}>
                      {isInNetwork(p.insuranceProvider) ? 'In-Network' : 'Out-of-Network'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ins-page">
      <header className="ins-topnav">
        <button className="ins-back" onClick={() => navigate(`/dashboard/${patient.id}`)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <nav className="ins-nav-pills">
          <button className="ins-nav-pill" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="ins-nav-pill ins-nav-active">Claims</button>
          <button className="ins-nav-pill" onClick={() => navigate('/integrations')}>Network</button>
        </nav>
        <div className="ins-topnav-right">
          <div className="ins-user-avatar">Dr</div>
        </div>
      </header>

      <div className="ins-content">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Network Status Banner */}
              {!inNetwork && (
                <div className="ins-oon-banner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                  </svg>
                  <div>
                    <strong>Out-of-Network: {patient.insuranceProvider}</strong>
                    <p>This insurer is not in your practice network. Coverage may be reduced (est. 50% vs 80%). <button className="ins-oon-link" onClick={() => navigate('/integrations')}>Add to network</button></p>
                  </div>
                </div>
              )}

              {inNetwork && matchedInsurer ? (
                <div className="ins-in-banner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div>
                    <strong>In-Network: {matchedInsurer.name}</strong>
                    <p>MH denial rate: {matchedInsurer.policies.denialRate} · Processing: {matchedInsurer.policies.avgProcessing} · {matchedInsurer.policies.priorAuthRequired ? 'Prior auth required' : 'No prior auth needed'}</p>
                  </div>
                </div>
              ) : null}

              {/* Claim Header */}
              <div className="ins-claim-header">
                <div className="ins-claim-title">
                  <h1>Insurance Claim<br /><span>Pre-Authorization Submission</span></h1>
                </div>
                <div className="ins-claim-meta">
                  <div className="ins-meta-patient">
                    <div className="ins-meta-avatar">{patient.avatar}</div>
                    <div>
                      <span className="ins-meta-name">{patient.name}</span>
                      <span className="ins-meta-email">{patient.insuranceProvider}</span>
                    </div>
                  </div>
                  <div className="ins-meta-pills">
                    <div className="ins-meta-pill">
                      <span className="imp-label">Date of service</span>
                      <span className="imp-value">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                    </div>
                    <div className="ins-meta-pill">
                      <span className="imp-label">Claim ref.</span>
                      <span className="imp-value">{formData.insuranceId || 'PENDING'}</span>
                    </div>
                    <div className="ins-meta-pill">
                      <span className="imp-label">Sessions on file</span>
                      <span className="imp-value">{sessions.length}</span>
                    </div>
                    <div className="ins-meta-pill">
                      <span className="imp-label">Replay session</span>
                      <span className="imp-value">#{replayEvidence.sessionId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="ins-grid">
                {/* Left Column: Form Details */}
                <div className="ins-form-col">
                  <form onSubmit={handleSubmit}>
                    <div className="ins-form-section card">
                      <h3>Clinical Information</h3>
                      <p className="ins-form-hint">Auto-filled from {patient.name}'s {sessions.length} VoiceCanvas sessions</p>
                      <div className="ins-form-grid">
                        <div className="ins-fg">
                          <label>Chief Complaint</label>
                          <textarea value={formData.chiefComplaint} onChange={e => handleChange('chiefComplaint', e.target.value)} rows={2} />
                        </div>
                        <div className="ins-fg">
                          <label>Symptom Duration</label>
                          <input type="text" value={formData.symptomDuration} onChange={e => handleChange('symptomDuration', e.target.value)} />
                        </div>
                        <div className="ins-fg">
                          <label>Functional Impairment</label>
                          <textarea value={formData.functionalImpairment} onChange={e => handleChange('functionalImpairment', e.target.value)} rows={2} />
                        </div>
                        <div className="ins-fg-2col">
                          <div className="ins-fg">
                            <label>Diagnosis (ICD-10)</label>
                            <input type="text" value={formData.diagnosisCategory} onChange={e => handleChange('diagnosisCategory', e.target.value)} />
                          </div>
                          <div className="ins-fg">
                            <label>Requested Service</label>
                            <select value={formData.requestedService} onChange={e => handleChange('requestedService', e.target.value)}>
                              <option value="therapy">Art Therapy (90837)</option>
                              <option value="psychiatric eval">Psychiatric Eval (96130)</option>
                              <option value="both">Both</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ins-form-section card" style={{ marginTop: 20 }}>
                      <h3>Patient & Provider Details</h3>
                      <div className="ins-form-grid">
                        <div className="ins-fg-2col">
                          <div className="ins-fg">
                            <label>Patient Name</label>
                            <input type="text" value={formData.patientName} readOnly />
                          </div>
                          <div className="ins-fg">
                            <label>Date of Birth</label>
                            <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} />
                          </div>
                        </div>
                        <div className="ins-fg-2col">
                          <div className="ins-fg">
                            <label>Insurance Provider</label>
                            <input type="text" value={formData.insurerName} readOnly />
                          </div>
                          <div className="ins-fg">
                            <label>Insurance ID</label>
                            <input type="text" value={formData.insuranceId} onChange={e => handleChange('insuranceId', e.target.value)} />
                          </div>
                        </div>
                        <div className="ins-fg-2col">
                          <div className="ins-fg">
                            <label>Group Number</label>
                            <input type="text" value={formData.groupNumber} onChange={e => handleChange('groupNumber', e.target.value)} />
                          </div>
                          <div className="ins-fg">
                            <label>Provider NPI</label>
                            <input type="text" value={formData.providerNPI} onChange={e => handleChange('providerNPI', e.target.value)} />
                          </div>
                        </div>
                        <div className="ins-fg">
                          <label>Treating Provider</label>
                          <input type="text" value={formData.providerName} onChange={e => handleChange('providerName', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="ins-evidence-package card" style={{ marginTop: 20 }}>
                      <div className="ins-ep-header">
                        <h3>Evidence Package</h3>
                        <span className="ins-ep-badge">AUTO-COMPILED</span>
                      </div>
                      <p className="ins-ep-desc">Supporting documentation assembled from VoiceCanvas session records, SOAP notes, optional session replay with affective analysis, and structured exports for this payer.</p>

                      <div className="ins-ep-section">
                        <h4>Session data ({sessions.length} records)</h4>
                        <div className="ins-evidence-stats">
                          <div className="ins-ev-stat">
                            <span className="ins-ev-val">{sessions.length}</span>
                            <span className="ins-ev-label">Sessions</span>
                          </div>
                          <div className="ins-ev-stat">
                            <span className="ins-ev-val">{avgStress.toFixed(1)}</span>
                            <span className="ins-ev-label">Avg stress</span>
                          </div>
                          <div className="ins-ev-stat">
                            <span className="ins-ev-val">{analytics.filter(a => a.thresholdMet).length}</span>
                            <span className="ins-ev-label">Above threshold</span>
                          </div>
                          <div className="ins-ev-stat">
                            <span className="ins-ev-val">{sessions.filter(s => s.result.crisis_flag).length}</span>
                            <span className="ins-ev-label">Crisis flags</span>
                          </div>
                        </div>
                      </div>

                      {sessions.length > 0 && (
                        <>
                          <div className="ins-ep-section">
                            <h4>Video replay (session #{replayEvidence.sessionId})</h4>
                            <p className="ins-ep-inline-desc">Prompt: <strong>{replayEvidence.promptTitle}</strong> · Recorded {new Date(replayEvidence.sessionDate).toLocaleString()} · Clinical stress {replayEvidence.sessionStressScore != null ? `${replayEvidence.sessionStressScore.toFixed(1)}/10` : '—'}</p>
                            <div className="ins-ep-replay-row">
                              <div className="ins-ep-replay-stat">
                                <span className="ins-ep-rs-val">{replayEvidence.emotionTimeline.length}</span>
                                <span className="ins-ep-rs-label">Emotion frames analyzed</span>
                              </div>
                              <div className="ins-ep-replay-stat">
                                <span className="ins-ep-rs-val">{replayEvidence.overallAnalysis.dominantEmotion}</span>
                                <span className="ins-ep-rs-label">Dominant emotion</span>
                              </div>
                              <div className="ins-ep-replay-stat">
                                <span className="ins-ep-rs-val" style={{ color: replayEvidence.overallAnalysis.positiveShift ? 'var(--green-600)' : 'var(--rose-500)' }}>
                                  {replayEvidence.overallAnalysis.positiveShift ? '+' : ''}{(replayEvidence.overallAnalysis.endValence - replayEvidence.overallAnalysis.startValence).toFixed(2)}
                                </span>
                                <span className="ins-ep-rs-label">Valence shift</span>
                              </div>
                            </div>
                            <div className="ins-ep-emotion-bar">
                              {replayEvidence.emotionTimeline.map((evt, i) => (
                                <div key={i} className="ins-ep-eb-seg" style={{ background: getEmotionColor(evt.emotion) }} title={`${evt.label}: ${evt.emotion}`} />
                              ))}
                            </div>
                            <button type="button" className="ins-ep-replay-link" onClick={() => navigate(`/replay/${patient.id}`)}>Open full replay viewer</button>
                          </div>

                          <div className="ins-ep-section">
                            <h4>Brain sensory & biometric signals</h4>
                            <div className="ins-ep-bio-grid">
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Stress-linked signals</span>
                                <div className="ins-ep-bio-tags">
                                  {replayEvidence.overallAnalysis.stressIndicators.map(ind => (
                                    <span key={ind} className="ins-ep-tag ins-ep-tag-stress">{ind.replace(/_/g, ' ')}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Positive / regulatory signals</span>
                                <div className="ins-ep-bio-tags">
                                  {replayEvidence.overallAnalysis.positiveIndicators.map(ind => (
                                    <span key={ind} className="ins-ep-tag ins-ep-tag-positive">{ind.replace(/_/g, ' ')}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Peak stress window</span>
                                <span className="ins-ep-bio-val ins-ep-bio-negative">{replayEvidence.overallAnalysis.peakStress.emotion} at 0:{String(replayEvidence.overallAnalysis.peakStress.time).padStart(2, '0')}</span>
                              </div>
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Peak positive window</span>
                                <span className="ins-ep-bio-val ins-ep-bio-positive">{replayEvidence.overallAnalysis.peakPositive.emotion} at 0:{String(replayEvidence.overallAnalysis.peakPositive.time).padStart(2, '0')}</span>
                              </div>
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Verbal / subvocal attempts</span>
                                <span className="ins-ep-bio-val">{replayEvidence.overallAnalysis.verbalAttempts}</span>
                              </div>
                              <div className="ins-ep-bio-item">
                                <span className="ins-ep-bio-label">Smile events</span>
                                <span className="ins-ep-bio-val">{replayEvidence.overallAnalysis.smileCount}</span>
                              </div>
                            </div>
                          </div>

                          <div className="ins-ep-section">
                            <h4>Drawing indicators (recent sessions)</h4>
                            <div className="ins-ep-drawing-grid">
                              {sessions.slice(-4).reverse().map((s) => (
                                <div key={s.id} className="ins-ep-drawing-item">
                                  <span className="ins-ep-di-date">{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  <div className="ins-ep-di-indicators">
                                    <span className={s.result.indicators.isolation >= 3 ? 'ins-ep-di-flag' : ''}>Isolation {s.result.indicators.isolation}/5</span>
                                    <span className={s.result.indicators.red_pct >= 40 ? 'ins-ep-di-flag' : ''}>Red {s.result.indicators.red_pct}%</span>
                                    <span>Pressure {s.result.indicators.line_pressure}</span>
                                  </div>
                                  <span className={`ins-ep-di-score ${s.stressScore >= 7 ? 'ins-ep-di-high' : s.stressScore >= 5 ? 'ins-ep-di-mid' : 'ins-ep-di-low'}`}>{s.stressScore.toFixed(1)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="ins-ep-attached">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                        <span>{sessions.length} SOAP session reports{sessions.length > 0 ? ' + 1 session replay package (demo video + affect timeline) + biometric summary' : ''} + parity screening + FHIR-ready observations</span>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Right Column: Sticky Clinical Sidebar */}
                <aside className="ins-sidebar-col">
                  <div className="ins-sticky-segment">
                    {/* TraceGuard */}
                    <TraceGuard
                      formData={formData}
                      patient={patient}
                      sessions={sessions}
                      parityViolations={parityViolations}
                      insurer={matchedInsurer}
                    />

                    {/* Financial Summary */}
                    <div className="ins-fin-summary card" style={{ marginTop: 20 }}>
                      <h4>Financial Overview</h4>
                      <div className="ins-fin-grid">
                        <div className="ins-fin-item">
                          <span>Total Estimated</span>
                          <strong>${estimatedCost.toLocaleString()}</strong>
                        </div>
                        <div className="ins-fin-item">
                          <span>Plan Pays ({coveragePercent}%)</span>
                          <strong>-${planPays.toLocaleString()}</strong>
                        </div>
                        <div className="ins-fin-divider" />
                        <div className="ins-fin-item ins-fin-total">
                          <span>Patient Responsibility</span>
                          <strong>${patientOwes.toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="ins-fin-recovery">
                        <span>Expected Appeal Recovery</span>
                        <strong>${Math.round(estimatedCost * avgWinRate / 100).toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Parity Guard */}
                    <div className="ins-parity-card card">
                      <div className="ins-parity-header">
                        <h4>Parity Guard</h4>
                        <span className="ins-parity-badge">ACTIVE</span>
                      </div>
                      {parityViolations.length > 0 ? (
                        <div className="ins-violations">
                          {parityViolations.map((v, i) => (
                            <div key={i} className={`ins-violation ins-v-${v.severity}`}>
                              <strong>{v.type}</strong>
                              <p className="ins-v-desc">{v.desc}</p>
                              <code>{v.code}</code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ins-parity-clear">Parity compliance verified.</p>
                      )}
                    </div>

                    <div className="ins-precedent-card card">
                      <h4>Legal precedents (match)</h4>
                      <div className="ins-prec-list">
                        {matchedPrecedents.map((p, i) => (
                          <div key={i} className="ins-prec-item">
                            <div className="ins-prec-top">
                              <span className="ins-prec-case">{p.case}</span>
                              <span className={`ins-prec-outcome ${p.outcome === 'Patient won' ? 'ins-po-won' : 'ins-po-settled'}`}>{p.outcome}</span>
                            </div>
                            <p className="ins-prec-rel">{p.relevance}</p>
                            <div className="ins-prec-bar-track">
                              <div className="ins-prec-bar-fill" style={{ width: `${p.winRate}%` }} />
                            </div>
                            <span className="ins-prec-rate">{p.winRate}% cited win rate</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Card */}
                    <div className="ins-action-card card">
                      <button className="btn btn-primary btn-block" onClick={handleSubmit}>
                        Submit Claim to {matchedInsurer?.name || patient.insuranceProvider}
                      </button>
                      <button className="btn btn-outline btn-block" onClick={handleOpenPortal} style={{ marginTop: 10 }}>
                        Open Portal & Fill Form
                      </button>
                      <button className="btn btn-outline btn-block" onClick={handleDraftEmail} style={{ marginTop: 10 }}>
                        Draft Email in Gmail
                      </button>
                      <button className="btn btn-outline btn-block" onClick={() => exportInsuranceFormPDF(formData)} style={{ marginTop: 10 }}>
                        Download Form PDF
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          )}

          {step === 'agent_submitting' && (
            <motion.div key="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AgentAutomation 
                title={`Transmitting to ${matchedInsurer?.name || patient.insuranceProvider}`}
                insurerColor={matchedInsurer?.color}
                onComplete={() => setStep('submitted')}
                tasks={[
                  { text: 'Establishing secure EDI 837P connection tunnel...', duration: 1500 },
                  { text: 'Mapping CMS-1500 clinical fields...', subtext: `ICD-10: ${formData.diagnosisCategory}\nCPT: ${formData.requestedService === 'both' ? '90837, 96130' : '90837'}\nModifier: U5`, typeSpeed: 20, duration: 2500 },
                  { text: `Attaching ${sessions.length} encrypted session transcripts...`, duration: 1200 },
                  { text: `Running final MHPAEA parity compliance check...`, subtext: parityViolations.length > 0 ? `Flagged ${parityViolations.length} potential non-quantitative treatment limitations.` : 'Clear. No violations detected.', typeSpeed: 15, duration: 2000 },
                  { text: `Transmitting X12 payload to clearinghouse...`, duration: 1800 },
                  { text: `Awaiting 999 Implementation Acknowledgement...`, subtext: 'Response: ACK_PENDING_REVIEW', typeSpeed: 30, duration: 2000 },
                ]}
              />
            </motion.div>
          )}

          {step === 'submitted' && (
            <motion.div key="submitted" className="ins-submitted" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="ins-submitted-card">
                <div className="ins-check-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <h2>Claim Submitted to {matchedInsurer?.name || patient.insuranceProvider}</h2>
                <p>
                  Pre-authorization for {patient.name} sent for review.
                  {matchedInsurer && ` Expected processing time: ${matchedInsurer.policies.avgProcessing}.`}
                </p>

                <div className="ins-submitted-amount">
                  <span className="ins-sa-label">Requested coverage</span>
                  <span className="ins-sa-val">${estimatedCost.toLocaleString()}</span>
                </div>

                <div className="ins-submitted-details">
                  <div className="ins-sd-row">
                    <span>Patient</span><strong>{patient.name}</strong>
                  </div>
                  <div className="ins-sd-row">
                    <span>Insurer</span><strong>{patient.insuranceProvider}</strong>
                  </div>
                  <div className="ins-sd-row">
                    <span>Network status</span><strong className={inNetwork ? 'ins-sd-green' : 'ins-sd-amber'}>{inNetwork ? 'In-network' : 'Out-of-network'}</strong>
                  </div>
                  <div className="ins-sd-row">
                    <span>Sessions attached</span><strong>{sessions.length}</strong>
                  </div>
                  {sessions.length > 0 && (
                    <div className="ins-sd-row">
                      <span>Video replay evidence</span><strong className="ins-sd-green">Session #{replayEvidence.sessionId} · {replayEvidence.emotionTimeline.length} emotion frames</strong>
                    </div>
                  )}
                  {sessions.length > 0 && (
                    <div className="ins-sd-row">
                      <span>Biometric markers</span><strong>{replayEvidence.overallAnalysis.stressIndicators.length} stress + {replayEvidence.overallAnalysis.positiveIndicators.length} positive</strong>
                    </div>
                  )}
                  <div className="ins-sd-row">
                    <span>SOAP notes attached</span><strong>{sessions.length}</strong>
                  </div>
                  <div className="ins-sd-row">
                    <span>Parity violations flagged</span><strong>{parityViolations.length}</strong>
                  </div>
                </div>

                <div className="ins-denial-sim">
                  <h4>Review Adjudication Response</h4>
                  <p>Check the payer EOB (Explanation of Benefits). If this claim results in a denial, proceed to the appellate workflow to construct an appeal based on federal compliance logic.</p>
                  <button className="ins-btn-deny" style={{ background: matchedInsurer?.color || 'var(--rose-500)' }} onClick={() => navigate('/reclaimant', { state: { patientId: patient.id, insurerId: matchedInsurer?.id || 'united', formData, claimId: formData.insuranceId, estimatedCost } })}>View Claim EOB (MN-4021)</button>
                </div>

                <button className="ins-btn-back" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                  Back to {patient.name}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
