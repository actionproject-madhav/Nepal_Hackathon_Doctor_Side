import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPatientById } from '../data/mockPatients';
import { getReplayForPatient, getEmotionColor, getValenceLabel } from '../data/mockReplay';
import {
  getAzureReplayConfig,
  fetchLatestReplayMetaDetailed,
  fetchSessionsManifest,
  deleteAzureSession,
  buildBlobUrl,
} from '../utils/azureReplay';
import './SessionReplay.css';

function buildAzureReplayFromMeta(meta, cfg) {
  if (!meta || !cfg) return null;
  return {
    videoUrl: meta.videoPath
      ? buildBlobUrl(cfg.account, cfg.container, meta.videoPath, cfg.sas)
      : undefined,
    drawingImageUrl: meta.drawingPath
      ? buildBlobUrl(cfg.account, cfg.container, meta.drawingPath, cfg.sas)
      : undefined,
    sessionId: meta.sessionId,
    sessionDate: meta.sessionDate,
    promptTitle: meta.promptTitle,
    sessionStressScore: meta.stressScore,
  };
}

export default function SessionReplay() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const patient = getPatientById(patientId);
  const baseReplay = useMemo(() => (patient ? getReplayForPatient(patient) : null), [patient]);
  const [azureReplay, setAzureReplay] = useState(null);
  const [replayBanner, setReplayBanner] = useState({ kind: 'loading', text: 'Checking for Azure recording…' });
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!patient?.id) {
      setAzureReplay(null);
      setSessionsList([]);
      setSelectedSessionId(null);
      setReplayBanner({ kind: 'idle', text: '' });
      return;
    }
    let cancelled = false;
    setAzureReplay(null);
    setSessionsList([]);
    setSelectedSessionId(null);
    setReplayBanner({ kind: 'loading', text: 'Checking for Azure recording…' });
    (async () => {
      const [latestResult, manifest] = await Promise.all([
        fetchLatestReplayMetaDetailed(patient.id),
        fetchSessionsManifest(patient.id),
      ]);
      if (cancelled) return;

      const cfg = getAzureReplayConfig();
      const list =
        manifest.length > 0
          ? manifest
          : latestResult.meta && (latestResult.meta.videoPath || latestResult.meta.drawingPath)
            ? [latestResult.meta]
            : [];

      if (list.length > 0 && cfg) {
        setReplayBanner({
          kind: 'azure',
          text: `${list.length} session recording(s) in Azure — newest first. Emotion timeline is still demo data.`,
        });
        setSessionsList(list);
        const first = list[0];
        setSelectedSessionId(first.sessionId);
        setAzureReplay(buildAzureReplayFromMeta(first, cfg));
      } else {
        setReplayBanner(latestResult.banner);
        setAzureReplay(null);
      }
    })();
    return () => { cancelled = true; };
  }, [patient?.id]);

  const onSessionSelect = (e) => {
    const id = e.target.value;
    setSelectedSessionId(id);
    const cfg = getAzureReplayConfig();
    const meta = sessionsList.find((s) => String(s.sessionId) === String(id));
    if (meta && cfg) setAzureReplay(buildAzureReplayFromMeta(meta, cfg));
  };

  const handleDeleteSession = async () => {
    if (selectedSessionId == null || !getAzureReplayConfig()) return;
    if (!window.confirm('Delete this session’s video and drawing from Azure? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteAzureSession(patient.id, selectedSessionId);
      window.location.reload();
    } catch (err) {
      alert(
        err?.message
        || 'Delete failed. Ensure your SAS allows delete on blobs, and Blob CORS includes DELETE for this origin.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const replay = useMemo(() => {
    if (!baseReplay) return null;
    if (!azureReplay) return baseReplay;
    // Azure session: only use a real blob URL; never substitute the mock demo clip.
    const videoUrl = azureReplay.videoUrl ?? null;
    return {
      ...baseReplay,
      videoUrl,
      drawingImageUrl: azureReplay.drawingImageUrl ?? null,
      sessionId: azureReplay.sessionId ?? baseReplay.sessionId,
      sessionDate: azureReplay.sessionDate ?? baseReplay.sessionDate,
      promptTitle: azureReplay.promptTitle || baseReplay.promptTitle,
      sessionStressScore: azureReplay.sessionStressScore != null ? azureReplay.sessionStressScore : baseReplay.sessionStressScore,
    };
  }, [baseReplay, azureReplay]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const currentEmotion = useMemo(() => {
    if (!replay) return null;
    const sorted = replay.emotionTimeline.filter(e => e.time <= currentTime);
    return sorted.length > 0 ? sorted[sorted.length - 1] : replay.emotionTimeline[0];
  }, [currentTime, replay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTime = () => setCurrentTime(Math.floor(video.currentTime));
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [replay?.videoUrl]);

  useEffect(() => {
    if (!timelineRef.current || !currentEmotion) return;
    const activeEl = timelineRef.current.querySelector('.sr-tl-active');
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentEmotion]);

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  if (!patient || !replay) {
    return (
      <div className="sr-page">
        <div className="sr-not-found">
          <h2>Patient not found</h2>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const { overallAnalysis: oa } = replay;

  return (
    <div className="sr-page">
      <header className="sr-header">
        <div className="sr-header-left">
          <button className="sr-back" onClick={() => navigate(`/dashboard/${patientId}`)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h1>Session Replay</h1>
            <p className="sr-header-sub">
              <strong>{patient.name}</strong>
              <span className="sr-sep">·</span>
              Session #{replay.sessionId}
              <span className="sr-sep">·</span>
              {replay.promptTitle}
              <span className="sr-sep">·</span>
              {new Date(replay.sessionDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
            <p className="sr-header-meta">
              Clinical stress score this session: <strong>{replay.sessionStressScore != null ? replay.sessionStressScore.toFixed(1) : '—'}</strong>/10
              <span className="sr-sep">·</span>
              {azureReplay
                ? 'Webcam + canvas from Azure when available. Emotion timeline is demo data for the hackathon.'
                : 'Sample clip + demo emotion timeline until an Azure upload exists for this patient.'}
            </p>
            <p className={`sr-replay-banner sr-replay-banner--${replayBanner.kind}`} role="status">
              {replayBanner.text}
            </p>
          </div>
        </div>
        <div className="sr-header-right">
          <button className={`sr-toggle-btn ${showAnalysis ? 'sr-toggle-active' : ''}`} onClick={() => setShowAnalysis(!showAnalysis)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Emotion Overlay
          </button>
        </div>
      </header>

      {sessionsList.length > 0 && (
        <div className="sr-session-bar">
          <label className="sr-session-label">
            <span>Recorded session</span>
            <select
              className="sr-session-select"
              value={selectedSessionId != null ? String(selectedSessionId) : ''}
              onChange={onSessionSelect}
            >
              {sessionsList.map((s) => (
                <option key={String(s.sessionId)} value={String(s.sessionId)}>
                  #{s.sessionId} — {s.promptTitle || 'Session'} —{' '}
                  {s.sessionDate
                    ? new Date(s.sessionDate).toLocaleString()
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-ghost sr-session-delete"
            onClick={handleDeleteSession}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete this session'}
          </button>
        </div>
      )}

      <div className="sr-content">
        <div className="sr-video-col">
          {azureReplay && !replay.drawingImageUrl && (
            <div className="sr-drawing-missing-banner" role="status">
              No drawing file in Azure for this session (only video was stored). Complete a new VoiceCanvas session with the latest build — it uploads <strong>drawing.png</strong> next to the video.
            </div>
          )}

          {replay.drawingImageUrl && (
            <div className="sr-drawing-panel">
              <h3 className="sr-drawing-title">Drawing from this session</h3>
              <div className="sr-drawing-frame">
                <img
                  key={`${replay.sessionId}-drawing`}
                  src={replay.drawingImageUrl}
                  alt="Patient drawing for this session"
                  className="sr-drawing-img"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          )}

          <div className="sr-video-wrap">
            {replay.videoUrl ? (
            <video
              key={replay.videoUrl}
              ref={videoRef}
              src={replay.videoUrl}
              className="sr-video"
              playsInline
              onClick={togglePlay}
            />
            ) : (
            <div className="sr-video-missing" role="status">
              <p><strong>No webcam recording</strong> for this session in Azure (drawing above may still be from the patient).</p>
              <p className="sr-video-missing-hint">Complete a new session from the latest VoiceCanvas build to upload <code>replay.webm</code> with the camera.</p>
            </div>
            )}

            {replay.videoUrl && showAnalysis && currentEmotion && (
              <motion.div
                className="sr-emotion-overlay"
                key={currentEmotion.time}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="sr-eo-dot" style={{ background: getEmotionColor(currentEmotion.emotion) }} />
                <div className="sr-eo-info">
                  <span className="sr-eo-emotion">{currentEmotion.emotion}</span>
                  <span className="sr-eo-conf">{Math.round(currentEmotion.confidence * 100)}% confidence</span>
                </div>
                <div className="sr-eo-valence">
                  <span className="sr-eo-v-label">Valence</span>
                  <div className="sr-eo-v-bar">
                    <div className="sr-eo-v-fill" style={{ width: `${currentEmotion.valence * 100}%`, background: currentEmotion.valence >= 0.5 ? 'var(--green-500)' : 'var(--rose-400)' }} />
                  </div>
                  <span className="sr-eo-v-val">{getValenceLabel(currentEmotion.valence)}</span>
                </div>
              </motion.div>
            )}

            {replay.videoUrl && !isPlaying && (
              <button type="button" className="sr-play-overlay" onClick={togglePlay}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
              </button>
            )}
          </div>

          <div className="sr-emotion-bar">
            {replay.emotionTimeline.map((evt, i) => {
              const width = 100 / replay.emotionTimeline.length;
              const isActive = currentEmotion?.time === evt.time;
              return (
                <button
                  key={i}
                  className={`sr-eb-segment ${isActive ? 'sr-eb-active' : ''}`}
                  style={{ width: `${width}%`, background: getEmotionColor(evt.emotion) }}
                  onClick={() => seekTo(evt.time)}
                  title={`${evt.label}: ${evt.emotion}`}
                />
              );
            })}
          </div>
          <div className="sr-eb-labels">
            <span>0:00</span>
            <span>Emotional state timeline</span>
            <span>0:{String(replay.duration).padStart(2, '0')}</span>
          </div>

          <div className="sr-analysis-card">
            <h3>Session Analysis</h3>
            <div className="sr-analysis-grid">
              <div className="sr-ag-item">
                <span className="sr-ag-label">Dominant Emotion</span>
                <span className="sr-ag-val">
                  <span className="sr-ag-dot" style={{ background: getEmotionColor(oa.dominantEmotion) }} />
                  {oa.dominantEmotion}
                </span>
              </div>
              <div className="sr-ag-item">
                <span className="sr-ag-label">Emotional Range</span>
                <span className="sr-ag-val">{oa.emotionalRange}</span>
              </div>
              <div className="sr-ag-item">
                <span className="sr-ag-label">Valence Shift</span>
                <span className={`sr-ag-val ${oa.positiveShift ? 'sr-ag-positive' : 'sr-ag-negative'}`}>
                  {oa.startValence.toFixed(2)} → {oa.endValence.toFixed(2)} ({oa.positiveShift ? '+' : ''}{(oa.endValence - oa.startValence).toFixed(2)})
                </span>
              </div>
              <div className="sr-ag-item">
                <span className="sr-ag-label">Peak Stress</span>
                <span className="sr-ag-val sr-ag-negative">
                  {oa.peakStress.emotion} at 0:{String(oa.peakStress.time).padStart(2, '0')}
                </span>
              </div>
              <div className="sr-ag-item">
                <span className="sr-ag-label">Peak Positive</span>
                <span className="sr-ag-val sr-ag-positive">
                  {oa.peakPositive.emotion} at 0:{String(oa.peakPositive.time).padStart(2, '0')}
                </span>
              </div>
              <div className="sr-ag-item">
                <span className="sr-ag-label">Smile Detected</span>
                <span className="sr-ag-val">{oa.smileCount} time{oa.smileCount !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="sr-indicators-row">
              <div className="sr-ind-group">
                <h4>Stress Indicators</h4>
                <div className="sr-ind-tags">
                  {oa.stressIndicators.map(ind => (
                    <span key={ind} className="sr-ind-tag sr-ind-stress">{ind.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
              <div className="sr-ind-group">
                <h4>Positive Indicators</h4>
                <div className="sr-ind-tags">
                  {oa.positiveIndicators.map(ind => (
                    <span key={ind} className="sr-ind-tag sr-ind-positive">{ind.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sr-timeline-col">
          <div className="sr-timeline-card">
            <h3>Emotion Timeline</h3>
            <p className="sr-tl-hint">Click any event to jump to that moment</p>
            <div className="sr-tl-list" ref={timelineRef}>
              {replay.emotionTimeline.map((evt, i) => {
                const isActive = currentEmotion?.time === evt.time;
                return (
                  <button
                    key={i}
                    className={`sr-tl-item ${isActive ? 'sr-tl-active' : ''}`}
                    onClick={() => seekTo(evt.time)}
                  >
                    <div className="sr-tl-time">0:{String(evt.time).padStart(2, '0')}</div>
                    <div className="sr-tl-connector">
                      <div className="sr-tl-dot" style={{ background: getEmotionColor(evt.emotion) }} />
                      {i < replay.emotionTimeline.length - 1 && <div className="sr-tl-line" />}
                    </div>
                    <div className="sr-tl-content">
                      <div className="sr-tl-top">
                        <span className="sr-tl-label">{evt.label}</span>
                        <span className="sr-tl-emotion" style={{ color: getEmotionColor(evt.emotion) }}>{evt.emotion}</span>
                      </div>
                      <p className="sr-tl-notes">{evt.notes}</p>
                      <div className="sr-tl-bars">
                        <div className="sr-tl-bar-row">
                          <span>Valence</span>
                          <div className="sr-tl-bar-track">
                            <div className="sr-tl-bar-fill" style={{ width: `${evt.valence * 100}%`, background: evt.valence >= 0.5 ? 'var(--green-500)' : 'var(--rose-400)' }} />
                          </div>
                          <span>{(evt.valence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="sr-tl-bar-row">
                          <span>Arousal</span>
                          <div className="sr-tl-bar-track">
                            <div className="sr-tl-bar-fill" style={{ width: `${evt.arousal * 100}%`, background: 'var(--amber-400)' }} />
                          </div>
                          <span>{(evt.arousal * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sr-snapshots-card">
            <h3>Drawing Snapshots</h3>
            <p className="sr-snapshots-hint">
              {replay.drawingImageUrl
                ? 'Final canvas from VoiceCanvas (Azure). Timeline entries below are demo placeholders.'
                : 'Demo timeline labels — complete a VoiceCanvas session with Azure upload to see the real drawing above.'}
            </p>
            <div className="sr-snap-list">
              {replay.drawingSnapshots.map((snap, i) => (
                <button key={i} className="sr-snap-item" onClick={() => seekTo(snap.time)}>
                  <div className="sr-snap-time">0:{String(snap.time).padStart(2, '0')}</div>
                  <div className="sr-snap-thumb">
                    {replay.drawingImageUrl && i === 0 ? (
                      <img src={replay.drawingImageUrl} alt="" className="sr-snap-thumb-img" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    )}
                  </div>
                  <span className="sr-snap-desc">{snap.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
