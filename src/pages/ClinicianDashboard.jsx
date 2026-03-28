import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_PATIENTS, getOverviewStats } from '../data/mockPatients';
import './ClinicianDashboard.css';

export default function ClinicianDashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  const stats = useMemo(() => getOverviewStats(), []);

  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
        p.languageLabel.toLowerCase().includes(search.toLowerCase());
      const matchRisk = filterRisk === 'all' || p.riskLevel === filterRisk;
      return matchSearch && matchRisk;
    });
  }, [search, filterRisk]);

  function getStressTrend(patient) {
    const scores = patient.sessions.map(s => s.stressScore);
    if (scores.length < 2) return 'stable';
    const recent = scores.slice(-2);
    const diff = recent[1] - recent[0];
    if (diff < -0.5) return 'improving';
    if (diff > 0.5) return 'worsening';
    return 'stable';
  }

  function getLatestStress(patient) {
    const last = patient.sessions[patient.sessions.length - 1];
    return last?.stressScore ?? 0;
  }

  function getAvgStress(patient) {
    const scores = patient.sessions.map(s => s.stressScore);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  return (
    <div className="clinician-dash">
      <header className="cd-header">
        <div className="container">
          <div className="cd-header-inner">
            <div className="cd-brand" onClick={() => navigate('/')}>
              <span className="cd-brand-text">VoiceCanvas Clinic</span>
            </div>
            <nav className="cd-nav">
              <button className="btn btn-sm btn-ghost cd-nav-active">Patients</button>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/insurance')}>Insurance</button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container cd-main">
        {/* Overview Stats */}
        <motion.div
          className="cd-overview-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="cd-overview-card cd-oc-patients">
            <span className="cd-oc-val">{stats.totalPatients}</span>
            <span className="cd-oc-label">Active Patients</span>
          </div>
          <div className="cd-overview-card cd-oc-alerts">
            <span className="cd-oc-val">{stats.activeAlerts}</span>
            <span className="cd-oc-label">High Risk</span>
          </div>
          <div className="cd-overview-card cd-oc-sessions">
            <span className="cd-oc-val">{stats.totalSessions}</span>
            <span className="cd-oc-label">Total Sessions</span>
          </div>
          <div className="cd-overview-card cd-oc-stress">
            <span className="cd-oc-val">{stats.avgStress.toFixed(1)}</span>
            <span className="cd-oc-label">Avg Stress</span>
          </div>
          <div className="cd-overview-card cd-oc-crisis">
            <span className="cd-oc-val">{stats.crisisFlags}</span>
            <span className="cd-oc-label">Crisis Flags</span>
          </div>
          <div className="cd-overview-card cd-oc-insurance">
            <span className="cd-oc-val">{stats.pendingInsurance}</span>
            <span className="cd-oc-label">Insurance Ready</span>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          className="cd-toolbar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="cd-search-wrap">
            <svg className="cd-search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="cd-search"
              placeholder="Search patients, diagnoses, languages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="cd-filter-pills">
            {['all', 'high', 'moderate', 'low'].map(level => (
              <button
                key={level}
                className={`cd-filter-pill ${filterRisk === level ? 'cd-fp-active' : ''}`}
                onClick={() => setFilterRisk(level)}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Patient List */}
        <div className="cd-patient-list">
          {filteredPatients.map((patient, i) => {
            const trend = getStressTrend(patient);
            const latestStress = getLatestStress(patient);
            const avgStress = getAvgStress(patient);
            const hasCrisis = patient.sessions.some(s => s.result.crisis_flag);
            const lastSession = patient.sessions[patient.sessions.length - 1];

            return (
              <motion.div
                key={patient.id}
                className="cd-patient-row card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.06 }}
                onClick={() => navigate(`/dashboard/${patient.id}`)}
              >
                <div className="cd-pr-left">
                  <div className={`cd-pr-avatar cd-pr-avatar-${patient.riskLevel}`}>
                    {patient.avatar}
                  </div>
                  <div className="cd-pr-info">
                    <div className="cd-pr-name-row">
                      <h3>{patient.name}</h3>
                      <span className="cd-pr-age">{patient.age}y</span>
                      <span className="cd-pr-lang">{patient.languageLabel}</span>
                      {hasCrisis && <span className="cd-pr-crisis-badge">CRISIS</span>}
                    </div>
                    <p className="cd-pr-diagnosis">{patient.diagnosis}</p>
                    <div className="cd-pr-tags">
                      <span className={`cd-pr-tag cd-pr-tag-${patient.riskLevel}`}>
                        {patient.riskLevel}
                      </span>
                      {patient.isNonverbal && <span className="cd-pr-tag cd-pr-tag-nonverbal">Nonverbal</span>}
                      <span className="cd-pr-tag cd-pr-tag-comm">{patient.communicationLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="cd-pr-right">
                  <div className="cd-pr-metric">
                    <span className="cd-pr-metric-label">Sessions</span>
                    <span className="cd-pr-metric-val">{patient.sessions.length}</span>
                  </div>
                  <div className="cd-pr-metric">
                    <span className="cd-pr-metric-label">Latest</span>
                    <span className={`cd-pr-metric-val ${latestStress >= 7 ? 'cd-val-high' : latestStress >= 5 ? 'cd-val-mid' : 'cd-val-low'}`}>
                      {latestStress.toFixed(1)}
                    </span>
                  </div>
                  <div className="cd-pr-metric">
                    <span className="cd-pr-metric-label">Average</span>
                    <span className={`cd-pr-metric-val ${avgStress >= 7 ? 'cd-val-high' : avgStress >= 5 ? 'cd-val-mid' : 'cd-val-low'}`}>
                      {avgStress.toFixed(1)}
                    </span>
                  </div>
                  <div className="cd-pr-metric">
                    <span className="cd-pr-metric-label">Trend</span>
                    <span className={`cd-pr-trend cd-trend-${trend}`}>
                      {trend === 'improving' ? '↓' : trend === 'worsening' ? '↑' : '→'}
                      {' '}{trend}
                    </span>
                  </div>

                  {/* Mini sparkline */}
                  <div className="cd-pr-sparkline">
                    <svg viewBox={`0 0 ${patient.sessions.length * 16} 32`} className="cd-sparkline-svg">
                      <polyline
                        fill="none"
                        stroke={latestStress >= 7 ? 'var(--error)' : latestStress >= 5 ? 'var(--warning)' : 'var(--success)'}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        points={patient.sessions.map((s, idx) =>
                          `${idx * 16 + 8},${32 - (s.stressScore / 10) * 28}`
                        ).join(' ')}
                      />
                    </svg>
                  </div>

                  <div className="cd-pr-last-seen">
                    {timeAgo(lastSession.timestamp)}
                  </div>

                  <div className="cd-pr-arrow">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredPatients.length === 0 && (
          <div className="cd-empty-search card">
            <p>No patients match your search.</p>
          </div>
        )}

        <p className="cd-disclaimer">DEMO — Mock data for demonstration purposes only. Not HIPAA compliant.</p>
      </main>
    </div>
  );
}
