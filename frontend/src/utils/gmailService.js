/**
 * Gmail Integration Service
 * Handles OAuth authentication and email drafting
 */

const GMAIL_COMPOSE_URL = 'https://mail.google.com/mail/?view=cm';

/**
 * Get insurer email address based on provider
 */
function getInsurerEmail(insurer) {
  const emailMap = {
    aetna: 'appeals@aetna.com',
    united: 'appeals@uhc.com',
    cigna: 'appeals@cigna.com',
    anthem: 'appeals@anthem.com',
    humana: 'appeals@humana.com',
    medicare: 'medicare.appeals@cms.gov',
    tricare: 'appeals@tricare.mil',
    molina: 'appeals@molinahealthcare.com',
    medicaid_state: 'appeals@medicaid.gov',
  };

  return emailMap[insurer?.id] || 'appeals@insurance.com';
}

/**
 * Open Gmail compose window with pre-filled appeal email
 * @param {string} appealLetter - The generated appeal letter text
 * @param {Object} insurer - Insurance provider object
 * @param {Object} formData - Claim form data
 * @returns {Window} Reference to opened window
 */
export function draftGmailAppeal(appealLetter, insurer, formData) {
  const to = getInsurerEmail(insurer);
  const subject = `FORMAL APPEAL - Claim Denial ${formData?.insuranceId || ''} - ${formData?.patientName || 'Patient'}`;
  const body = `${appealLetter}\n\n---\nGenerated via VoiceCanvas Clinic\nThis email was pre-drafted by the Reclaimant appellate engine.`;

  // URL encode parameters
  const params = new URLSearchParams({
    fs: '1', // full screen
    tf: '1', // show to field
    to: to,
    su: subject,
    body: body,
  });

  const gmailURL = `${GMAIL_COMPOSE_URL}&${params.toString()}`;

  // Open in new window
  const gmailWindow = window.open(gmailURL, '_blank', 'width=800,height=600');

  if (!gmailWindow) {
    alert('Popup blocked. Please allow popups to draft email in Gmail.');
    return null;
  }

  return gmailWindow;
}

/**
 * Compose email for claim submission notification
 * @param {Object} patient - Patient object
 * @param {Object} insurer - Insurance provider
 * @param {string} claimId - Claim reference ID
 */
export function draftClaimSubmissionEmail(patient, insurer, claimId) {
  const to = getInsurerEmail(insurer);
  const subject = `Pre-Authorization Submission - ${patient?.name || 'Patient'} - Claim ${claimId}`;
  const body = `Dear ${insurer?.name || 'Insurance'} Review Team,

Attached please find the pre-authorization documentation for:

Patient: ${patient?.name || 'N/A'}
Member ID: ${claimId || 'N/A'}
Date of Service: ${new Date().toLocaleDateString()}
Provider: Dr. Sarah Mitchell, PhD, LCSW
NPI: 1234567890

Clinical documentation includes:
- ${patient?.sessions?.length || 0} VoiceCanvas art therapy session records
- SOAP notes with AI-assisted clinical analysis
- Facial affect analysis and stress trajectory data
- MHPAEA parity compliance documentation

Please process this pre-authorization request within your standard review timeframe.

If you require additional information, please contact our office directly.

Respectfully,
VoiceCanvas Clinic
---
Generated via VoiceCanvas Reclaimant System`;

  const params = new URLSearchParams({
    fs: '1',
    tf: '1',
    to: to,
    su: subject,
    body: body,
  });

  const gmailURL = `${GMAIL_COMPOSE_URL}&${params.toString()}`;
  const gmailWindow = window.open(gmailURL, '_blank', 'width=800,height=600');

  if (!gmailWindow) {
    alert('Popup blocked. Please allow popups to draft email in Gmail.');
    return null;
  }

  return gmailWindow;
}

/**
 * Advanced: OAuth-based Gmail API integration
 * Requires user to authorize the app
 */
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.compose';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize Google API
 */
export async function initGmailAPI() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
        });
        gapiInited = true;
        resolve();
      });
    };
    document.body.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services
 */
export function initGoogleIdentity(onAuthSuccess) {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: GMAIL_SCOPES,
      callback: onAuthSuccess,
    });
    gisInited = true;
  };
  document.body.appendChild(script);
}

/**
 * Request Gmail authorization and create draft
 */
export async function createGmailDraftWithAPI(appealLetter, insurer, formData) {
  if (!gapiInited || !gisInited) {
    console.error('Gmail API not initialized');
    return false;
  }

  return new Promise((resolve) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        console.error('Auth error:', resp);
        resolve(false);
        return;
      }

      try {
        const to = getInsurerEmail(insurer);
        const subject = `FORMAL APPEAL - Claim Denial ${formData?.insuranceId || ''} - ${formData?.patientName || 'Patient'}`;

        const email = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          appealLetter,
        ].join('\n');

        const encodedEmail = btoa(unescape(encodeURIComponent(email)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const response = await gapi.client.gmail.users.drafts.create({
          userId: 'me',
          resource: {
            message: {
              raw: encodedEmail,
            },
          },
        });

        console.log('Draft created:', response);

        // Open Gmail drafts
        window.open('https://mail.google.com/mail/#drafts', '_blank');
        resolve(true);
      } catch (error) {
        console.error('Error creating draft:', error);
        resolve(false);
      }
    };

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * Alternative email method using system default mail client
 */
export function openMailtoLink(appealLetter, insurer, formData) {
  const to = getInsurerEmail(insurer);
  const subject = `FORMAL APPEAL - Claim Denial ${formData?.insuranceId || ''} - ${formData?.patientName || 'Patient'}`;
  const body = encodeURIComponent(appealLetter);

  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
}
