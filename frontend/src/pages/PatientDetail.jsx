import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientById, getPatientAnalytics } from '../data/mockPatients';
import { DRAWING_PROMPTS } from '../utils/drawingPrompts';
import { generateFHIRObservation, downloadFHIRJSON } from '../utils/fhirExport';
import { exportClinicalNotePDF } from '../utils/pdfExport';
import { speakText, stopSpeech, generateClinicalSummary } from '../utils/ttsService';
import { getReplayForPatient, getEmotionColor } from '../data/mockReplay';
import './PatientDetail.css';

export default function PatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const patient = getPatientById(patientId);
  const [expandedSession, setExpandedSession] = useState(null);
  const [showFHIR, setShowFHIR] = useState(false);
  const [generatedFHIR, setGeneratedFHIR] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSessionId, setPlayingSessionId] = useState(null);

  const analytics = useMemo(() => {
    if (!patient) return [];
    return getPatientAnalytics(patient);
  }, [patient]);

  const sessionReplay = useMemo(() => (patient ? getReplayForPatient(patient) : null), [patient]);

  const riskShort = patient
    ? (patient.riskLevel === 'high' ? 'HIGH' : patient.riskLevel === 'moderate' ? 'MED' : 'LOW')
    : '';

  if (!patient) {
    return (
      <div className="pd-not-found">
        <h2>Patient not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const sessions = patient.sessions;
  const avgStress = sessions.reduce((a, b) => a + b.stressScore, 0) / sessions.length;
  const latestSession = sessions[sessions.length - 1];
  const hasCrisis = sessions.some(s => s.result.crisis_flag);
  const caregiverNotes = sessions.filter(s => s.caregiverNote);
  const latestAnalysis = analytics[analytics.length - 1];

  const stressTrend = sessions.map((s, i) => ({
    index: i,
    score: s.stressScore,
    date: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    promptId: s.promptId,
  }));

  const topFlags = useMemo(() => {
    const counts = {};
    sessions.forEach(s => {
      const ind = s.result.indicators;
      if ((ind.isolation || 0) >= 3) counts['Isolation'] = (counts['Isolation'] || 0) + 1;
      if ((ind.red_pct || 0) >= 40) counts['High Red'] = (counts['High Red'] || 0) + 1;
      if (ind.somatic) counts['Somatic'] = (counts['Somatic'] || 0) + 1;
      if (ind.line_pressure === 'heavy') counts['Heavy Pressure'] = (counts['Heavy Pressure'] || 0) + 1;
      if (s.result.crisis_flag) counts['Crisis'] = (counts['Crisis'] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sessions]);

  const maxScore = 10;

  const handleGenerateEHR = () => {
    if (!latestAnalysis) return;
    const fhir = generateFHIRObservation(latestAnalysis, [], { name: patient.name, id: patient.id });
    setGeneratedFHIR(fhir);
    setShowFHIR(true);
  };

  const handlePlayClinicalSummary = async (session) => {
    if (isPlaying && playingSessionId === session.id) {
      // Stop if already playing this session
      stopSpeech();
      setIsPlaying(false);
      setPlayingSessionId(null);
      return;
    }

    // Stop any current playback
    stopSpeech();
    setIsPlaying(true);
    setPlayingSessionId(session.id);

    try {
      const summary = generateClinicalSummary(session);
      const result = await speakText(summary, { preferElevenLabs: true });

      if (!result.success) {
        console.error('TTS failed:', result.error);
      }
    } catch (error) {
      console.error('Error playing clinical summary:', error);
    } finally {
      setIsPlaying(false);
      setPlayingSessionId(null);
    }
  };

  return (
    <div className="patient-detail">
      <header className="pd-header">
        <div className="container">
          <div className="pd-header-inner">
            <button className="btn btn-sm btn-ghost" onClick={() => navigate('/dashboard')}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ marginRight: 4 }}>
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              All Patients
            </button>
            <span className="pd-brand">VoiceCanvas Clinic</span>
            <div className="pd-header-actions">
              <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate(`/replay/${patient.id}`)}>
                Session Replay
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/insurance', { state: { patientId: patient.id, result: latestAnalysis } })}>
                File Claim
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container pd-main">
        {/* Patient Header */}
        <motion.div className="pd-patient-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pd-pc-left">
            <div className={`pd-avatar pd-avatar-${patient.riskLevel}`}>{patient.avatar}</div>
            <div className="pd-pc-info">
              <div className="pd-name-row">
                <h1>{patient.name}</h1>
                {hasCrisis && <span className="pd-crisis-badge">CRISIS HISTORY</span>}
              </div>
              <p className="pd-diagnosis">{patient.diagnosis}</p>
              <div className="pd-meta-tags">
                <span className="pd-meta-tag">{patient.age} years old</span>
                <span className="pd-meta-tag">{patient.languageLabel}</span>
                <span className="pd-meta-tag">{patient.communicationLevel}</span>
                <span className="pd-meta-tag">{patient.insuranceProvider}</span>
                {patient.isNonverbal && <span className="pd-meta-tag pd-tag-parity">Parity Protected</span>}
              </div>
            </div>
          </div>
          <div className="pd-pc-stats">
            <div className="pd-stat">
              <span className="pd-stat-val">{sessions.length}</span>
              <span className="pd-stat-label">Sessions</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val" style={{ color: avgStress >= 7 ? 'var(--error)' : avgStress >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                {avgStress.toFixed(1)}
              </span>
              <span className="pd-stat-label">Avg Stress</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val" style={{ color: latestSession.stressScore >= 7 ? 'var(--error)' : latestSession.stressScore >= 5 ? 'var(--warning)' : 'var(--success)' }}>
                {latestSession.stressScore.toFixed(1)}
              </span>
              <span className="pd-stat-label">Latest</span>
            </div>
            <div className="pd-stat">
              <span className="pd-stat-val">{sessions.filter(s => s.stressScore >= 7).length}</span>
              <span className="pd-stat-label">Alerts</span>
            </div>
          </div>
        </motion.div>

        {/* Session Replay Banner */}
        <motion.div className="pd-replay-banner card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="pd-rb-left">
            <div className="pd-rb-info">
              <h3>Session Replay with Emotional Analysis</h3>
              <p>
                Latest on file: <strong>Session #{sessionReplay?.sessionId}</strong> ({sessionReplay?.promptTitle}) — {sessionReplay?.sessionDate
                  ? new Date(sessionReplay.sessionDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : ''}. Review webcam-derived data with AI emotion timeline; included with insurance submissions.
              </p>
            </div>
          </div>
          <div className="pd-rb-stats">
            <div className="pd-rb-stat">
              <span className="pd-rb-stat-val">{sessionReplay?.emotionTimeline?.length ?? 0}</span>
              <span className="pd-rb-stat-label">Emotion Events</span>
            </div>
            <div className="pd-rb-stat">
              <span className="pd-rb-stat-val">{sessionReplay?.overallAnalysis?.stressIndicators?.length ?? 0}</span>
              <span className="pd-rb-stat-label">Stress Markers</span>
            </div>
            <div className="pd-rb-stat">
              <span className="pd-rb-stat-val" style={{ color: sessionReplay?.overallAnalysis?.positiveShift ? 'var(--success)' : 'var(--error)' }}>
                {sessionReplay?.overallAnalysis
                  ? `${sessionReplay.overallAnalysis.positiveShift ? '+' : ''}${(sessionReplay.overallAnalysis.endValence - sessionReplay.overallAnalysis.startValence).toFixed(2)}`
                  : '—'}
              </span>
              <span className="pd-rb-stat-label">Valence Shift</span>
            </div>
            <button type="button" className="btn btn-primary pd-rb-btn" onClick={() => navigate(`/replay/${patient.id}`)}>
              Launch Player
            </button>
          </div>
          {/* Timeline Visualizer */}
          <div className="pd-rb-emotion-bar">
            {(sessionReplay?.emotionTimeline ?? []).map((ev, i) => (
              <div 
                key={i} 
                className="pd-rb-eb-seg" 
                style={{ background: getEmotionColor(ev.emotion) }} 
                title={`${ev.time}s: ${ev.emotion}`} 
              />
            ))}
          </div>
        </motion.div>

        <div className="pd-grid">
          <div className="pd-content-col">
            <motion.div className="pd-chart-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="pd-chart-header">
                <div className="pd-ch-title">
                  <h3>Stress Trajectory</h3>
                  <p>Cumulative patient stress markers over time</p>
                </div>
                <span className="badge badge-blue">{stressTrend.length} sessions</span>
              </div>
              <div className="pd-chart">
                <div className="pd-chart-y">
                  <span>10</span><span>7</span><span>5</span><span>0</span>
                </div>
                <div className="pd-chart-area">
                  <div className="pd-threshold" style={{ bottom: `${(7 / maxScore) * 100}%` }}>
                    <span>Clinical threshold</span>
                  </div>
                  <div className="pd-bars">
                    {stressTrend.map((pt, i) => {
                      const pct = (pt.score / maxScore) * 100;
                      const isHigh = pt.score >= 7;
                      const isMid = pt.score >= 5;
                      
                      const bgStyle = isHigh 
                        ? 'linear-gradient(180deg, var(--rose-400) 0%, rgba(244,63,94,0.4) 100%)' 
                        : isMid 
                        ? 'linear-gradient(180deg, var(--amber-400) 0%, rgba(245,158,11,0.4) 100%)' 
                        : 'linear-gradient(180deg, var(--purple-400) 0%, rgba(129,140,248,0.4) 100%)';

                      return (
                        <div key={i} className="pd-bar-col">
                          <div className="pd-bar-tooltip">{pt.date}: {pt.score.toFixed(1)}/10</div>
                          <motion.div
                            className="pd-bar"
                            style={{ background: bgStyle }}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                          />
                          <span className="pd-bar-label">{pt.date.split(' ')[0]} {pt.date.split(' ')[1]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="pd-sessions card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="pd-sessions-header">
                <h3>Clinical History</h3>
                <p>Full repository of session data and SOAP documentation</p>
              </div>
              <div className="pd-session-list">
                {sessions.slice().reverse().map((session, i) => {
                  const prompt = DRAWING_PROMPTS.find(p => p.id === session.promptId);
                  const isExpanded = expandedSession === session.id;
                  const note = session.result.clinical_note;

                  return (
                    <motion.div
                      key={session.id}
                      className={`pd-session-item ${isExpanded ? 'pd-si-expanded' : ''}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.04 }}
                    >
                      <div className="pd-si-header" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                        <div className="pd-si-left">
                          <div className="pd-si-icon" style={{ background: prompt?.colorLight || '#F1F5F9' }}>
                            {prompt?.icon || 'D'}
                          </div>
                          <div className="pd-si-meta">
                            <span className="pd-si-title">{prompt?.title || 'Drawing'}</span>
                            <span className="pd-si-date">
                              {new Date(session.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="pd-si-right">
                          {session.result.crisis_flag && <span className="badge badge-red">Crisis</span>}
                          <span className={`score-pill ${session.stressScore >= 7 ? 'score-high' : session.stressScore >= 5 ? 'score-mid' : 'score-low'}`}>
                            {session.stressScore.toFixed(1)}
                          </span>
                          <span className="pd-si-statement">"{session.result.personal_statement_en}"</span>
                          <svg className={`pd-si-chevron ${isExpanded ? 'pd-si-chevron-open' : ''}`} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className="pd-si-body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="pd-soap-grid">
                              <div className="pd-soap-card pd-soap-s">
                                <span className="pd-soap-letter">S</span>
                                <div>
                                  <h4>Subjective</h4>
                                  <p>{note.subjective}</p>
                                </div>
                              </div>
                              <div className="pd-soap-card pd-soap-o">
                                <span className="pd-soap-letter">O</span>
                                <div>
                                  <h4>Objective</h4>
                                  <p>{note.objective}</p>
                                </div>
                              </div>
                              <div className="pd-soap-card pd-soap-a">
                                <span className="pd-soap-letter">A</span>
                                <div>
                                  <h4>Assessment</h4>
                                  <p>{note.assessment}</p>
                                </div>
                              </div>
                              <div className="pd-soap-card pd-soap-p">
                                <span className="pd-soap-letter">P</span>
                                <div>
                                  <h4>Plan</h4>
                                  <p>{note.plan}</p>
                                </div>
                              </div>
                            </div>

                            <div className="pd-indicators">
                              <h4>Drawing Indicators</h4>
                              <div className="pd-ind-grid">
                                <div className="pd-ind">
                                  <span className="pd-ind-label">Isolation</span>
                                  <div className="pd-ind-bar-track">
                                    <div className="pd-ind-bar-fill" style={{ width: `${(session.result.indicators.isolation / 5) * 100}%`, background: session.result.indicators.isolation >= 4 ? 'var(--error)' : session.result.indicators.isolation >= 2 ? 'var(--warning)' : 'var(--success)' }} />
                                  </div>
                                  <span className="pd-ind-val">{session.result.indicators.isolation}/5</span>
                                </div>
                                <div className="pd-ind">
                                  <span className="pd-ind-label">Red/Dark %</span>
                                  <div className="pd-ind-bar-track">
                                    <div className="pd-ind-bar-fill" style={{ width: `${session.result.indicators.red_pct}%`, background: session.result.indicators.red_pct >= 40 ? 'var(--error)' : session.result.indicators.red_pct >= 20 ? 'var(--warning)' : 'var(--success)' }} />
                                  </div>
                                  <span className="pd-ind-val">{session.result.indicators.red_pct}%</span>
                                </div>
                                <div className="pd-ind">
                                  <span className="pd-ind-label">Somatic</span>
                                  <span className={`badge ${session.result.indicators.somatic ? 'badge-yellow' : 'badge-green'}`}>
                                    {session.result.indicators.somatic ? 'Present' : 'None'}
                                  </span>
                                </div>
                                <div className="pd-ind">
                                  <span className="pd-ind-label">Line Pressure</span>
                                  <span className={`badge ${session.result.indicators.line_pressure === 'heavy' || session.result.indicators.line_pressure === 'asymmetric' ? 'badge-red' : session.result.indicators.line_pressure === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                                    {session.result.indicators.line_pressure}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <aside className="pd-sidebar-col">
            <motion.div className="pd-patient-mini card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="pd-pm-toppart">
                <div className={`pd-pm-avatar pd-avatar-${patient.riskLevel}`}>{patient.avatar}</div>
                <div className="pd-pm-info">
                  <h3>{patient.name}</h3>
                  <p>{patient.diagnosis.split(';')[0]}</p>
                </div>
              </div>
              <div className="pd-pm-stats">
                <div className="pm-stat-box">
                  <span className="pm-sb-label">SESS.</span>
                  <span className="pm-sb-val">{sessions.length}</span>
                </div>
                <div className="pm-stat-box">
                  <span className="pm-sb-label">AVG.</span>
                  <span className="pm-sb-val">{avgStress.toFixed(1)}</span>
                </div>
                <div className="pm-stat-box">
                  <span className="pm-sb-label">RISK</span>
                  <span className={`pm-sb-val risk-${patient.riskLevel}`} title={patient.riskLevel}>{riskShort}</span>
                </div>
              </div>
              <div className="pd-meta-tags mini">
                <span className="pd-meta-tag">{patient.age}y</span>
                <span className="pd-meta-tag">{patient.languageLabel}</span>
                <span className="pd-meta-tag">{patient.insuranceProvider}</span>
              </div>
            </motion.div>

            <div className="pd-sticky-segment">
              <motion.div className="pd-action-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="pd-ac-header">
                  <h4>Clinical Actions</h4>
                  <div className="pd-ac-dot" />
                </div>
                <div className="pd-ac-btns">
                  <button type="button" className="btn btn-secondary btn-block" onClick={() => navigate(`/replay/${patient.id}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Session Replay
                  </button>
                  <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('/insurance', { state: { patientId: patient.id, result: latestAnalysis } })}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    File Insurance Claim
                  </button>
                  <button type="button" className="btn btn-outline btn-block" onClick={handleGenerateEHR}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Export FHIR Observation
                  </button>
                  <button type="button" className="btn btn-outline btn-block" onClick={() => {
                    if (latestAnalysis) {
                      exportClinicalNotePDF(
                        { S: latestSession.result.clinical_note.subjective, O: latestSession.result.clinical_note.objective, A: latestSession.result.clinical_note.assessment, P: latestSession.result.clinical_note.plan },
                        `${patient.name} — ${sessions.length} art therapy sessions`
                      );
                    }
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                    Download Clinical PDF
                  </button>
                </div>

                {showFHIR && generatedFHIR && (
                  <div className="pd-fhir-mini">
                    <div className="pd-fhir-mini-header">
                      <span>FHIR Generated</span>
                      <button onClick={() => downloadFHIRJSON(generatedFHIR)}>JSON</button>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div className="pd-flags-mini card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h4>Predictive Markers</h4>
                {topFlags.length > 0 ? (
                  <div className="pd-flag-list-mini">
                    {topFlags.map(([flag, count]) => (
                      <div key={flag} className="pd-flag-item-mini">
                        <div className="pd-fim-top">
                          <span>{flag}</span>
                          <strong>{((count / sessions.length) * 100).toFixed(0)}%</strong>
                        </div>
                        <div className="pd-fim-bar"><div style={{ width: `${(count / sessions.length) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pd-no-data">No flags detected.</p>
                )}
              </motion.div>

              <motion.div className="pd-caregiver-mini card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h4>Caregiver Reports</h4>
                {caregiverNotes.length > 0 ? (
                  <div className="pd-cg-list-mini">
                    {caregiverNotes.slice().reverse().slice(0, 3).map((s, i) => (
                      <div key={i} className="pd-cg-item-mini">
                        <span className="pd-cgi-date">{new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <div className="pd-cgi-tags">
                          {s.caregiverNote.meltdowns > 0 && <span className="tag-red">Meldown</span>}
                          {s.caregiverNote.sleep === 'Bad' && <span className="tag-amber">Poor Sleep</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pd-no-data">No caregiver data.</p>
                )}
              </motion.div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
