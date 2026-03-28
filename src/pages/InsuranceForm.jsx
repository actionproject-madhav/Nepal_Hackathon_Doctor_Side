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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('submitted');
  };

  const handleSimulateDenial = () => {
    setStep('denied');
  };

  const fields = [
    {
      section: 'Clinical Information',
      desc: patient ? `Auto-populated from ${patient.name}'s ${sessions.length} sessions` : 'Auto-populated from AI drawing analysis',
      fields: [
        { key: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea' },
        { key: 'symptomDuration', label: 'Symptom Duration', type: 'text' },
        { key: 'functionalImpairment', label: 'Functional Impairment', type: 'textarea' },
        { key: 'diagnosisCategory', label: 'Diagnosis Category', type: 'text' },
        { key: 'requestedService', label: 'Requested Service', type: 'select', options: ['therapy', 'psychiatric eval', 'both'] },
      ],
    },
    {
      section: 'Patient Information',
      desc: 'Required for claim submission',
      fields: [
        { key: 'patientName', label: 'Patient Name', type: 'text' },
        { key: 'dob', label: 'Date of Birth', type: 'date' },
        { key: 'insuranceId', label: 'Insurance ID / Member Number', type: 'text' },
        { key: 'groupNumber', label: 'Group Number', type: 'text' },
      ],
    },
    {
      section: 'Provider Information',
      desc: 'Treating clinician details',
      fields: [
        { key: 'providerName', label: 'Provider Name', type: 'text' },
        { key: 'providerNPI', label: 'NPI Number', type: 'text' },
      ],
    },
  ];

  return (
    <div className="insurance-page">
      <header className="ins-header">
        <div className="container">
          <div className="ins-header-inner">
            <button className="btn btn-sm btn-ghost" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')}>
              ← {patient ? patient.name : 'Dashboard'}
            </button>
            <div className="ins-brand">
              <span className="ins-brand-text">VoiceCanvas Clinic</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-narrow ins-main">
        <motion.div className="ins-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1>Insurance Claim + Reclaimant Engine</h1>
          <p>AI-powered parity violation detection, precedent matching, and auto-appeal generation.</p>

          <div className="ins-stats">
            <div className="ins-stat-pill">
              <span className="isp-val">$35,000</span>
              <span className="isp-label">Avg. annual recovery</span>
            </div>
            <div className="ins-stat-pill">
              <span className="isp-val">{avgWinRate}%</span>
              <span className="isp-label">Appeal win rate</span>
            </div>
            <div className="ins-stat-pill">
              <span className="isp-val">2x</span>
              <span className="isp-label">MH denial rate vs medical</span>
            </div>
          </div>

          {patient && (
            <div className="ins-autofill-badge">
              <span className="afb-dot" />
              Clinical data auto-filled from {patient.name}'s {sessions.length} VoiceCanvas sessions ({patient.insuranceProvider})
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form key="form" className="ins-form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
              {fields.map((section, si) => (
                <motion.div key={section.section} className="ins-section card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 + 0.2 }}>
                  <div className="ins-section-header">
                    <div>
                      <h3>{section.section}</h3>
                      <p>{section.desc}</p>
                    </div>
                  </div>
                  <div className="ins-fields">
                    {section.fields.map(field => (
                      <div key={field.key} className="form-group">
                        <label className="form-label" htmlFor={field.key}>{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea className="form-textarea" id={field.key} value={formData[field.key]} onChange={(e) => handleChange(field.key, e.target.value)} rows={3} />
                        ) : field.type === 'select' ? (
                          <select className="form-select" id={field.key} value={formData[field.key]} onChange={(e) => handleChange(field.key, e.target.value)}>
                            {field.options.map(o => (<option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>))}
                          </select>
                        ) : (
                          <input className="form-input" type={field.type} id={field.key} value={formData[field.key]} onChange={(e) => handleChange(field.key, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}

              <motion.div className="ins-parity card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="parity-header-row">
                  <h3>Parity Guard Analysis</h3>
                  <span className="parity-shield-badge">AI PROTECTED</span>
                </div>
                {parityViolations.length > 0 ? (
                  <>
                    <div className="parity-alert">
                      <strong>{parityViolations.length} Potential Parity Violation{parityViolations.length > 1 ? 's' : ''} Detected</strong>
                      <p>Our AI has flagged elements that may violate the Mental Health Parity and Addiction Equity Act (MHPAEA).</p>
                    </div>
                    <div className="parity-violations">
                      {parityViolations.map((v, i) => (
                        <div key={i} className={`parity-violation pv-${v.severity}`}>
                          <span className="pv-type">{v.type}</span>
                          <p>{v.desc}</p>
                          <code className="pv-code">{v.code}</code>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="parity-clear">No immediate parity violations detected. Coverage probability is high.</p>
                )}
              </motion.div>

              <div className="ins-form-actions">
                <button type="submit" className="btn btn-primary btn-lg">Submit Pre-Authorization</button>
                <button type="button" className="btn btn-secondary" onClick={() => exportInsuranceFormPDF(formData)}>Download as PDF</button>
              </div>
            </motion.form>
          )}

          {step === 'submitted' && (
            <motion.div key="submitted" className="ins-result card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <h2>Pre-Authorization Submitted</h2>
              <p>In production, this would be sent to {patient?.insuranceProvider || 'the insurance provider'} via secure API.</p>
              <div className="ins-sim-denial">
                <h4>Want to see the Reclaimant auto-appeal in action?</h4>
                <p>Simulate a denial to watch the AI generate a legal appeal with precedent matching.</p>
                <button className="btn btn-danger" onClick={handleSimulateDenial}>Simulate Insurance Denial</button>
              </div>
              <div className="ins-result-nav">
                <button className="btn btn-primary" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')}>
                  ← {patient ? `${patient.name}'s Profile` : 'Dashboard'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'denied' && (
            <motion.div key="denied" className="ins-denied" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="denial-notice card">
                <h2>Claim Denied</h2>
                <p className="denial-reason">"Insufficient medical necessity documentation for requested mental health services."</p>
                <span className="badge badge-red">Denial Code: MN-4021</span>
              </div>

              <motion.div className="reclaimant-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="recl-header">
                  <h3>Reclaimant Auto-Appeal Engine</h3>
                  <span className="badge badge-blue">AI-Powered</span>
                </div>
                <div className="recl-steps">
                  <div className="recl-step recl-done">
                    <span className="recl-step-num">1</span>
                    <div>
                      <strong>Denial NLP Scan</strong>
                      <p>Parsed denial text — triggered parity violation check {patient?.isNonverbal ? '(nonverbal patient = protected class)' : ''}</p>
                    </div>
                  </div>
                  <div className="recl-step recl-done">
                    <span className="recl-step-num">2</span>
                    <div>
                      <strong>Precedent Database Match</strong>
                      <p>Queried 15-year litigation database — {matchedPrecedents.length} matching cases found</p>
                      <div className="recl-precedents">
                        {matchedPrecedents.map((p, i) => (
                          <div key={i} className="recl-precedent">
                            <span className="rp-case">{p.case}</span>
                            <span className={`badge ${p.outcome === 'Patient won' ? 'badge-green' : 'badge-yellow'}`}>{p.outcome}</span>
                            <span className="rp-rel">{p.relevance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`recl-step ${appealGenerated ? 'recl-done' : 'recl-pending'}`}>
                    <span className="recl-step-num">3</span>
                    <div>
                      <strong>Generate Legal Appeal Letter</strong>
                      {!appealGenerated ? (
                        <button className="btn btn-primary btn-sm" onClick={() => setAppealGenerated(true)} style={{ marginTop: 8 }}>Generate Appeal</button>
                      ) : (
                        <motion.div className="appeal-letter" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                          <p><strong>To:</strong> {patient?.insuranceProvider || 'Insurance'} Compliance Officer & Medical Director</p>
                          <p><strong>Subject:</strong> Formal Appeal — MHPAEA Violations — Claim #{formData.insuranceId || 'PENDING'}</p>
                          <p><strong>Re:</strong> {formData.patientName || 'Patient'}, Denial Code MN-4021</p>
                          <hr />
                          <p>This appeal is submitted using the Reclaimant Legal Precedent Database (15+ years of litigation history). Our analysis detects direct violations of the Mental Health Parity and Addiction Equity Act (MHPAEA).</p>
                          <p><strong>Exhibit A:</strong> {sessions.length} AI-analyzed art therapy drawings with clinical stress scores averaging {avgStress.toFixed(1)}/10.{analytics.filter(a => a.thresholdMet).length > 0 && ` Clinical threshold met in ${analytics.filter(a => a.thresholdMet).length} sessions.`}</p>
                          <p><strong>Clinical:</strong> {formData.diagnosisCategory || 'Anxiety indicators'} documented across {sessions.length} sessions. Functional impairment: {formData.functionalImpairment || 'As documented'}.</p>
                          <p><strong>Legal:</strong> Parity Act violations per {parityViolations.map(v => v.code).join(', ') || 'MHPAEA § 712'}. Precedent: {matchedPrecedents.map(p => p.case).join('; ') || 'Multiple matching cases'}.</p>
                          <p><strong>Demand:</strong> Approve requested services within 30 days per regulatory requirements.</p>
                          <p className="appeal-footer">Win probability: <strong>{avgWinRate}%</strong> based on matched precedents.</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {appealGenerated && (
                    <div className={`recl-step ${appealSubmitted ? 'recl-done' : 'recl-pending'}`}>
                      <span className="recl-step-num">4</span>
                      <div>
                        <strong>Submit Appeal</strong>
                        {!appealSubmitted ? (
                          <button className="btn btn-primary btn-sm" onClick={() => setAppealSubmitted(true)} style={{ marginTop: 8 }}>Submit Appeal</button>
                        ) : (
                          <motion.div className="appeal-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <p>Appeal submitted to {patient?.insuranceProvider || 'insurer'}. Expected response within 30-45 days.</p>
                            <p>Estimated recovery: <strong>${formData.requestedService === 'both' ? '1,200' : '720'}</strong></p>
                            <div className="appeal-tracker">
                              <span className="badge badge-green">Submitted</span>
                              <span className="at-line" />
                              <span className="badge badge-yellow">Under Review</span>
                              <span className="at-line" />
                              <span className="badge badge-blue">Pending</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              <button className="btn btn-ghost" onClick={() => patient ? navigate(`/dashboard/${patient.id}`) : navigate('/dashboard')} style={{ marginTop: 16 }}>
                ← Back to {patient ? patient.name : 'Dashboard'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="ins-disclaimer">DEMO ONLY — No real insurance submission occurs. Not HIPAA compliant.</p>
      </div>
    </div>
  );
}
