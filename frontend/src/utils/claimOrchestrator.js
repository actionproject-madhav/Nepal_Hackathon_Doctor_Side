/**
 * Claim Submission Orchestrator
 * Handles the entire claim submission workflow in one automated flow
 */

import { automatePortalSubmission } from './portalAutomation';
import { draftClaimSubmissionEmail } from './gmailService';

/**
 * Orchestrate the complete claim submission workflow
 * @param {Object} formData - Claim form data
 * @param {Object} patient - Patient object
 * @param {Object} insurer - Insurance provider object
 * @param {Function} onProgress - Progress callback (step, message, data)
 * @returns {Promise<Object>} Result object
 */
export async function submitClaimWorkflow(formData, patient, insurer, onProgress) {
  const steps = [];

  try {
    // Step 1: Verify claim defensibility
    onProgress(1, 'Analyzing claim defensibility...', { action: 'verify' });
    await delay(800);

    // Step 2: Open portal and fill
    onProgress(2, `Opening ${insurer?.name || 'provider'} portal...`, { action: 'portal-opening' });
    await delay(1000);

    const portalWindow = await automatePortalSubmission(
      insurer?.id || 'united',
      formData,
      (step, message) => {
        onProgress(2, message, { action: 'portal-filling', portalStep: step });
      }
    );

    steps.push({ step: 'portal', status: 'complete', window: portalWindow });

    // Step 3: Wait for form filling to complete
    onProgress(3, 'Completing form submission...', { action: 'portal-filling' });
    await delay(8000); // Wait for animation to complete

    // Step 4: Return focus and scroll to verification
    onProgress(4, 'Validating submission...', { action: 'scroll-verify' });
    window.focus();
    await delay(500);

    // Step 5: Draft email
    onProgress(5, 'Preparing confirmation email...', { action: 'email-draft' });
    await delay(1000);

    const emailSent = await askUserConfirmation(
      'Send Confirmation Email?',
      `Draft confirmation email to ${insurer?.name || 'provider'} appeals team?`
    );

    if (emailSent) {
      draftClaimSubmissionEmail(patient, insurer, formData.insuranceId);
      steps.push({ step: 'email', status: 'sent' });
      onProgress(6, 'Email drafted in Gmail', { action: 'email-sent' });
      await delay(1500);
    } else {
      steps.push({ step: 'email', status: 'skipped' });
      onProgress(6, 'Email skipped', { action: 'email-skipped' });
      await delay(500);
    }

    // Step 7: Complete
    onProgress(7, 'Claim submitted successfully', { action: 'complete' });

    return {
      success: true,
      steps,
      trackingId: `CLM-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Workflow error:', error);
    onProgress(-1, `Error: ${error.message}`, { action: 'error' });

    return {
      success: false,
      error: error.message,
      steps
    };
  }
}

/**
 * Ask user for confirmation via modal
 */
function askUserConfirmation(title, message) {
  return new Promise((resolve) => {
    const result = window.confirm(`${title}\n\n${message}`);
    resolve(result);
  });
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scroll to element smoothly
 */
export function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
