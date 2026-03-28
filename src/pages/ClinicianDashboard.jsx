import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_PATIENTS, getOverviewStats, getPatientAnalytics } from '../data/mockPatients';
import { DRAWING_PROMPTS } from '../utils/drawingPrompts';
import './ClinicianDashboard.css';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { id: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'statistics', label: 'Statistics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { id: 'insurance', label: 'Insurance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'integrations', label: 'Integrations', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
];

const SIDEBAR_BOTTOM = [
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'support', label: 'Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
];

function SidebarIcon({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function ClinicianDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patients');
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [search, setSearch] = useState('');

  const stats = useMemo(() => getOverviewStats(), []);

  const filteredPatients = useMemo(() => {
    if (!search) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnosis.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selectedAnalytics = useMemo(() => {
    if (!selectedPatient) return [];
    return getPatientAnalytics(selectedPatient);
  }, [selectedPatient]);

  function getLatestStress(p) {
    return p.sessions[p.sessions.length - 1]?.stressScore ?? 0;
  }

  function handleSidebarClick(id) {
    if (id === 'insurance') navigate('/insurance');
    if (id === 'integrations') navigate('/integrations');
  }

  return (
    <div className="clinic-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sb-logo" onClick={() => navigate('/')}>
          <div className="sb-logo-icon">V</div>
          <span className="sb-logo-text">VoiceCanvas</span>
        </div>

        <nav className="sb-nav">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sb-item ${activeTab === item.id ? 'sb-item-active' : ''}`}
              onClick={() => (item.id === 'insurance' || item.id === 'integrations') ? handleSidebarClick(item.id) : setActiveTab(item.id)}
            >
              <SidebarIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sb-divider" />

        <nav className="sb-nav sb-nav-bottom">
          {SIDEBAR_BOTTOM.map(item => (
            <button key={item.id} className="sb-item" onClick={() => handleSidebarClick(item.id)}>
              <SidebarIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-tabs">
            <button className={`topbar-tab ${activeTab === 'overview' ? 'tt-active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`topbar-tab ${activeTab === 'patients' ? 'tt-active' : ''}`} onClick={() => setActiveTab('patients')}>Patients</button>
            <button className={`topbar-tab ${activeTab === 'statistics' ? 'tt-active' : ''}`} onClick={() => setActiveTab('statistics')}>Analytics</button>
            <button className="topbar-tab topbar-tab-subtle">View All &rarr;</button>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="topbar-notif">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              {stats.crisisFlags > 0 && <span className="notif-dot">{stats.crisisFlags}</span>}
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">Dr</div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">Dr. Sarah Mitchell</span>
                <span className="topbar-user-role">Clinical Psychologist</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div>
              <span className="stat-val">{stats.totalPatients}</span>
              <span className="stat-label">Active Patients</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-rose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
            </div>
            <div>
              <span className="stat-val">{stats.activeAlerts}</span>
              <span className="stat-label">High Risk</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <span className="stat-val">{stats.totalSessions}</span>
              <span className="stat-label">Sessions</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div>
              <span className="stat-val">{stats.avgStress.toFixed(1)}</span>
              <span className="stat-label">Avg Stress</span>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="patients-table-card card">
          <div className="pt-header">
            <h3>Patient Records</h3>
            <span className="pt-count">{filteredPatients.length} patients</span>
          </div>

          <table className="patients-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Diagnosis</th>
                <th>Sessions</th>
                <th>Stress</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const latestStress = getLatestStress(patient);
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <tr
                    key={patient.id}
                    className={`pt-row ${isSelected ? 'pt-row-selected' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td>
                      <div className={`pt-avatar pt-av-${patient.riskLevel}`}>{patient.avatar}</div>
                    </td>
                    <td>
                      <div className="pt-name-cell">
                        <span className="pt-name">{patient.name}</span>
                        <span className="pt-sub">{patient.languageLabel} · {patient.age}y</span>
                      </div>
                    </td>
                    <td>
                      <span className="pt-diagnosis-text">{patient.diagnosis.split(';')[0]}</span>
                    </td>
                    <td>
                      <span className="pt-num">{patient.sessions.length}</span>
                    </td>
                    <td>
                      <span className={`pt-stress ${latestStress >= 7 ? 'pts-high' : latestStress >= 5 ? 'pts-mid' : 'pts-low'}`}>
                        {latestStress.toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`pt-status-badge pt-sb-${patient.riskLevel}`}>
                        {patient.riskLevel}
                      </span>
                    </td>
                    <td>
                      <button className="pt-go-btn" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${patient.id}`); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Stress Chart */}
        <div className="chart-row">
          <div className="chart-card card">
            <div className="chart-header">
              <h3>Patient Stress Trends</h3>
              <div className="chart-legend">
                <span className="cl-dot cl-dot-high" /> High
                <span className="cl-dot cl-dot-mid" /> Moderate
                <span className="cl-dot cl-dot-low" /> Low
              </div>
            </div>
            <div className="chart-body">
              <svg viewBox="0 0 600 180" className="stress-chart-svg">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="40" y1={20 + i * 35} x2="580" y2={20 + i * 35} stroke="var(--gray-100)" strokeWidth="1" />
                ))}
                {/* Y labels */}
                <text x="30" y="24" textAnchor="end" className="chart-label">10</text>
                <text x="30" y="59" textAnchor="end" className="chart-label">7.5</text>
                <text x="30" y="94" textAnchor="end" className="chart-label">5</text>
                <text x="30" y="129" textAnchor="end" className="chart-label">2.5</text>
                <text x="30" y="164" textAnchor="end" className="chart-label">0</text>
                {/* Threshold line */}
                <line x1="40" y1={20 + (3/10)*140} x2="580" y2={20 + (3/10)*140} stroke="var(--rose-400)" strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />
                <text x="585" y={20 + (3/10)*140 + 4} className="chart-label-red">threshold</text>
                {/* Patient lines */}
                {MOCK_PATIENTS.slice(0, 3).map((p, pi) => {
                  const colors = ['var(--green-500)', 'var(--violet-500)', 'var(--rose-400)'];
                  const maxSessions = Math.max(...MOCK_PATIENTS.map(mp => mp.sessions.length));
                  const points = p.sessions.map((s, si) => {
                    const x = 40 + (si / (maxSessions - 1)) * 540;
                    const y = 20 + ((10 - s.stressScore) / 10) * 140;
                    return `${x},${y}`;
                  }).join(' ');
                  return <polyline key={pi} fill="none" stroke={colors[pi]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} opacity="0.85" />;
                })}
              </svg>
              <div className="chart-x-labels">
                {['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7'].map(w => (
                  <span key={w}>{w}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="reports-card card">
            <div className="reports-header">
              <h3>Reports</h3>
              <button className="btn btn-sm btn-ghost">View All</button>
            </div>
            <div className="reports-list">
              {MOCK_PATIENTS.map((p, i) => (
                <div key={p.id} className="report-item" onClick={() => navigate(`/dashboard/${p.id}`)}>
                  <span className="report-num">{i + 1}</span>
                  <span className="report-name">{p.name}</span>
                  <span className="report-size">{p.sessions.length} sessions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Right Panel */}
      <AnimatePresence mode="wait">
        {selectedPatient && (
          <motion.aside
            key={selectedPatient.id}
            className="right-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Risk Banner */}
            <div className={`rp-risk-banner rp-risk-${selectedPatient.riskLevel}`}>
              <p>This Patient is Diagnosed With</p>
              <h3>{selectedPatient.diagnosis.split(';')[0].split(' ').slice(1).join(' ')}</h3>
              <p>Risk Level: <strong>{selectedPatient.riskLevel.toUpperCase()}</strong></p>
            </div>

            {/* Patient Info */}
            <div className="rp-patient-card">
              <div className={`rp-avatar rp-av-${selectedPatient.riskLevel}`}>{selectedPatient.avatar}</div>
              <div className="rp-patient-info">
                <h3>{selectedPatient.name}</h3>
                <p>{selectedPatient.languageLabel} · {selectedPatient.age} years old</p>
                <p className="rp-comm">{selectedPatient.communicationLevel}</p>
              </div>
            </div>

            {/* Latest Diagnosis */}
            <div className="rp-diagnosis">
              <h4>Latest Session</h4>
              <div className="rp-diag-card">
                <p className="rp-diag-label">
                  {DRAWING_PROMPTS.find(pr => pr.id === selectedPatient.sessions[selectedPatient.sessions.length - 1].promptId)?.title || 'Drawing'}
                </p>
                <p className="rp-diag-score">
                  Stress: <strong>{selectedPatient.sessions[selectedPatient.sessions.length - 1].stressScore.toFixed(1)}</strong>/10
                </p>
                <p className="rp-diag-statement">
                  "{selectedPatient.sessions[selectedPatient.sessions.length - 1].result.personal_statement_en}"
                </p>
                <button className="btn btn-sm btn-primary rp-detail-btn" onClick={() => navigate(`/dashboard/${selectedPatient.id}`)}>
                  Patient Details
                </button>
              </div>
            </div>

            {/* Session History Mini */}
            <div className="rp-sessions">
              <h4>All Sessions</h4>
              {selectedPatient.sessions.slice().reverse().slice(0, 4).map(s => {
                const prompt = DRAWING_PROMPTS.find(pr => pr.id === s.promptId);
                return (
                  <div key={s.id} className="rp-session-row">
                    <div className="rp-sr-dot" style={{ background: prompt?.color || '#ccc' }} />
                    <div className="rp-sr-info">
                      <span className="rp-sr-title">{prompt?.title || 'Drawing'}</span>
                      <span className="rp-sr-date">{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <span className={`rp-sr-score ${s.stressScore >= 7 ? 'rps-high' : s.stressScore >= 5 ? 'rps-mid' : 'rps-low'}`}>
                      {s.stressScore.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="rp-actions">
              <button className="btn btn-sm btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/dashboard/${selectedPatient.id}`)}>
                View Full Profile
              </button>
              <button className="btn btn-sm btn-outline" style={{ width: '100%' }} onClick={() => navigate('/insurance', { state: { patientId: selectedPatient.id, result: selectedAnalytics[selectedAnalytics.length - 1] } })}>
                Submit Insurance
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
