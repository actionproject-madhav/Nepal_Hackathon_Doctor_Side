import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_PATIENTS, getOverviewStats } from '../data/mockPatients';
import { DRAWING_PROMPTS } from '../utils/drawingPrompts';
import { getAllProviders, setConnectedIds } from '../data/insuranceProviders';
import './ClinicianDashboard.css';

const SIDEBAR_MAIN = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { id: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

const SIDEBAR_BOTTOM = [
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'network', label: 'Network', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { id: 'reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'help', label: 'Help', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

function SvgIcon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function ClinicianDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0]);
  const [queueFilter, setQueueFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [profileTab, setProfileTab] = useState('profile');

  // Network Integration State
  const [netFilter, setNetFilter] = useState('All');
  const [netSearch, setNetSearch] = useState('');
  const [providers, setProviders] = useState(() => getAllProviders());

  const toggleConnection = (id) => {
    setProviders(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, connected: !p.connected } : p
      );
      setConnectedIds(updated.filter(p => p.connected).map(p => p.id));
      return updated;
    });
  };

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      const ms = p.name.toLowerCase().includes(netSearch.toLowerCase()) || p.desc.toLowerCase().includes(netSearch.toLowerCase());
      if (netFilter === 'In-network') return ms && p.connected;
      if (netFilter === 'Out-of-network') return ms && !p.connected;
      return ms;
    });
  }, [providers, netSearch, netFilter]);

  const patientsPerInsurer = useMemo(() => {
    const map = {};
    MOCK_PATIENTS.forEach(pt => {
      providers.forEach(pr => {
        if (pt.insuranceProvider && (pt.insuranceProvider.toLowerCase().includes(pr.name.toLowerCase()) || pt.insuranceProvider.toLowerCase().includes(pr.id))) {
          map[pr.id] = (map[pr.id] || 0) + 1;
        }
      });
    });
    return map;
  }, [providers]);

  const stats = useMemo(() => getOverviewStats(), []);

  const filteredPatients = useMemo(() => {
    let list = MOCK_PATIENTS;
    if (search) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (queueFilter === 'High Risk') list = list.filter(p => p.riskLevel === 'high');
    if (queueFilter === 'New') list = list.filter(p => p.sessions.length <= 4);
    return list;
  }, [search, queueFilter]);

  const patient = selectedPatient;
  const sessions = patient?.sessions || [];
  const latestSession = sessions[sessions.length - 1];
  const avgStress = sessions.length > 0
    ? sessions.reduce((a, b) => a + b.stressScore, 0) / sessions.length
    : 0;

  const stressTrend = sessions.map((s, i) => ({
    index: i,
    score: s.stressScore,
    day: new Date(s.timestamp).toLocaleDateString(undefined, { weekday: 'short' }),
  })).slice(-7);

  function handleNavClick(id) {
    if (id === 'reports') { navigate('/insurance'); return; }
    setActiveNav(id);
  }

  return (
    <div className="med-layout">
      {/* ===== Sidebar ===== */}
      <aside className="med-sidebar">
        <div className="med-sb-logo" onClick={() => navigate('/')}>
          <div className="med-sb-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="med-sb-logo-text">Nexus</span>
        </div>

        <nav className="med-sb-nav">
          {SIDEBAR_MAIN.map(item => (
            <button
              key={item.id}
              className={`med-sb-item ${activeNav === item.id ? 'med-sb-active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <SvgIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="med-sb-spacer" />

        <nav className="med-sb-nav">
          {SIDEBAR_BOTTOM.map(item => (
            <button key={item.id} className={`med-sb-item ${activeNav === item.id ? 'med-sb-active' : ''}`} onClick={() => handleNavClick(item.id)}>
              <SvgIcon d={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Doctor Profile Footer */}
        <div className="med-sb-doctor">
          <img className="med-sb-dr-avatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4" alt="Doctor" />
          <span className="med-sb-dr-name">Dr. Sarah Mitchell</span>
          <span className="med-sb-dr-role">Lead Clinician</span>
          <div className="med-sb-dr-actions">
            <button><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>
            <button><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></button>
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="med-main">
        {/* Top Bar */}
        <header className="med-topbar">
          <div className="med-search-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search patients, invoice, appointments etc..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          <div className="med-topbar-right">
            <button className="med-topbar-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              {stats.crisisFlags > 0 && <span className="med-notif-dot" />}
            </button>
            <button className="med-topbar-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><path d="M3 8h18M3 16h18"/></svg>
            </button>
          </div>
        </header>

        {/* Top Metrics Row - As per requirements.md */}
        <div className="med-top-metrics">
          <div className="med-metric-card">
            <div className="mmc-info" style={{ alignItems: 'flex-start' }}>
              <span className="mmc-val">{stats.totalPatients}</span>
              <span className="mmc-label">Active Patients</span>
            </div>
          </div>
          <div className="med-metric-card">
            <div className="mmc-info" style={{ alignItems: 'flex-start' }}>
              <span className="mmc-val">{stats.totalSessions}</span>
              <span className="mmc-label">Total Sessions</span>
            </div>
          </div>
          <div className="med-metric-card">
            <div className="mmc-info" style={{ alignItems: 'flex-start' }}>
              <span className="mmc-val" style={{ color: stats.pendingInsurance > 0 ? 'var(--rose-500)' : 'inherit' }}>{stats.pendingInsurance}</span>
              <span className="mmc-label">Pending Insurance</span>
            </div>
          </div>
          <div className="med-metric-card">
            <div className="mmc-info" style={{ alignItems: 'flex-start' }}>
              <span className="mmc-val" style={{ color: 'var(--emerald-600)' }}>$35,400</span>
              <span className="mmc-label">Recovered (YTD)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Grid Content */}
        <div 
          className="med-content" 
          style={{ 
            display: activeNav === 'dashboard' ? 'grid' : 'flex', 
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          
          {activeNav === 'dashboard' && (
            <div style={{ display: 'contents', gap: '20px', flexWrap: 'wrap' }}>
              {/* 1. Overall Performance (Stress Score) */}
              <div className="mc-widget mc-overall">
                <div className="mc-widget-title">
                  Overall Performance
                  <button className="mc-widget-link">
                    ↗ {((stats.totalSessions / 100) * 100).toFixed(0)}%
                  </button>
                </div>
                
                <div className="mc-gauge-container" style={{ margin: '10px 0 20px' }}>
                  <div className="mc-gauge-bg" />
                  <div 
                    className="mc-gauge-fill" 
                    style={{ transform: `rotate(${-90 + ((avgStress / 10) * 180)}deg)` }}
                  />
                  <div className="mc-gauge-inner">
                    <span className="mc-gauge-score">{avgStress.toFixed(1)}</span>
                    <span className="mc-gauge-label" style={{ background: avgStress >= 7 ? 'var(--rose-500)' : avgStress >= 5 ? 'var(--amber-500)' : 'var(--emerald-500)' }}>
                      {avgStress >= 7 ? 'Critical' : avgStress >= 5 ? 'Elevated' : 'Good'}
                    </span>
                  </div>
                </div>
                
                <p className="mc-overall-text">
                  <strong>{patient.name.split(' ')[0]}</strong> has an average stress score of {avgStress.toFixed(1)}/10 across {sessions.length} sessions.
                </p>
                
                <button className="btn btn-primary" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                  Check Full Report
                </button>
              </div>

              {/* 2. Analytics */}
              <div className="mc-widget mc-analytics">
                <div className="mc-widget-title">
                  Analytics
                  <select className="btn btn-outline btn-sm" style={{ border: 'none', background: 'var(--gray-50)', fontSize: '0.8rem' }}>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', marginBottom: 'auto' }}>
                  <button className="badge" style={{ background: 'var(--gray-900)', color: 'white' }}>Stress Score</button>
                  <button className="badge badge-blue">Indicators</button>
                  <button className="badge badge-purple">Risk Level</button>
                </div>

                <div className="mc-chart-wrapper">
                  <div className="mc-chart-line" />
                  {stressTrend.map((pt, i) => {
                    const heightPct = (pt.score / 10) * 85; 
                    const isMax = pt.score === Math.max(...stressTrend.map(p => p.score));
                    return (
                      <div key={i} className="mc-chart-col">
                        <div 
                          className={`mc-chart-bar ${isMax ? 'active' : ''}`}
                          style={{ height: `${Math.max(10, heightPct)}%` }}
                        >
                          <div className="mc-chart-bubble">{pt.score.toFixed(1)}</div>
                        </div>
                        <span className="mc-chart-label">{pt.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(activeNav === 'dashboard' || activeNav === 'patients') && (
            <div style={{ display: activeNav === 'dashboard' ? 'contents' : 'flex', gap: '20px', flexWrap: 'wrap', flexDirection: activeNav === 'patients' ? 'row-reverse' : 'row' }}>
              {/* 3. Patient Profile */}
              <div className="mc-widget mc-profile" style={{ flex: activeNav === 'patients' ? '1' : 'unset' }}>
                <div className="mc-profile-tabs">
                  <button className={`mc-ptab ${profileTab === 'profile' ? 'active' : ''}`} onClick={() => setProfileTab('profile')}>Profile</button>
                  <button className={`mc-ptab ${profileTab === 'history' ? 'active' : ''}`} onClick={() => setProfileTab('history')}>History</button>
                  <button className="mc-ptab">3+</button>
                </div>

                <div className="mc-profile-card-inner">
                  <div className={`mc-pc-avatar mc-pc-avatar-${patient.riskLevel}`}>
                    {patient.avatar}
                  </div>
                  <h3 className="mc-pc-name">{patient.name}</h3>
                  <p className="mc-pc-desc">{patient.age}yrs old • {patient.languageLabel}</p>
                  
                  <button className="mc-pc-action" onClick={() => navigate(`/dashboard/${patient.id}`)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  </button>
                </div>

                <div className="mc-pc-info-list" style={{ marginTop: activeNav === 'patients' ? '24px' : '16px' }}>
                  <div className="mc-pc-info-row">
                    <span>Diagnosis</span>
                    <span>{patient.diagnosis.split(';')[0]}</span>
                  </div>
                  <div className="mc-pc-info-divider" />
                  <div className="mc-pc-info-row">
                    <span>Communication</span>
                    <span>{patient.communicationLevel}</span>
                  </div>
                  <div className="mc-pc-info-divider" />
                  <div className="mc-pc-info-row">
                    <span>Last Appointment</span>
                    <span>{latestSession ? new Date(latestSession.timestamp).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Details / Queue Table */}
              <div className="mc-widget mc-queue" style={{ flex: activeNav === 'patients' ? '2.5' : 'unset' }}>
                <div className="mc-queue-filters">
                  {['All', 'High Risk', 'New'].map(tab => (
                    <button 
                      key={tab} 
                      className={`mc-qf ${queueFilter === tab ? 'active' : ''}`} 
                      onClick={() => setQueueFilter(tab)}
                    >
                      {tab === 'All' ? 'Patient Queue' : tab}
                    </button>
                  ))}
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-outline btn-sm" style={{ border: 'none', background: 'var(--gray-50)', fontSize: '0.8rem' }}>
                    Recent ˅
                  </button>
                </div>

                <div className="mc-table-container">
                  <table className="mc-table">
                    <thead>
                      <tr>
                        <th>Patient Name</th>
                        <th>Primary Diagnosis</th>
                        <th>Latest Date</th>
                        <th>Stress Level</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(p => {
                        const isActive = p.id === patient.id;
                        const pLatest = p.sessions[p.sessions.length - 1];
                        const riskClass = p.riskLevel === 'high' ? 'high' : p.riskLevel === 'moderate' ? 'mod' : 'low';
                        const score = pLatest ? pLatest.stressScore.toFixed(1) : '-';
                        
                        return (
                          <tr key={p.id} className={isActive ? 'selected' : ''} onClick={() => setSelectedPatient(p)}>
                            <td>
                              <div className="mc-td-name">{p.name}</div>
                              <div className="mc-td-sub">{p.sessions.length} sessions</div>
                            </td>
                            <td>
                              <div className="mc-td-name" style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.diagnosis.split(';')[0]}
                              </div>
                            </td>
                            <td>
                              <div className="mc-td-name">{pLatest ? new Date(pLatest.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}</div>
                            </td>
                            <td>
                              <span className={`mc-td-badge ${riskClass}`}>
                                Score: {score}
                              </span>
                            </td>
                            <td>
                              <span className={`mc-td-badge`} style={{ background: p.riskLevel === 'high' ? 'var(--rose-100)' : 'var(--gray-100)', color: p.riskLevel === 'high' ? 'var(--rose-700)' : 'var(--gray-700)' }}>
                                {p.riskLevel.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/${p.id}`); }}>
                                View ↗
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Network Module */}
          {activeNav === 'network' && (
            <div className="mc-net-container">
              <div className="mc-net-header">
                <div>
                  <h2 className="mc-net-title">Practice Network</h2>
                  <p className="mc-net-subtitle">Manage your credentialed insurance providers and viewing policies.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--emerald-600)' }}>
                    {providers.filter(p => p.connected).length}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>In-network</div>
                </div>
              </div>

              <div className="mc-net-filters">
                <div className="mc-net-tabs">
                  {['All', 'In-network', 'Out-of-network'].map(t => (
                    <button 
                      key={t}
                      className={`mc-net-tab ${netFilter === t ? 'active' : ''}`}
                      onClick={() => setNetFilter(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="med-search-pill" style={{ margin: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input type="text" placeholder="Search providers..." value={netSearch} onChange={e => setNetSearch(e.target.value)} />
                </div>
              </div>

              <div className="mc-net-grid">
                {filteredProviders.map(provider => (
                  <div key={provider.id} className={`mc-net-card ${provider.connected ? 'connected' : ''}`}>
                    <div className="mc-net-card-top">
                      <div className="mc-net-icon" style={provider.connected ? { background: `linear-gradient(135deg, var(--emerald-500), var(--emerald-400))` } : {}}>
                        {provider.letter}
                      </div>
                      <div className="mc-net-info">
                        <h3>{provider.name}</h3>
                        <span className={`mc-net-status ${provider.connected ? 'connected' : 'disconnected'}`}>
                          {provider.connected ? 'In-network' : 'Out-of-network'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="mc-net-desc">{provider.desc}</p>
                    
                    <div className="mc-net-cats">
                      {provider.categories.slice(0, 3).map(cat => (
                        <span key={cat} className="mc-net-cat">{cat}</span>
                      ))}
                    </div>

                    <div className="mc-net-footer">
                      <div className="mc-net-stats">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        {patientsPerInsurer[provider.id] || 0} Patients
                      </div>
                      
                      <label className="mc-net-toggle">
                        <input type="checkbox" checked={provider.connected} onChange={() => toggleConnection(provider.id)} />
                        <span className="mc-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coming Soon Placeholders */}
          {['settings', 'help'].includes(activeNav) && (
            <div className="mc-widget" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)', background: 'linear-gradient(to bottom right, #fff, #f8fafc)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--purple-50)', color: 'var(--purple-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} Dashboard
              </h3>
              <p style={{ fontWeight: '500' }}>This module is currently under active development.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
