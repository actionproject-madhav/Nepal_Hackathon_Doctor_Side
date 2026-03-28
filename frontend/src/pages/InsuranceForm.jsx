import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientById, getPatientAnalytics } from '../data/mockPatients';
import { findProviderByPatientInsurer, isInNetwork } from '../data/insuranceProviders';
import { exportInsuranceFormPDF } from '../utils/pdfExport';
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
  const [appealGenerated, setAppealGenerated] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

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

  const estimatedCost = formData.requestedService === 'both' ? 4800 : 2400;
  const planPays = Math.round(estimatedCost * (inNetwork ? 0.8 : 0.5));
  const patientOwes = estimatedCost - planPays;
  const coveragePercent = inNetwork ? 80 : 50;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('submitted');
  };

  useEffect(() => {
    if (!patient) navigate('/dashboard', { replace: true });
  }, [patient, navigate]);

  if (!patient) return null;

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

              {inNetwork && matchedInsurer && (
                <div className="ins-in-banner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div>
                    <strong>In-Network: {matchedInsurer.name}</strong>
                    <p>MH denial rate: {matchedInsurer.policies.denialRate} · Processing: {matchedInsurer.policies.avgProcessing} · {matchedInsurer.policies.priorAuthRequired ? 'Prior auth required' : 'No prior auth needed'}</p>
                  </div>
                </div>
              )}

              {/* Claim Header */}
              <div className="ins-claim-header">
                <div className="ins-claim-title">
                  <h1>Insurance Claim<br /><span>Pre-Authorization</span></h1>
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
                      <span className="imp-label">Claim ID</span>
                      <span className="imp-value">{formData.insuranceId || 'PENDING'}</span>
                    </div>
                    <div className="ins-meta-pill">
                      <span className="imp-label">Sessions</span>
                      <span className="imp-value">{sessions.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="ins-financial-row">
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Plan pays ({coveragePercent}%)</span>
                  <span className="ins-fin-amount">${planPays.toLocaleString()}</span>
                  <div className="ins-fin-bar">
                    <div className="ins-fin-bar-fill ins-fin-fill-green" style={{ width: `${coveragePercent}%` }} />
                  </div>
                </div>
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Patient responsibility</span>
                  <span className="ins-fin-amount">${patientOwes.toLocaleString()}</span>
                  <div className="ins-fin-bar">
                    <div className="ins-fin-bar-fill ins-fin-fill-gray" style={{ width: `${100 - coveragePercent}%` }} />
                  </div>
                </div>
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Estimated total</span>
                  <span className="ins-fin-amount ins-fin-amount-lg">${estimatedCost.toLocaleString()}</span>
                </div>
                <div className="ins-fin-card ins-fin-card-accent">
                  <span className="ins-fin-label-dark">If denied, appeal recovery</span>
                  <span className="ins-fin-amount-accent">${Math.round(estimatedCost * avgWinRate / 100).toLocaleString()}</span>
                  <span className="ins-fin-subtext">{avgWinRate}% win rate based on precedents</span>
                </div>
              </div>

              {/* Two Column: Form + Parity */}
              <div className="ins-two-col">
                <form className="ins-form-col" onSubmit={handleSubmit}>
                  <div className="ins-form-section">
                    <h3>Clinical Information</h3>
                    <p className="ins-form-hint">
                      Auto-filled from {patient.name}'s {sessions.length} VoiceCanvas sessions
                    </p>
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

                  <div className="ins-form-section">
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

                  <div className="ins-form-actions">
                    <button type="submit" className="ins-btn-submit">
                      Submit to {matchedInsurer?.name || patient.insuranceProvider}
                    </button>
                    <button type="button" className="ins-btn-secondary" onClick={() => exportInsuranceFormPDF(formData)}>Download PDF</button>
                  </div>
                </form>

                {/* Right: Parity + Precedents + Evidence */}
                <div className="ins-parity-col">
                  <div className="ins-parity-card">
                    <div className="ins-parity-header">
                      <h3>Parity Guard</h3>
                      <span className="ins-parity-badge">AI PROTECTED</span>
                    </div>

                    {parityViolations.length > 0 ? (
                      <>
                        <div className="ins-parity-alert">
                          <span className="ins-pa-count">{parityViolations.length}</span>
                          <div>
                            <strong>Parity Violation{parityViolations.length > 1 ? 's' : ''} Detected</strong>
                            <p>MHPAEA compliance issues found for {matchedInsurer?.name || patient.insuranceProvider}</p>
                          </div>
                        </div>
                        <div className="ins-violations">
                          {parityViolations.map((v, i) => (
                            <div key={i} className={`ins-violation ins-v-${v.severity}`}>
                              <span className="ins-v-type">{v.type}</span>
                              <p>{v.desc}</p>
                              <code>{v.code}</code>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="ins-parity-clear">No parity violations detected. Coverage probability is high.</p>
                    )}
                  </div>

                  <div className="ins-precedent-card">
                    <h3>Legal Precedents</h3>
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
                          <span className="ins-prec-rate">{p.winRate}% win rate</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ins-sessions-card">
                    <h3>Clinical Evidence Summary</h3>
                    <div className="ins-evidence-stats">
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{sessions.length}</span>
                        <span className="ins-ev-label">Sessions</span>
                      </div>
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{avgStress.toFixed(1)}</span>
                        <span className="ins-ev-label">Avg Stress</span>
                      </div>
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{analytics.filter(a => a.thresholdMet).length}</span>
                        <span className="ins-ev-label">Above Threshold</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  <div className="ins-sd-row">
                    <span>Parity violations flagged</span><strong>{parityViolations.length}</strong>
                  </div>
                </div>

                <div className="ins-denial-sim">
                  <h4>Demo: Simulate a Denial</h4>
                  <p>In production, denials arrive in 5-30 days. For this demo, simulate a denial to see the Reclaimant auto-appeal engine.</p>
                  <button className="ins-btn-deny" onClick={() => setStep('denied')}>Simulate Insurer Denial</button>
                </div>

                <button className="ins-btn-back" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                  Back to {patient.name}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'denied' && (
            <motion.div key="denied" className="ins-denied-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ins-denial-banner">
                <h2>Claim Denied by {matchedInsurer?.name || patient.insuranceProvider}</h2>
                <p>"Insufficient medical necessity documentation for requested mental health services."</p>
                <div className="ins-denial-meta">
                  <span className="ins-denial-code">Denial Code: MN-4021</span>
                  {matchedInsurer && (
                    <span className="ins-denial-window">Appeal window: {matchedInsurer.policies.appealWindow}</span>
                  )}
                </div>
              </div>

              <div className="ins-reclaimant">
                <div className="ins-recl-header">
                  <h3>Reclaimant Auto-Appeal</h3>
                  <span className="ins-recl-badge">AI-Powered</span>
                </div>

                <div className="ins-recl-steps">
                  <div className="ins-recl-step ins-rs-done">
                    <span className="ins-rs-num">1</span>
                    <div>
                      <strong>Denial Analysis</strong>
                      <p>Parsed denial reason via NLP. Denial code MN-4021 maps to "medical necessity" category. {patient.isNonverbal ? 'Patient is nonverbal — MHPAEA protected class applies.' : 'Checking parity compliance.'}</p>
                    </div>
                  </div>

                  <div className="ins-recl-step ins-rs-done">
                    <span className="ins-rs-num">2</span>
                    <div>
                      <strong>Parity Violation Check</strong>
                      <p>{parityViolations.length} MHPAEA violation{parityViolations.length !== 1 ? 's' : ''} detected against {matchedInsurer?.name || patient.insuranceProvider}.
                      {matchedInsurer && ` This insurer has a ${matchedInsurer.policies.denialRate} MH denial rate and is ${matchedInsurer.policies.parityCompliant === 'Yes' ? '' : 'not fully '}parity compliant.`}</p>
                    </div>
                  </div>

                  <div className="ins-recl-step ins-rs-done">
                    <span className="ins-rs-num">3</span>
                    <div>
                      <strong>Precedent Match</strong>
                      <p>{matchedPrecedents.length} relevant cases from 15-year litigation database.</p>
                      <div className="ins-recl-cases">
                        {matchedPrecedents.map((p, i) => (
                          <div key={i} className="ins-recl-case">
                            <span>{p.case}</span>
                            <span className={`ins-rc-badge ${p.outcome === 'Patient won' ? 'ins-rc-won' : 'ins-rc-settled'}`}>{p.outcome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={`ins-recl-step ${appealGenerated ? 'ins-rs-done' : 'ins-rs-pending'}`}>
                    <span className="ins-rs-num">4</span>
                    <div>
                      <strong>Generate Appeal Letter</strong>
                      {!appealGenerated ? (
                        <button className="ins-btn-generate" onClick={() => setAppealGenerated(true)}>Generate Appeal</button>
                      ) : (
                        <motion.div className="ins-appeal-letter" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <p><strong>To:</strong> {matchedInsurer?.name || patient.insuranceProvider} — Appeals & Grievances Dept.</p>
                          <p><strong>Re:</strong> Appeal of Denial MN-4021 — {formData.patientName}, ID {formData.insuranceId}</p>
                          <p><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <hr />
                          <p>Dear Appeals Officer,</p>
                          <p>We are writing to formally appeal the denial of pre-authorization for {formData.patientName} under the Mental Health Parity and Addiction Equity Act (MHPAEA).</p>
                          <p><strong>Clinical Evidence:</strong> {sessions.length} AI-analyzed art therapy sessions via VoiceCanvas. Average stress score: {avgStress.toFixed(1)}/10. Clinical threshold met in {analytics.filter(a => a.thresholdMet).length} of {sessions.length} sessions. {sessions.filter(s => s.result.crisis_flag).length > 0 ? `Crisis flags triggered in ${sessions.filter(s => s.result.crisis_flag).length} session(s).` : ''}</p>
                          <p><strong>Parity Violations:</strong> {parityViolations.map(v => `${v.type} (${v.code})`).join('; ') || 'None identified'}.</p>
                          <p><strong>Legal Precedent:</strong> {matchedPrecedents.map(p => `${p.case} — ${p.outcome}`).join('; ')}. Average win rate: {avgWinRate}%.</p>
                          <p><strong>Demand:</strong> We request immediate approval of the requested services within 30 days per {matchedInsurer?.policies.appealWindow || '180 days'} appeal window requirements.</p>
                          <div className="ins-appeal-footer">
                            Estimated appeal success: <strong>{avgWinRate}%</strong>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {appealGenerated && (
                    <div className={`ins-recl-step ${appealSubmitted ? 'ins-rs-done' : 'ins-rs-pending'}`}>
                      <span className="ins-rs-num">5</span>
                      <div>
                        <strong>Submit Appeal</strong>
                        {!appealSubmitted ? (
                          <button className="ins-btn-generate" onClick={() => setAppealSubmitted(true)}>Submit to {matchedInsurer?.name || patient.insuranceProvider}</button>
                        ) : (
                          <motion.div className="ins-appeal-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p>Appeal submitted to {matchedInsurer?.name || patient.insuranceProvider}. Expected response within 30-45 days.</p>
                            <div className="ins-appeal-amount">
                              Estimated recovery: <strong>${Math.round(estimatedCost * avgWinRate / 100).toLocaleString()}</strong>
                            </div>
                            <div className="ins-appeal-tracker">
                              <div className="ins-at-step ins-at-active">Submitted</div>
                              <div className="ins-at-line" />
                              <div className="ins-at-step">Under Review</div>
                              <div className="ins-at-line" />
                              <div className="ins-at-step">Decision</div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button className="ins-btn-back" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                Back to {patient.name}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="ins-disclaimer">DEMO ONLY — No real insurance submission. Not HIPAA compliant.</p>
      </div>
    </div>
  );
}
