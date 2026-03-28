/**
 * Azure Blob Storage Upload Utilities for Session Replay Videos
 *
 * This module provides functions to upload recorded session videos
 * and metadata to Azure Blob Storage for later playback in the Session Replay viewer.
 */

import { getAzureReplayConfig, buildBlobUrl } from './azureReplay';

/**
 * Upload a session video and metadata to Azure Blob Storage
 *
 * @param {string} patientId - Patient identifier (e.g., "pt-001")
 * @param {Blob} videoBlob - Video file as a Blob
 * @param {Object} metadata - Session metadata
 * @param {string} metadata.sessionId - Session ID
 * @param {string} metadata.sessionDate - ISO date string
 * @param {string} metadata.promptTitle - Drawing prompt title
 * @param {number} metadata.stressScore - Stress score (0-10)
 * @param {Array} metadata.emotionTimeline - Array of emotion events (optional)
 * @returns {Promise<{success: boolean, videoUrl?: string, error?: string}>}
 */
export async function uploadSessionReplay(patientId, videoBlob, metadata) {
  const cfg = getAzureReplayConfig();

  if (!cfg) {
    return {
      success: false,
      error: 'Azure Storage not configured. Check VITE_AZURE_STORAGE_* environment variables.'
    };
  }

  const { account, container, sas } = cfg;
  const timestamp = new Date().getTime();
  const videoFileName = `session-${metadata.sessionId || timestamp}.mp4`;
  const videoPath = `${patientId}/${videoFileName}`;

  try {
    // Upload video file
    const videoUrl = `https://${account}.blob.core.windows.net/${container}/${videoPath}?${sas}`;

    const uploadResponse = await fetch(videoUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': videoBlob.type || 'video/mp4',
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Video upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Create metadata JSON
    const metadataJson = {
      videoPath,
      sessionId: metadata.sessionId || `session-${timestamp}`,
      sessionDate: metadata.sessionDate || new Date().toISOString(),
      promptTitle: metadata.promptTitle || 'Drawing Session',
      stressScore: metadata.stressScore || 0,
      emotionTimeline: metadata.emotionTimeline || [],
      uploadedAt: new Date().toISOString(),
    };

    // Upload latest-replay.json metadata
    const metaPath = `${patientId}/latest-replay.json`;
    const metaUrl = buildBlobUrl(account, container, metaPath, sas);

    const metaResponse = await fetch(metaUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadataJson, null, 2),
    });

    if (!metaResponse.ok) {
      throw new Error(`Metadata upload failed: ${metaResponse.status} ${metaResponse.statusText}`);
    }

    // Also save a timestamped copy for history
    const historyPath = `${patientId}/history/session-${timestamp}.json`;
    const historyUrl = buildBlobUrl(account, container, historyPath, sas);

    await fetch(historyUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadataJson, null, 2),
    });

    return {
      success: true,
      videoUrl: buildBlobUrl(account, container, videoPath, sas),
      videoPath,
      metadata: metadataJson,
    };
  } catch (error) {
    console.error('Azure upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all session videos for a patient
 *
 * @param {string} patientId - Patient identifier
 * @returns {Promise<Array>} Array of session metadata objects
 */
export async function listPatientSessions(patientId) {
  const cfg = getAzureReplayConfig();
  if (!cfg) return [];

  const { account, container, sas } = cfg;

  try {
    // List blobs with prefix
    const listUrl = `https://${account}.blob.core.windows.net/${container}?${sas}&restype=container&comp=list&prefix=${patientId}/history/`;

    const response = await fetch(listUrl);
    if (!response.ok) return [];

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const blobs = xml.querySelectorAll('Blob > Name');

    const sessions = [];
    for (const blob of blobs) {
      const blobPath = blob.textContent;
      if (blobPath.endsWith('.json')) {
        const url = buildBlobUrl(account, container, blobPath, sas);
        const metaResponse = await fetch(url);
        if (metaResponse.ok) {
          const metadata = await metaResponse.json();
          sessions.push(metadata);
        }
      }
    }

    return sessions.sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return [];
  }
}

/**
 * Delete a session video and its metadata
 *
 * @param {string} patientId - Patient identifier
 * @param {string} videoPath - Path to the video blob
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteSessionReplay(patientId, videoPath) {
  const cfg = getAzureReplayConfig();
  if (!cfg) {
    return { success: false, error: 'Azure Storage not configured' };
  }

  const { account, container, sas } = cfg;

  try {
    const videoUrl = buildBlobUrl(account, container, videoPath, sas);
    const response = await fetch(videoUrl, {
      method: 'DELETE',
      headers: {
        'x-ms-delete-snapshots': 'include',
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}
