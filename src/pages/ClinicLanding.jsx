import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ClinicLanding.css';

export default function ClinicLanding() {
  const navigate = useNavigate();

  return (
    <div className="clinic-landing">
      <header className="cl-header">
        <div className="container">
          <div className="cl-header-inner">
            <span className="cl-logo">VoiceCanvas Clinic</span>
            <span className="cl-subtitle">For Mental Health Professionals</span>
          </div>
        </div>
      </header>

      <main className="container cl-main">
        <motion.div
          className="cl-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Your non-verbal patients<br />finally have a voice.</h1>
          <p>AI-powered clinical documentation, session replay with facial analysis, and insurance auto-appeal — all from your patients' drawings.</p>
          <button className="btn btn-primary btn-xl" onClick={() => navigate('/dashboard')}>
            Open Clinic Dashboard
          </button>
        </motion.div>

        <motion.div
          className="cl-features"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="cl-feature card">
            <div className="cl-feature-icon" style={{ background: 'var(--teal-50)', color: 'var(--teal-600)' }}>📋</div>
            <h3>AI Clinical Notes</h3>
            <p>SOAP notes auto-generated from patient drawings. Edit inline, export as PDF or FHIR JSON for your EHR.</p>
          </div>
          <div className="cl-feature card">
            <div className="cl-feature-icon" style={{ background: 'var(--violet-50)', color: 'var(--violet-600)' }}>🎬</div>
            <h3>Session Replay</h3>
            <p>Watch drawings unfold stroke-by-stroke with facial expression analysis. Write notes while you watch, not from memory.</p>
          </div>
          <div className="cl-feature card">
            <div className="cl-feature-icon" style={{ background: 'var(--coral-50)', color: 'var(--coral-600)' }}>⚖️</div>
            <h3>Reclaimant</h3>
            <p>When insurance denies, Reclaimant detects parity violations and auto-generates legal appeals with 71% win rate.</p>
          </div>
        </motion.div>

        <motion.div
          className="cl-stats"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="cl-stat">
            <span className="cl-stat-val">$35K</span>
            <span className="cl-stat-label">Avg. annual recovery per practice</span>
          </div>
          <div className="cl-stat">
            <span className="cl-stat-val">71%</span>
            <span className="cl-stat-label">Appeal win rate</span>
          </div>
          <div className="cl-stat">
            <span className="cl-stat-val">2×</span>
            <span className="cl-stat-label">MH denial rate vs medical</span>
          </div>
          <div className="cl-stat">
            <span className="cl-stat-val">60%</span>
            <span className="cl-stat-label">Providers who appeal win</span>
          </div>
        </motion.div>
      </main>

      <footer className="cl-footer">
        <p>Demo only — not HIPAA compliant. VoiceCanvas Clinic is a hackathon project.</p>
      </footer>
    </div>
  );
}
