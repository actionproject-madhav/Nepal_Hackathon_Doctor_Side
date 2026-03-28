import { motion, AnimatePresence } from 'framer-motion';
import './WorkflowProgress.css';

/**
 * Workflow Progress Overlay
 * Shows automated workflow progress in a clean overlay
 */
export default function WorkflowProgress({ isActive, currentStep, message, onClose }) {
  if (!isActive) return null;

  const steps = [
    { id: 1, label: 'Analyzing', icon: '🔍' },
    { id: 2, label: 'Opening Portal', icon: '🌐' },
    { id: 3, label: 'Filling Form', icon: '📝' },
    { id: 4, label: 'Validating', icon: '✓' },
    { id: 5, label: 'Email Draft', icon: '📧' },
    { id: 6, label: 'Sending', icon: '🚀' },
    { id: 7, label: 'Complete', icon: '✓' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="workflow-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="workflow-modal"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="workflow-header">
            <h2>Automated Claim Submission</h2>
            <p>Please wait while the system processes your claim...</p>
          </div>

          <div className="workflow-steps">
            {steps.map((step, index) => {
              const isComplete = currentStep > step.id;
              const isActive = currentStep === step.id;
              const isPending = currentStep < step.id;

              return (
                <div
                  key={step.id}
                  className={`workflow-step ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                >
                  <div className="workflow-step-icon">
                    {isComplete ? '✓' : isActive ? (
                      <div className="workflow-spinner" />
                    ) : step.icon}
                  </div>
                  <div className="workflow-step-label">{step.label}</div>
                  {index < steps.length - 1 && (
                    <div className={`workflow-step-line ${isComplete ? 'complete' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="workflow-message">
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {message}
            </motion.p>
          </div>

          {currentStep === 7 && (
            <motion.button
              className="workflow-close-btn"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              View Confirmation
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
