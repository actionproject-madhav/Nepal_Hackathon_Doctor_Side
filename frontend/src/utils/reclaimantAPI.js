/**
 * Reclaimant Backend API Client
 * Connects frontend to Flask backend for real appeal submissions
 */

const API_BASE_URL = import.meta.env.VITE_RECLAIMANT_API_URL || 'http://localhost:5001';

/**
 * AI-powered denial analysis
 */
export async function analyzeDenialWithAI(denialText, denialCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-denial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ denialText, denialCode })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Denial analysis error:', error);
    return null;
  }
}

/**
 * Vector similarity search for precedents
 */
export async function matchPrecedentsWithAI(denialText, precedents, topK = 5) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/match-precedents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ denialText, precedents, topK })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.matched_precedents;
  } catch (error) {
    console.error('Precedent matching error:', error);
    return precedents.slice(0, topK); // Fallback to original list
  }
}

/**
 * Submit appeal and send real email
 */
export async function submitAppealToBackend(appealData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/submit-appeal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appealData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Appeal submission error:', error);
    throw error;
  }
}

/**
 * Get appeal status by tracking ID
 */
export async function getAppealStatus(trackingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/appeal-status/${trackingId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get appeal status error:', error);
    return null;
  }
}

/**
 * Get all appeals for a patient
 */
export async function getPatientAppeals(patientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/patient-appeals/${patientId}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.appeals || [];
  } catch (error) {
    console.error('Get patient appeals error:', error);
    return [];
  }
}

/**
 * Update appeal status (admin function)
 */
export async function updateAppealStatus(trackingId, status, notes = '') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/update-appeal-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tracking_id: trackingId, status, notes })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Update appeal status error:', error);
    return false;
  }
}

/**
 * Get statistics
 */
export async function getAppealStatistics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/statistics`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.statistics;
  } catch (error) {
    console.error('Get statistics error:', error);
    return null;
  }
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('Backend not available - will use frontend-only mode');
    return false;
  }
}
