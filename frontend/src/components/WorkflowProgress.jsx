import { motion, AnimatePresence } from 'framer-motion';
import './WorkflowProgress.css';

/**
 * Professional Workflow Progress Overlay
 * Animated automation pipeline visualization
 */
export default function WorkflowProgress({ isActive, currentStep, message, onClose }) {
  if (!isActive) return null;

  const steps = [
    { id: 1, label: 'Analyzing Claim', icon: 'analyze' },
    { id: 2, label: 'Portal Connection', icon: 'portal' },
    { id: 3, label: 'Form Submission', icon: 'form' },
    { id: 4, label: 'Verification', icon: 'verify' },
    { id: 5, label: 'Email Draft', icon: 'email' },
    { id: 6, label: 'Transmission', icon: 'send' },
    { id: 7, label: 'Complete', icon: 'check' }
  ];

  const getIcon = (iconName, isActive, isComplete) => {
    if (isActive) {
      return (
        <div className="icon-spinner">
          <svg viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
        </div>
      );
    }

    if (isComplete) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }

    switch (iconName) {
      case 'analyze':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        );
      case 'portal':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'form':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'verify':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        );
      case 'email':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 6L2 7" />
          </svg>
        );
      case 'send':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        );
      case 'check':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="workflow-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="workflow-modal"
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="workflow-header">
            <div className="workflow-title">
              <div className="workflow-pulse" />
              <h2>Automated Claim Processing</h2>
            </div>
            <p>System executing secure workflow</p>
          </div>

          <div className="workflow-pipeline">
            {steps.map((step, index) => {
              const isComplete = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isPending = currentStep < step.id;

              return (
                <motion.div
                  key={step.id}
                  className="workflow-node-container"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`workflow-node ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}>
                    <div className="workflow-node-icon">
                      {getIcon(step.icon, isActive, isComplete)}
                    </div>
                    <div className="workflow-node-label">{step.label}</div>

                    {isActive && (
                      <motion.div
                        className="workflow-node-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <div className="workflow-connector">
                      <motion.div
                        className={`workflow-connector-line ${isComplete ? 'complete' : ''}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isComplete ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                      />
                      {isComplete && (
                        <motion.div
                          className="workflow-connector-flow"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 0.8, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="workflow-status">
            <AnimatePresence mode="wait">
              <motion.div
                key={message}
                className="workflow-status-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="workflow-status-dot" />
                <p>{message}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {currentStep === 7 && (
            <motion.button
              className="workflow-complete-btn"
              onClick={onClose}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Submission Details
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
