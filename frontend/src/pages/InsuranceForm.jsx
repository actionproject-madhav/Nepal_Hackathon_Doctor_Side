import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_PATIENTS, getPatientById, getPatientAnalytics } from '../data/mockPatients';
import { findProviderByPatientInsurer, isInNetwork } from '../data/insuranceProviders';
import { getReplayForPatient } from '../data/mockReplay';
import { scanForParityViolations } from '../utils/parityEngine';
import { submitClaimWorkflow } from '../utils/claimOrchestrator';
import TraceGuard from '../components/TraceGuard';
import WorkflowProgress from '../components/WorkflowProgress';
import './InsuranceForm.css';

export default function InsuranceForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { patientId } = location.state || {};

  const patient = patientId ? getPatientById(patientId) : null;
  const analytics = patient ? getPatientAnalytics(patient) : [];
  const sessions = patient?.sessions || [];
  const result = analytics.length > 0 ? analytics[analytics.length - 1] : null;

  const matchedInsurer = patient ? findProviderByPatientInsurer(patient.insuranceProvider) : null;
  const inNetwork = patient ? isInNetwork(patient.insuranceProvider) : false;
  const replayEvidence = useMemo(() => getReplayForPatient(patient), [patient]);

  const [formData] = useState({
    chiefComplaint: result?.insurance_data?.chief_complaint || '',
    symptomDuration: result?.insurance_data?.symptom_duration || '',
    functionalImpairment: result?.insurance_data?.functional_impairment || '',
    diagnosisCategory: result?.insurance_data?.diagnosis_category || patient?.diagnosis || '',
    requestedService: 'both',
    patientName: patient?.name || '',
    dob: patient ? (patient.age === 8 ? '2018-03-15' : patient.age === 16 ? '2010-06-22' : patient.age === 28 ? '1998-01-10' : patient.age === 45 ? '1981-09-05' : '1954-11-30') : '',
    insuranceId: patient ? `INS-${patient.id.replace('pt-', '').toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}` : '',
    insurerName: patient?.insuranceProvider || '',
    groupNumber: patient?.insuranceProvider ? `GRP-${patient.insuranceProvider.substring(0, 3).toUpperCase()}-001` : '',
    providerName: 'Dr. Sarah Mitchell, PhD, LCSW',
    providerNPI: '1234567890',
  });

  const parityViolations = useMemo(() => {
    if (!patient) return [];
    return scanForParityViolations({ patient, sessions, analytics, insurer: matchedInsurer, formData });
  }, [patient, sessions, analytics, matchedInsurer]);

  const avgStress = analytics.length > 0
    ? analytics.reduce((a, b) => a + (b.stressScore || 0), 0) / analytics.length
    : 0;

  // Workflow state
  const [workflowActive, setWorkflowActive] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [workflowMessage, setWorkflowMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitClaim = async () => {
    setWorkflowActive(true);
    setWorkflowStep(0);

    const result = await submitClaimWorkflow(
      formData,
      patient,
      matchedInsurer,
      (step, message, data) => {
        setWorkflowStep(step);
        setWorkflowMessage(message);

        // Handle scrolling
        if (data?.action === 'scroll-verify') {
          document.querySelector('.traceguard-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    );

    if (result.success) {
      setSubmitted(true);
    }
  };

  const handleWorkflowClose = () => {
    setWorkflowActive(false);
    navigate('/dashboard');
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
            <h2>Select a Patient</h2>
            <p>Choose a patient from your roster to process their insurance claim.</p>

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
        <div className="ins-header-compact">
          <div className="ins-hc-patient">
            <div className="ins-hc-avatar">{patient.avatar}</div>
            <div>
              <h1>{patient.name}</h1>
              <p>{patient.insuranceProvider} {inNetwork ? '· In-Network' : '· Out-of-Network'}</p>
            </div>
          </div>
          <div className="ins-hc-meta">
            <div className="ins-hc-stat">
              <span className="ins-hc-label">Sessions</span>
              <span className="ins-hc-value">{sessions.length}</span>
            </div>
            <div className="ins-hc-stat">
              <span className="ins-hc-label">Avg Stress</span>
              <span className="ins-hc-value">{avgStress.toFixed(1)}/10</span>
            </div>
            <div className="ins-hc-stat">
              <span className="ins-hc-label">Diagnosis</span>
              <span className="ins-hc-value">{formData.diagnosisCategory}</span>
            </div>
          </div>
        </div>

        <div className="ins-main-grid">
          <div className="ins-main-content">
            <TraceGuard
              formData={formData}
              patient={patient}
              sessions={sessions}
              parityViolations={parityViolations}
              insurer={matchedInsurer}
            />

            <div className="card" style={{ marginTop: 20 }}>
              <h3>Evidence Summary</h3>
              <div className="ins-evidence-compact">
                <div className="ins-ec-item">
                  <span className="ins-ec-label">Clinical sessions</span>
                  <span className="ins-ec-value">{sessions.length} documented</span>
                </div>
                <div className="ins-ec-item">
                  <span className="ins-ec-label">Session replay</span>
                  <span className="ins-ec-value">#{replayEvidence.sessionId} · {replayEvidence.emotionTimeline.length} emotion frames</span>
                </div>
                <div className="ins-ec-item">
                  <span className="ins-ec-label">Parity violations</span>
                  <span className="ins-ec-value">{parityViolations.length} detected</span>
                </div>
                <div className="ins-ec-item">
                  <span className="ins-ec-label">Documentation</span>
                  <span className="ins-ec-value">SOAP notes + biometric markers + FHIR ready</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ins-sidebar-compact">
            <motion.button
              className="ins-golden-button"
              onClick={handleSubmitClaim}
              disabled={workflowActive}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="ins-gb-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div className="ins-gb-text">
                <span className="ins-gb-title">Submit Claim</span>
                <span className="ins-gb-subtitle">Automated workflow to {matchedInsurer?.name || patient.insuranceProvider}</span>
              </div>
            </motion.button>

            <div className="ins-sb-info">
              <p>This will automatically:</p>
              <ul>
                <li>Open provider portal</li>
                <li>Fill and submit form</li>
                <li>Verify submission</li>
                <li>Draft confirmation email</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <WorkflowProgress
        isActive={workflowActive}
        currentStep={workflowStep}
        message={workflowMessage}
        onClose={handleWorkflowClose}
      />
    </div>
  );
}
