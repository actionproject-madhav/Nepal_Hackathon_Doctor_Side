import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientById, getPatientAnalytics } from '../data/mockPatients';
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

  const [formData, setFormData] = useState({
    chiefComplaint: result?.insurance_data?.chief_complaint || '',
    symptomDuration: result?.insurance_data?.symptom_duration || '',
    functionalImpairment: result?.insurance_data?.functional_impairment || '',
    diagnosisCategory: result?.insurance_data?.diagnosis_category || result?.diagnosis || patient?.diagnosis || '',
    requestedService: result?.insurance_data?.requested_service || 'both',
    patientName: patient?.name || '',
    dob: patient ? (patient.age === 8 ? '2018-03-15' : patient.age === 16 ? '2010-06-22' : patient.age === 28 ? '1998-01-10' : patient.age === 45 ? '1981-09-05' : '1954-11-30') : '',
    insuranceId: patient ? `INS-${patient.id.replace('pt-', '').toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}` : '',
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
  const planPays = Math.round(estimatedCost * 0.7);
  const patientOwes = estimatedCost - planPays;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('submitted');
  };

  return (
    <div className="ins-page">
      {/* Top Nav */}
      <header className="ins-topnav">
        <button className="ins-back" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <nav className="ins-nav-pills">
          <button className="ins-nav-pill" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="ins-nav-pill ins-nav-active">Claims</button>
          <button className="ins-nav-pill">Documents</button>
        </nav>
        <div className="ins-topnav-right">
          <div className="ins-user-avatar">Dr</div>
        </div>
      </header>

      <div className="ins-content">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Claim Header */}
              <div className="ins-claim-header">
                <div className="ins-claim-title">
                  <h1>Mental Health<br /><span>Insurance Claim</span></h1>
                </div>
                <div className="ins-claim-meta">
                  {patient && (
                    <div className="ins-meta-patient">
                      <div className="ins-meta-avatar">{patient.avatar}</div>
                      <div>
                        <span className="ins-meta-name">{patient.name}</span>
                        <span className="ins-meta-email">{patient.insuranceProvider}</span>
                      </div>
                    </div>
                  )}
                  <div className="ins-meta-pills">
                    <div className="ins-meta-pill">
                      <span className="imp-label">Date of service</span>
                      <span className="imp-value">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}</span>
                    </div>
                    <div className="ins-meta-pill">
                      <span className="imp-label">Claim ID</span>
                      <span className="imp-value">{formData.insuranceId || 'PENDING'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="ins-financial-row">
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Plan pays</span>
                  <span className="ins-fin-amount">${(planPays / 1000).toFixed(0)}k</span>
                  <div className="ins-fin-bar">
                    <div className="ins-fin-bar-fill ins-fin-fill-green" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Patient responsibility</span>
                  <span className="ins-fin-amount">${(patientOwes / 1000).toFixed(1)}k</span>
                  <div className="ins-fin-bar">
                    <div className="ins-fin-bar-fill ins-fin-fill-gray" style={{ width: '30%' }} />
                  </div>
                </div>
                <div className="ins-fin-card">
                  <span className="ins-fin-label">Estimated total</span>
                  <span className="ins-fin-amount ins-fin-amount-lg">${(estimatedCost / 1000).toFixed(1)}k</span>
                </div>
                <div className="ins-fin-card ins-fin-card-accent">
                  <span className="ins-fin-label-dark">Appeal recovery</span>
                  <span className="ins-fin-amount-accent">${(estimatedCost * 0.6 / 1000).toFixed(1)}k</span>
                  <span className="ins-fin-subtext">{avgWinRate}% win rate</span>
                </div>
              </div>

              {/* Two Column: Form + Parity */}
              <div className="ins-two-col">
                {/* Left: Form */}
                <form className="ins-form-col" onSubmit={handleSubmit}>
                  <div className="ins-form-section">
                    <h3>Clinical Information</h3>
                    <p className="ins-form-hint">
                      {patient ? `Auto-filled from ${patient.name}'s ${sessions.length} sessions` : 'Enter clinical details'}
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
                      <div className="ins-fg">
                        <label>Diagnosis</label>
                        <input type="text" value={formData.diagnosisCategory} onChange={e => handleChange('diagnosisCategory', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>Requested Service</label>
                        <select value={formData.requestedService} onChange={e => handleChange('requestedService', e.target.value)}>
                          <option value="therapy">Therapy</option>
                          <option value="psychiatric eval">Psychiatric Eval</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="ins-form-section">
                    <h3>Patient & Provider</h3>
                    <div className="ins-form-grid ins-fg-2col">
                      <div className="ins-fg">
                        <label>Patient Name</label>
                        <input type="text" value={formData.patientName} onChange={e => handleChange('patientName', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>Date of Birth</label>
                        <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>Insurance ID</label>
                        <input type="text" value={formData.insuranceId} onChange={e => handleChange('insuranceId', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>Group Number</label>
                        <input type="text" value={formData.groupNumber} onChange={e => handleChange('groupNumber', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>Provider Name</label>
                        <input type="text" value={formData.providerName} onChange={e => handleChange('providerName', e.target.value)} />
                      </div>
                      <div className="ins-fg">
                        <label>NPI Number</label>
                        <input type="text" value={formData.providerNPI} onChange={e => handleChange('providerNPI', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="ins-form-actions">
                    <button type="submit" className="ins-btn-submit">Submit Pre-Authorization</button>
                    <button type="button" className="ins-btn-secondary" onClick={() => exportInsuranceFormPDF(formData)}>Download PDF</button>
                  </div>
                </form>

                {/* Right: Parity + Precedents */}
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
                            <p>MHPAEA compliance issues found</p>
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
                    <h3>Evidence: {sessions.length} Sessions</h3>
                    <div className="ins-evidence-stats">
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{avgStress.toFixed(1)}</span>
                        <span className="ins-ev-label">Avg Stress</span>
                      </div>
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{analytics.filter(a => a.thresholdMet).length}</span>
                        <span className="ins-ev-label">Threshold Met</span>
                      </div>
                      <div className="ins-ev-stat">
                        <span className="ins-ev-val">{sessions.filter(s => s.result.crisis_flag).length}</span>
                        <span className="ins-ev-label">Crisis Flags</span>
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
                <h2>Pre-Authorization Submitted</h2>
                <p>Sent to {patient?.insuranceProvider || 'insurer'} for review. Expected response in 5-10 business days.</p>

                <div className="ins-submitted-amount">
                  <span className="ins-sa-label">Estimated coverage</span>
                  <span className="ins-sa-val">${estimatedCost.toLocaleString()}</span>
                </div>

                <div className="ins-denial-sim">
                  <h4>Test the Reclaimant Engine</h4>
                  <p>Simulate a denial to see AI-powered auto-appeal generation with precedent matching.</p>
                  <button className="ins-btn-deny" onClick={() => setStep('denied')}>Simulate Denial</button>
                </div>

                <button className="ins-btn-back" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')}>
                  Back to {patient ? patient.name : 'Dashboard'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'denied' && (
            <motion.div key="denied" className="ins-denied-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="ins-denial-banner">
                <h2>Claim Denied</h2>
                <p>"Insufficient medical necessity documentation for requested mental health services."</p>
                <span className="ins-denial-code">Denial Code: MN-4021</span>
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
                      <strong>Denial NLP Scan</strong>
                      <p>Parsed denial text. Parity violation check triggered{patient?.isNonverbal ? ' (nonverbal = protected class)' : ''}.</p>
                    </div>
                  </div>

                  <div className="ins-recl-step ins-rs-done">
                    <span className="ins-rs-num">2</span>
                    <div>
                      <strong>Precedent Match</strong>
                      <p>{matchedPrecedents.length} cases found from 15-year litigation database.</p>
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
                    <span className="ins-rs-num">3</span>
                    <div>
                      <strong>Generate Appeal Letter</strong>
                      {!appealGenerated ? (
                        <button className="ins-btn-generate" onClick={() => setAppealGenerated(true)}>Generate Appeal</button>
                      ) : (
                        <motion.div className="ins-appeal-letter" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <p><strong>To:</strong> {patient?.insuranceProvider || 'Insurance'} Compliance Officer</p>
                          <p><strong>Re:</strong> {formData.patientName || 'Patient'} — Denial Code MN-4021</p>
                          <hr />
                          <p>This appeal cites direct violations of the Mental Health Parity and Addiction Equity Act (MHPAEA).</p>
                          <p><strong>Evidence:</strong> {sessions.length} AI-analyzed art therapy sessions. Average stress: {avgStress.toFixed(1)}/10. Clinical threshold met in {analytics.filter(a => a.thresholdMet).length} sessions.</p>
                          <p><strong>Legal basis:</strong> {parityViolations.map(v => v.code).join(', ') || 'MHPAEA § 712'}. Precedent: {matchedPrecedents.map(p => p.case).join('; ')}.</p>
                          <p><strong>Demand:</strong> Approve requested services within 30 days.</p>
                          <div className="ins-appeal-footer">
                            Win probability: <strong>{avgWinRate}%</strong>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {appealGenerated && (
                    <div className={`ins-recl-step ${appealSubmitted ? 'ins-rs-done' : 'ins-rs-pending'}`}>
                      <span className="ins-rs-num">4</span>
                      <div>
                        <strong>Submit Appeal</strong>
                        {!appealSubmitted ? (
                          <button className="ins-btn-generate" onClick={() => setAppealSubmitted(true)}>Submit to {patient?.insuranceProvider || 'Insurer'}</button>
                        ) : (
                          <motion.div className="ins-appeal-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p>Appeal submitted. Response expected within 30-45 days.</p>
                            <div className="ins-appeal-amount">
                              Estimated recovery: <strong>${formData.requestedService === 'both' ? '1,200' : '720'}</strong>
                            </div>
                            <div className="ins-appeal-tracker">
                              <div className="ins-at-step ins-at-active">Submitted</div>
                              <div className="ins-at-line" />
                              <div className="ins-at-step">Under Review</div>
                              <div className="ins-at-line" />
                              <div className="ins-at-step">Pending</div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button className="ins-btn-back" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')}>
                Back to {patient ? patient.name : 'Dashboard'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="ins-disclaimer">DEMO ONLY — No real insurance submission. Not HIPAA compliant.</p>
      </div>
    </div>
  );
}
