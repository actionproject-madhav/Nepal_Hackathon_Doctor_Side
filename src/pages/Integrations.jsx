import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProviders, getConnectedIds, setConnectedIds } from '../data/insuranceProviders';
import { MOCK_PATIENTS } from '../data/mockPatients';
import './Integrations.css';

const FILTER_TABS = ['All insurers', 'In-network', 'Out-of-network', 'Behavioral Health', 'Federal'];

export default function Integrations() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All insurers');
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState(() => getAllProviders());
  const [expandedId, setExpandedId] = useState(null);

  const filtered = providers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'In-network') return matchSearch && p.connected;
    if (activeFilter === 'Out-of-network') return matchSearch && !p.connected;
    if (activeFilter === 'Behavioral Health') return matchSearch && p.categories.includes('Behavioral Health');
    if (activeFilter === 'Federal') return matchSearch && (p.categories.includes('Federal') || p.categories.includes('Medicare') || p.categories.includes('Medicaid') || p.categories.includes('Military'));
    return matchSearch;
  });

  const toggleConnection = (id) => {
    setProviders(prev => {
      const updated = prev.map(p =>
        p.id === id ? { ...p, connected: !p.connected } : p
      );
      setConnectedIds(updated.filter(p => p.connected).map(p => p.id));
      return updated;
    });
  };

  const connectedCount = providers.filter(p => p.connected).length;

  const patientsPerInsurer = useMemo(() => {
    const map = {};
    MOCK_PATIENTS.forEach(pt => {
      providers.forEach(pr => {
        if (pt.insuranceProvider.toLowerCase().includes(pr.name.toLowerCase()) ||
            pt.insuranceProvider.toLowerCase().includes(pr.id)) {
          map[pr.id] = (map[pr.id] || 0) + 1;
        }
      });
    });
    return map;
  }, [providers]);

  return (
    <div className="intg-page">
      <header className="intg-header">
        <div className="container">
          <div className="intg-header-inner">
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              Dashboard
            </button>
            <span className="intg-brand">VoiceCanvas Clinic</span>
            <div style={{ width: 80 }} />
          </div>
        </div>
      </header>

      <main className="container intg-main">
        <div className="intg-title-row">
          <div>
            <h1>Practice Network</h1>
            <p>Manage which insurance providers your practice is credentialed with. In-network insurers will be auto-matched when filing claims for patients.</p>
          </div>
          <div className="intg-connected-count">
            <span className="intg-cc-num">{connectedCount}</span>
            <span className="intg-cc-label">In-network</span>
          </div>
        </div>

        <div className="intg-info-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <span>Toggle insurers your practice accepts. When you file a claim for a patient, we auto-detect their insurer and check if you're in-network. Out-of-network claims are flagged with a warning.</span>
        </div>

        <div className="intg-toolbar">
          <div className="intg-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                className={`intg-tab ${activeFilter === tab ? 'intg-tab-active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="intg-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search insurers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="intg-grid">
          {filtered.map((provider, i) => (
            <motion.div
              key={provider.id}
              className={`intg-card ${provider.connected ? 'intg-card-connected' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="intg-card-top">
                <div className="intg-card-icon" style={{ background: provider.color }}>
                  {provider.letter}
                </div>
                <div className="intg-card-info">
                  <div className="intg-card-name-row">
                    <h3>{provider.name}</h3>
                    {provider.connected && <span className="intg-in-badge">In-network</span>}
                  </div>
                  <a className="intg-card-url" href={`https://${provider.url}`} target="_blank" rel="noopener noreferrer">
                    {provider.url}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                  </a>
                </div>
              </div>

              <p className="intg-card-desc">{provider.desc}</p>

              <div className="intg-card-tags">
                {provider.categories.map(cat => (
                  <span key={cat} className="intg-tag">{cat}</span>
                ))}
              </div>

              {patientsPerInsurer[provider.id] > 0 && (
                <div className="intg-patient-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {patientsPerInsurer[provider.id]} patient{patientsPerInsurer[provider.id] > 1 ? 's' : ''} with this insurer
                </div>
              )}

              <div className="intg-card-bottom">
                <button className="intg-view-btn" onClick={() => setExpandedId(expandedId === provider.id ? null : provider.id)}>
                  {expandedId === provider.id ? 'Hide details' : 'View policies'}
                </button>
                <label className="intg-toggle">
                  <input
                    type="checkbox"
                    checked={provider.connected}
                    onChange={() => toggleConnection(provider.id)}
                  />
                  <span className="intg-toggle-track">
                    <span className="intg-toggle-thumb" />
                  </span>
                </label>
              </div>

              {expandedId === provider.id && (
                <motion.div
                  className="intg-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="intg-detail-grid">
                    <div className="intg-detail-item">
                      <span className="intg-di-label">MH Denial Rate</span>
                      <span className={`intg-di-val ${parseInt(provider.policies.denialRate) >= 20 ? 'intg-di-red' : parseInt(provider.policies.denialRate) >= 15 ? 'intg-di-amber' : 'intg-di-green'}`}>
                        {provider.policies.denialRate}
                      </span>
                    </div>
                    <div className="intg-detail-item">
                      <span className="intg-di-label">Avg Processing</span>
                      <span className="intg-di-val">{provider.policies.avgProcessing}</span>
                    </div>
                    <div className="intg-detail-item">
                      <span className="intg-di-label">Prior Auth Required</span>
                      <span className={`intg-di-val ${provider.policies.priorAuthRequired ? 'intg-di-amber' : 'intg-di-green'}`}>
                        {provider.policies.priorAuthRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="intg-detail-item">
                      <span className="intg-di-label">Parity Compliant</span>
                      <span className={`intg-di-val ${provider.policies.parityCompliant === 'Yes' ? 'intg-di-green' : provider.policies.parityCompliant === 'Partial' || provider.policies.parityCompliant === 'Under review' ? 'intg-di-amber' : ''}`}>
                        {provider.policies.parityCompliant}
                      </span>
                    </div>
                    <div className="intg-detail-item">
                      <span className="intg-di-label">Claim Form</span>
                      <span className="intg-di-val">{provider.policies.formType}</span>
                    </div>
                    <div className="intg-detail-item">
                      <span className="intg-di-label">Appeal Window</span>
                      <span className="intg-di-val">{provider.policies.appealWindow}</span>
                    </div>
                  </div>
                  <div className="intg-cpt-row">
                    <span className="intg-di-label">Accepted CPT Codes</span>
                    <div className="intg-cpt-tags">
                      {provider.policies.cptCodes.map(code => (
                        <span key={code} className="intg-cpt-tag">{code}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="intg-empty">
            <p>No insurance providers match your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
