import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Integrations.css';

const INSURANCE_PROVIDERS = [
  {
    id: 'aetna',
    name: 'Aetna',
    url: 'aetna.com',
    color: '#7B2D8E',
    letter: 'A',
    desc: 'One of the largest US health insurers. Supports electronic claims via EDI 837, prior authorization, and eligibility verification.',
    categories: ['Medical', 'Behavioral Health', 'Pharmacy'],
    connected: true,
    policies: { denialRate: '18%', avgProcessing: '14 days', priorAuthRequired: true, parityCompliant: 'Partial' },
  },
  {
    id: 'united',
    name: 'UnitedHealthcare',
    url: 'uhc.com',
    color: '#002677',
    letter: 'U',
    desc: 'Largest US health insurer by membership. Real-time eligibility checks, claims status API, and provider credentialing.',
    categories: ['Medical', 'Behavioral Health', 'Vision'],
    connected: true,
    policies: { denialRate: '22%', avgProcessing: '18 days', priorAuthRequired: true, parityCompliant: 'Under review' },
  },
  {
    id: 'cigna',
    name: 'Cigna',
    url: 'cigna.com',
    color: '#E97100',
    letter: 'C',
    desc: 'Global health service company. Supports EAP integration, telehealth claims, and behavioral health carve-out programs.',
    categories: ['Medical', 'Behavioral Health', 'EAP'],
    connected: false,
    policies: { denialRate: '20%', avgProcessing: '16 days', priorAuthRequired: true, parityCompliant: 'Yes' },
  },
  {
    id: 'anthem',
    name: 'Anthem BCBS',
    url: 'anthem.com',
    color: '#003DA6',
    letter: 'B',
    desc: 'Blue Cross Blue Shield affiliate. Largest BCBS licensee. Accepts art therapy under behavioral health with proper CPT coding.',
    categories: ['Medical', 'Behavioral Health'],
    connected: true,
    policies: { denialRate: '16%', avgProcessing: '12 days', priorAuthRequired: false, parityCompliant: 'Yes' },
  },
  {
    id: 'humana',
    name: 'Humana',
    url: 'humana.com',
    color: '#4DB848',
    letter: 'H',
    desc: 'Focused on Medicare Advantage and military healthcare. Strong behavioral health coverage for veterans and seniors.',
    categories: ['Medicare', 'Behavioral Health', 'Military'],
    connected: false,
    policies: { denialRate: '14%', avgProcessing: '10 days', priorAuthRequired: false, parityCompliant: 'Yes' },
  },
  {
    id: 'kaiser',
    name: 'Kaiser Permanente',
    url: 'kaiserpermanente.org',
    color: '#004B87',
    letter: 'K',
    desc: 'Integrated managed care. In-network behavioral health services with direct referral pathways and embedded care teams.',
    categories: ['Medical', 'Behavioral Health', 'Integrated'],
    connected: false,
    policies: { denialRate: '10%', avgProcessing: '8 days', priorAuthRequired: false, parityCompliant: 'Yes' },
  },
  {
    id: 'medicare',
    name: 'Medicare / CMS',
    url: 'cms.gov',
    color: '#112E51',
    letter: 'M',
    desc: 'Federal health insurance for 65+. Covers art therapy under Part B with licensed provider. Standardized claim forms (CMS-1500).',
    categories: ['Federal', 'Part B', 'Behavioral Health'],
    connected: true,
    policies: { denialRate: '12%', avgProcessing: '30 days', priorAuthRequired: false, parityCompliant: 'N/A (Federal)' },
  },
  {
    id: 'molina',
    name: 'Molina Healthcare',
    url: 'molinahealthcare.com',
    color: '#00A651',
    letter: 'M',
    desc: 'Medicaid managed care specialist. Serves low-income populations across 19 states. Strong parity enforcement.',
    categories: ['Medicaid', 'Behavioral Health', 'CHIP'],
    connected: false,
    policies: { denialRate: '15%', avgProcessing: '20 days', priorAuthRequired: true, parityCompliant: 'Yes' },
  },
  {
    id: 'tricare',
    name: 'TRICARE',
    url: 'tricare.mil',
    color: '#003F72',
    letter: 'T',
    desc: 'Military health system for active duty, retirees, and dependents. Covers art therapy and alternative treatments for PTSD.',
    categories: ['Military', 'Behavioral Health', 'PTSD'],
    connected: false,
    policies: { denialRate: '8%', avgProcessing: '14 days', priorAuthRequired: false, parityCompliant: 'Yes' },
  },
];

const FILTER_TABS = ['All integrations', 'Connected', 'Available', 'Behavioral Health', 'Federal'];

export default function Integrations() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All integrations');
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState(INSURANCE_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const filtered = providers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'Connected') return matchSearch && p.connected;
    if (activeFilter === 'Available') return matchSearch && !p.connected;
    if (activeFilter === 'Behavioral Health') return matchSearch && p.categories.includes('Behavioral Health');
    if (activeFilter === 'Federal') return matchSearch && (p.categories.includes('Federal') || p.categories.includes('Medicare') || p.categories.includes('Medicaid') || p.categories.includes('Military'));
    return matchSearch;
  });

  const toggleConnection = (id) => {
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p, connected: !p.connected } : p
    ));
  };

  const connectedCount = providers.filter(p => p.connected).length;

  return (
    <div className="intg-page">
      {/* Header */}
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
            <h1>Integrations and connected insurers</h1>
            <p>Connect insurance providers to auto-fill claim forms with their specific policies, CPT codes, and submission requirements.</p>
          </div>
          <div className="intg-connected-count">
            <span className="intg-cc-num">{connectedCount}</span>
            <span className="intg-cc-label">Connected</span>
          </div>
        </div>

        {/* Filter Tabs + Search */}
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
            <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Provider Grid */}
        <div className="intg-grid">
          {filtered.map((provider, i) => (
            <motion.div
              key={provider.id}
              className="intg-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="intg-card-top">
                <div className="intg-card-icon" style={{ background: provider.color }}>
                  {provider.letter}
                </div>
                <div className="intg-card-info">
                  <h3>{provider.name}</h3>
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

              <div className="intg-card-bottom">
                <button className="intg-view-btn" onClick={() => setSelectedProvider(selectedProvider?.id === provider.id ? null : provider)}>
                  {selectedProvider?.id === provider.id ? 'Hide details' : 'View policies'}
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

              {selectedProvider?.id === provider.id && (
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
                  </div>
                  {provider.connected && (
                    <button className="intg-file-claim" onClick={() => navigate('/insurance', { state: { insurerOverride: provider } })}>
                      File a claim with {provider.name}
                    </button>
                  )}
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
