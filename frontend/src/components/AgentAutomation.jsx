import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AgentAutomation.css';

/**
 * AgentAutomation Component
 * Simulates a live AI agent or RPA bot executing tasks on the screen.
 * 
 * @param {Array} tasks - Array of task objects: { text, subtext, typeSpeed, duration }
 * @param {Function} onComplete - Callback when all tasks finish
 * @param {String} title - Header title for the agent window
 * @param {String} insurerColor - Hex color to theme the agent securely
 */
export default function AgentAutomation({ tasks, onComplete, title = "Agent Action Executing", insurerColor = 'var(--green-500)' }) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [typedSubtext, setTypedSubtext] = useState('');
  const [taskStatus, setTaskStatus] = useState('processing'); // 'processing' | 'done'
  const [completedLog, setCompletedLog] = useState([]);

  useEffect(() => {
    if (currentTaskIndex >= tasks.length) {
      setTimeout(onComplete, 1200);
      return;
    }

    const task = tasks[currentTaskIndex];
    setTaskStatus('processing');
    setTypedSubtext('');

    let typeInterval;
    if (task.subtext) {
      let charIdx = 0;
      const speed = task.typeSpeed || 15;
      typeInterval = setInterval(() => {
        setTypedSubtext(prev => prev + task.subtext.charAt(charIdx));
        charIdx++;
        if (charIdx >= task.subtext.length) {
          clearInterval(typeInterval);
        }
      }, speed);
    }

    const taskTimer = setTimeout(() => {
      if (typeInterval) clearInterval(typeInterval);
      setTaskStatus('done');
      setCompletedLog(prev => [...prev, { ...task, finalSubtext: task.subtext }]);
      
      setTimeout(() => {
        setCurrentTaskIndex(prev => prev + 1);
      }, 500); // small pause before next task
    }, task.duration || 2000);

    return () => {
      if (typeInterval) clearInterval(typeInterval);
      clearTimeout(taskTimer);
    };
  }, [currentTaskIndex, tasks, onComplete]);

  return (
    <motion.div 
      className="agent-auto-container"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="agent-auto-header" style={{ borderBottomColor: insurerColor }}>
        <div className="agent-auto-pulse" style={{ backgroundColor: insurerColor }} />
        <h3>{title}</h3>
        <span className="agent-auto-badge">LIVE AUTOMATION</span>
      </div>

      <div className="agent-auto-body">
        <div className="agent-auto-log">
          {/* Completed Tasks */}
          {completedLog.map((t, idx) => (
            <div key={idx} className="agent-task-row done">
              <div className="agent-task-icon" style={{ color: insurerColor }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div className="agent-task-content">
                <span className="agent-task-text">{t.text}</span>
                {t.finalSubtext && (
                  <div className="agent-task-subtext">{t.finalSubtext}</div>
                )}
              </div>
            </div>
          ))}

          {/* Current Task */}
          {currentTaskIndex < tasks.length && (
            <motion.div 
              className="agent-task-row processing"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="agent-task-icon spinning" style={{ borderTopColor: insurerColor }} />
              <div className="agent-task-content">
                <span className="agent-task-text">{tasks[currentTaskIndex].text}</span>
                {(typedSubtext || tasks[currentTaskIndex].subtext) && (
                  <div className="agent-task-subtext typing">
                    {typedSubtext}
                    <span className="agent-cursor" />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Pending Tasks (Dimmed) */}
          {tasks.slice(currentTaskIndex + 1).map((t, idx) => (
             <div key={`pending-${idx}`} className="agent-task-row pending">
               <div className="agent-task-icon pending-icon" />
               <div className="agent-task-content">
                 <span className="agent-task-text">{t.text}</span>
               </div>
             </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
