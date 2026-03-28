import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './TraceGuard.css';

/**
 * TraceGuard - Real-time claim verification and defensibility scoring
 * Analyzes claims before submission to prevent denials
 */
export default function TraceGuard({ formData, patient, sessions, parityViolations, insurer }) {
  const [score, setScore] = useState(0);
  const [analyzing, setAnalyzing] = useState(true);
  const [checks, setChecks] = useState([]);

  // Calculate defensibility score
  const analysis = useMemo(() => {
    const results = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: Patient Information Complete (15 points)
    maxScore += 15;
    if (formData.patientName && formData.dob && formData.insuranceId) {
      results.push({ name: 'Patient Information', status: 'pass', points: 15 });
      totalScore += 15;
    } else {
      results.push({ name: 'Patient Information', status: 'fail', points: 0, issue: 'Missing required patient fields' });
    }

    // Check 2: Clinical Documentation (25 points)
    maxScore += 25;
    if (formData.chiefComplaint && formData.diagnosisCategory && formData.functionalImpairment && formData.symptomDuration) {
      const docQuality = [formData.chiefComplaint, formData.functionalImpairment].every(text => text.length > 50);
      if (docQuality) {
        results.push({ name: 'Clinical Documentation', status: 'pass', points: 25 });
        totalScore += 25;
      } else {
        results.push({ name: 'Clinical Documentation', status: 'warning', points: 15, issue: 'Documentation could be more detailed' });
        totalScore += 15;
      }
    } else {
      results.push({ name: 'Clinical Documentation', status: 'fail', points: 0, issue: 'Incomplete clinical information' });
    }

    // Check 3: Session Evidence (20 points)
    maxScore += 20;
    const sessionCount = sessions?.length || 0;
    if (sessionCount >= 4) {
      results.push({ name: 'Session Evidence', status: 'pass', points: 20 });
      totalScore += 20;
    } else if (sessionCount >= 2) {
      results.push({ name: 'Session Evidence', status: 'warning', points: 12, issue: `${sessionCount} sessions documented (recommend 4+)` });
      totalScore += 12;
    } else {
      results.push({ name: 'Session Evidence', status: 'fail', points: 0, issue: 'Insufficient session documentation' });
    }

    // Check 4: Parity Compliance (20 points)
    maxScore += 20;
    if (parityViolations && parityViolations.length > 0) {
      const hasHighSeverity = parityViolations.some(v => v.severity === 'high');
      if (hasHighSeverity) {
        results.push({ name: 'Parity Compliance', status: 'pass', points: 20, note: `${parityViolations.length} MHPAEA violations detected - strong appeal basis` });
        totalScore += 20;
      } else {
        results.push({ name: 'Parity Compliance', status: 'pass', points: 15 });
        totalScore += 15;
      }
    } else {
      results.push({ name: 'Parity Compliance', status: 'warning', points: 10, issue: 'No parity violations detected to strengthen appeal' });
      totalScore += 10;
    }

    // Check 5: Provider Credentials (10 points)
    maxScore += 10;
    if (formData.providerName && formData.providerNPI && formData.providerNPI.length === 10) {
      results.push({ name: 'Provider Credentials', status: 'pass', points: 10 });
      totalScore += 10;
    } else {
      results.push({ name: 'Provider Credentials', status: 'fail', points: 0, issue: 'Invalid or missing provider NPI' });
    }

    // Check 6: Insurer-Specific Requirements (10 points)
    maxScore += 10;
    if (insurer) {
      const requiresPriorAuth = insurer.policies?.priorAuthRequired;
      if (requiresPriorAuth) {
        results.push({ name: 'Insurer Requirements', status: 'pass', points: 10, note: 'Prior auth requirements met' });
        totalScore += 10;
      } else {
        results.push({ name: 'Insurer Requirements', status: 'pass', points: 10, note: 'No prior auth required' });
        totalScore += 10;
      }
    } else {
      results.push({ name: 'Insurer Requirements', status: 'warning', points: 5 });
      totalScore += 5;
    }

    const finalScore = Math.round((totalScore / maxScore) * 100);

    return {
      score: finalScore,
      checks: results,
      level: finalScore >= 85 ? 'verified' : finalScore >= 70 ? 'defensible' : finalScore >= 50 ? 'at-risk' : 'undefendable',
    };
  }, [formData, patient, sessions, parityViolations, insurer]);

  // Animate score counting up
  useEffect(() => {
    setAnalyzing(true);
    setScore(0);
    setChecks([]);

    const timer = setTimeout(() => {
      setAnalyzing(false);
      let current = 0;
      const increment = analysis.score / 30;
      const interval = setInterval(() => {
        current += increment;
        if (current >= analysis.score) {
          setScore(analysis.score);
          clearInterval(interval);
        } else {
          setScore(Math.floor(current));
        }
      }, 30);

      // Show checks one by one
      analysis.checks.forEach((check, i) => {
        setTimeout(() => {
          setChecks(prev => [...prev, check]);
        }, i * 200);
      });

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timer);
  }, [analysis]);

  return (
    <div className={`traceguard-card card ${analysis.level}`}>
      <div className="traceguard-header">
        <div className="traceguard-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            {analysis.level === 'verified' && <path d="M9 12l2 2 4-4"/>}
          </svg>
          <h4>TraceGuard</h4>
        </div>
        <span className="traceguard-badge">ACTIVE</span>
      </div>

      <div className="traceguard-score-section">
        <div className="traceguard-score-ring">
          <svg viewBox="0 0 100 100">
            <circle
              className="traceguard-score-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
            />
            <motion.circle
              className="traceguard-score-fill"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="traceguard-score-value">
            <span className="traceguard-score-number">{score}</span>
            <span className="traceguard-score-label">/ 100</span>
          </div>
        </div>

        <div className="traceguard-score-status">
          <span className={`traceguard-level traceguard-level-${analysis.level}`}>
            {analysis.level === 'verified' && 'VERIFIED'}
            {analysis.level === 'defensible' && 'DEFENSIBLE'}
            {analysis.level === 'at-risk' && 'AT RISK'}
            {analysis.level === 'undefendable' && 'UNDEFENDABLE'}
          </span>
          <p className="traceguard-level-desc">
            {analysis.level === 'verified' && 'Claim meets all requirements. Low denial risk.'}
            {analysis.level === 'defensible' && 'Claim is defensible but could be strengthened.'}
            {analysis.level === 'at-risk' && 'Claim has gaps that may lead to denial.'}
            {analysis.level === 'undefendable' && 'Critical issues detected. Do not submit.'}
          </p>
        </div>
      </div>

      <div className="traceguard-checks">
        {analyzing && (
          <div className="traceguard-analyzing">
            <div className="traceguard-spinner" />
            <span>Analyzing claim defensibility...</span>
          </div>
        )}

        <AnimatePresence>
          {checks.map((check, i) => (
            <motion.div
              key={check.name}
              className={`traceguard-check traceguard-check-${check.status}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="traceguard-check-icon">
                {check.status === 'pass' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
                {check.status === 'warning' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                )}
                {check.status === 'fail' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                )}
              </div>
              <div className="traceguard-check-content">
                <div className="traceguard-check-name">{check.name}</div>
                {check.issue && <div className="traceguard-check-issue">{check.issue}</div>}
                {check.note && <div className="traceguard-check-note">{check.note}</div>}
              </div>
              <div className="traceguard-check-points">{check.points} pts</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
