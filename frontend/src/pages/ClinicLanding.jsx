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
            <div className="cl-logo-group">
              <div className="cl-logo-mark">V</div>
              <span className="cl-logo-text">VoiceCanvas Clinic</span>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Open Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="cl-main">
        <div className="container">
          <motion.div className="cl-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <span className="cl-hero-badge">For Mental Health Professionals</span>
            <h1>Your non-verbal patients<br />finally have a voice.</h1>
            <p>AI-powered clinical documentation from patient drawings. Session replay with facial analysis. Insurance auto-appeal with 71% win rate.</p>
            <div className="cl-hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                Open Clinic Dashboard
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>
                View Demo Data
              </button>
            </div>
          </motion.div>

          <motion.div className="cl-features" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {[
              {
                icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                title: 'AI Clinical Notes',
                desc: 'SOAP notes auto-generated from patient drawings. Edit inline, export as PDF or FHIR JSON.',
                color: 'var(--green-500)',
                bg: 'var(--green-50)',
              },
              {
                icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                title: 'Session Replay',
                desc: 'Watch drawings unfold stroke-by-stroke with synchronized facial expression analysis.',
                color: 'var(--violet-500)',
                bg: 'var(--violet-50)',
              },
              {
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                title: 'Reclaimant Engine',
                desc: 'When insurance denies, Reclaimant detects parity violations and auto-generates legal appeals.',
                color: 'var(--amber-500)',
                bg: 'var(--amber-50)',
              },
            ].map((f, i) => (
              <motion.div key={i} className="cl-feature card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                <div className="cl-feature-icon" style={{ background: f.bg, color: f.color }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="cl-stats" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { val: '$35K', label: 'Avg. annual recovery per practice' },
              { val: '71%', label: 'Appeal win rate' },
              { val: '2x', label: 'MH denial rate vs medical' },
              { val: '60%', label: 'Providers who appeal win' },
            ].map((s, i) => (
              <div key={i} className="cl-stat">
                <span className="cl-stat-val">{s.val}</span>
                <span className="cl-stat-label">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="cl-footer">
        <p>Demo only — not HIPAA compliant. VoiceCanvas Clinic is a hackathon project.</p>
      </footer>
    </div>
  );
}
