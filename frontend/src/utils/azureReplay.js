/**
 * Load Azure-hosted session replay metadata (written by VoiceCanvas).
 * Requires the same SAS read permissions as the upload (or a read-only SAS on the container).
 */

function normalizeSas(sas) {
  if (!sas) return '';
  const t = String(sas).trim();
  return t.startsWith('?') ? t.slice(1) : t;
}

export function getAzureReplayConfig() {
  const account = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT?.trim();
  const container = import.meta.env.VITE_AZURE_STORAGE_CONTAINER?.trim();
  const sas = normalizeSas(import.meta.env.VITE_AZURE_STORAGE_SAS);
  if (!account || !container || !sas) return null;
  return { account, container, sas };
}

export function buildBlobUrl(account, container, blobPath, sas) {
  const q = normalizeSas(sas);
  const path = blobPath.split('/').map(encodeURIComponent).join('/');
  return `https://${account}.blob.core.windows.net/${container}/${path}?${q}`;
}

/**
 * Fetches {patientId}/latest-replay.json from Azure.
 * @returns {{ meta: object | null, banner: { kind: string, text: string } }}
 */
export async function fetchLatestReplayMetaDetailed(patientId) {
  const cfg = getAzureReplayConfig();
  if (!cfg || !patientId) {
    return {
      meta: null,
      banner: {
        kind: 'no_env',
        text: 'Sample video: add VITE_AZURE_STORAGE_ACCOUNT, VITE_AZURE_STORAGE_CONTAINER, and VITE_AZURE_STORAGE_SAS to doctor-saas/frontend/.env, restart npm run dev.',
      },
    };
  }
  const { account, container, sas } = cfg;
  const path = `${patientId}/latest-replay.json`;
  const url = buildBlobUrl(account, container, path, sas);
  try {
    const res = await fetch(url);
    if (res.status === 404) {
      return {
        meta: null,
        banner: {
          kind: 'missing_blob',
          text: `No Azure replay for patient "${patientId}" yet. In VoiceCanvas use VITE_VOICECANVAS_PATIENT_ID=${patientId}, complete a session, then refresh this page. Blob path: ${path}`,
        },
      };
    }
    if (!res.ok) {
      return {
        meta: null,
        banner: {
          kind: 'http',
          text: `Could not read latest-replay.json (HTTP ${res.status}). Check SAS read permission and expiry.`,
        },
      };
    }
    const json = await res.json();
    if (!json?.videoPath && !json?.drawingPath) {
      return {
        meta: null,
        banner: {
          kind: 'bad_meta',
          text: 'latest-replay.json exists but has no videoPath or drawingPath.',
        },
      };
    }
    const parts = [json.videoPath && 'video', json.drawingPath && 'drawing'].filter(Boolean);
    return {
      meta: json,
      banner: {
        kind: 'azure',
        text: `Loaded from Azure: ${parts.join(' + ') || 'metadata'}.`,
      },
    };
  } catch (e) {
    return {
      meta: null,
      banner: {
        kind: 'network',
        text: `Network/CORS error loading Azure metadata: ${e?.message || String(e)}. Ensure Blob CORS allows GET from this origin (${typeof window !== 'undefined' ? window.location.origin : ''}).`,
      },
    };
  }
}

/** Fetches {patientId}/latest-replay.json from Azure (meta only). */
export async function fetchLatestReplayMeta(patientId) {
  const { meta } = await fetchLatestReplayMetaDetailed(patientId);
  return meta;
}

/** @returns {Promise<Array<object>>} newest first */
export async function fetchSessionsManifest(patientId) {
  const cfg = getAzureReplayConfig();
  if (!cfg || !patientId) return [];
  const path = `${patientId}/sessions-manifest.json`;
  const url = buildBlobUrl(cfg.account, cfg.container, path, cfg.sas);
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const j = await res.json();
    return Array.isArray(j.sessions) ? j.sessions : [];
  } catch {
    return [];
  }
}

async function putBlockBlob(url, body, contentType) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': contentType || 'application/json',
    },
    body: typeof body === 'string' ? body : body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `PUT ${res.status}`);
  }
}

async function deleteBlobIfExists(account, container, blobPath, sas) {
  const url = buildBlobUrl(account, container, blobPath, sas);
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `DELETE ${res.status}`);
  }
}

/**
 * Deletes one session's video + drawing, updates manifest + latest-replay.
 * SAS must include delete permission on blobs. Blob CORS must allow DELETE.
 */
export async function deleteAzureSession(patientId, sessionId) {
  const cfg = getAzureReplayConfig();
  if (!cfg) throw new Error('Azure is not configured');
  const { account, container, sas } = cfg;

  const manifestPath = `${patientId}/sessions-manifest.json`;
  const manifestUrl = buildBlobUrl(account, container, manifestPath, sas);
  const mRes = await fetch(manifestUrl);

  if (mRes.status === 404) {
    const latestPath = `${patientId}/latest-replay.json`;
    const latestUrl = buildBlobUrl(account, container, latestPath, sas);
    const lrRes = await fetch(latestUrl);
    if (!lrRes.ok) throw new Error('No sessions manifest or latest-replay.json');
    const latest = await lrRes.json();
    if (String(latest.sessionId) !== String(sessionId)) {
      throw new Error('Session not found. Upload again from VoiceCanvas to create sessions-manifest.json.');
    }
    for (const p of [latest.videoPath, latest.drawingPath].filter(Boolean)) {
      await deleteBlobIfExists(account, container, p, sas);
    }
    await deleteBlobIfExists(account, container, latestPath, sas);
    return;
  }

  if (!mRes.ok) throw new Error('Could not read sessions manifest');
  const doc = await mRes.json();
  const sessions = Array.isArray(doc.sessions) ? doc.sessions : [];
  const victim = sessions.find((s) => String(s.sessionId) === String(sessionId));
  if (!victim) throw new Error('Session not found in manifest');

  for (const p of [victim.videoPath, victim.drawingPath].filter(Boolean)) {
    await deleteBlobIfExists(account, container, p, sas);
  }

  const remaining = sessions.filter((s) => String(s.sessionId) !== String(sessionId));
  const newDoc = {
    patientId,
    sessions: remaining,
    updatedAt: new Date().toISOString(),
  };
  await putBlockBlob(manifestUrl, JSON.stringify(newDoc), 'application/json');

  const latestPath = `${patientId}/latest-replay.json`;
  const latestUrl = buildBlobUrl(account, container, latestPath, sas);
  if (remaining.length === 0) {
    await deleteBlobIfExists(account, container, latestPath, sas);
  } else {
    const top = remaining[0];
    const latestPayload = {
      patientId,
      sessionId: top.sessionId,
      promptTitle: top.promptTitle ?? '',
      promptId: top.promptId ?? '',
      sessionDate: top.sessionDate ?? new Date().toISOString(),
      stressScore: top.stressScore ?? null,
      patientName: top.patientName ?? null,
      videoPath: top.videoPath ?? null,
      drawingPath: top.drawingPath ?? null,
      source: 'voicecanvas',
    };
    await putBlockBlob(latestUrl, JSON.stringify(latestPayload), 'application/json');
  }
}
