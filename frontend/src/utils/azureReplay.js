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

/** Fetches {patientId}/latest-replay.json from Azure. */
export async function fetchLatestReplayMeta(patientId) {
  const cfg = getAzureReplayConfig();
  if (!cfg || !patientId) return null;
  const { account, container, sas } = cfg;
  const path = `${patientId}/latest-replay.json`;
  const url = buildBlobUrl(account, container, path, sas);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
