/**
 * Text-to-Speech Service
 *
 * Provides voice playback using:
 * 1. ElevenLabs API (premium, natural voices)
 * 2. Browser SpeechSynthesis API (fallback)
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice (default)

/**
 * Play text using ElevenLabs TTS
 * @param {string} text - Text to speak
 * @param {Object} options - Voice options
 * @returns {Promise<void>}
 */
async function playWithElevenLabs(text, options = {}) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = options.voiceId || ELEVENLABS_VOICE_ID;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'ElevenLabs API error');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('[ElevenLabs] Error:', error);
    throw error;
  }
}

/**
 * Play text using browser SpeechSynthesis API (fallback)
 * @param {string} text - Text to speak
 * @param {Object} options - Voice options
 * @returns {Promise<void>}
 */
function playWithBrowserTTS(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Browser does not support speech synthesis'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = resolve;
    utterance.onerror = (e) => reject(new Error('Speech synthesis failed'));

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Main TTS function with automatic fallback
 * @param {string} text - Text to speak
 * @param {Object} options - Voice options
 * @param {boolean} options.preferElevenLabs - Try ElevenLabs first (default: true)
 * @returns {Promise<{success: boolean, method: string}>}
 */
export async function speakText(text, options = {}) {
  const preferElevenLabs = options.preferElevenLabs !== false;

  // Truncate very long text
  let spokenText = text;
  if (text.length > 500) {
    spokenText = text.substring(0, 500) + '...';
    console.log('[TTS] Text truncated to 500 characters');
  }

  // Try ElevenLabs first if preferred and API key exists
  if (preferElevenLabs && ELEVENLABS_API_KEY) {
    try {
      console.log('[TTS] Using ElevenLabs API');
      await playWithElevenLabs(spokenText, options);
      return { success: true, method: 'elevenlabs' };
    } catch (error) {
      console.warn('[TTS] ElevenLabs failed, falling back to browser TTS:', error.message);
    }
  }

  // Fallback to browser TTS
  try {
    console.log('[TTS] Using browser SpeechSynthesis');
    await playWithBrowserTTS(spokenText, options);
    return { success: true, method: 'browser' };
  } catch (error) {
    console.error('[TTS] All TTS methods failed:', error);
    return { success: false, method: 'none', error: error.message };
  }
}

/**
 * Stop any currently playing speech
 */
export function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if TTS is available
 * @returns {Object} Availability status
 */
export function checkTTSAvailability() {
  return {
    elevenlabs: Boolean(ELEVENLABS_API_KEY),
    browser: Boolean(window.speechSynthesis),
    any: Boolean(ELEVENLABS_API_KEY || window.speechSynthesis),
  };
}

/**
 * Generate clinical summary from session for TTS
 * @param {Object} session - Session object
 * @returns {string} Summary text
 */
export function generateClinicalSummary(session) {
  if (!session || !session.result) return '';

  const { result } = session;
  const parts = [];

  // Personal statement (English)
  if (result.personal_statement_en) {
    parts.push(`Patient statement: ${result.personal_statement_en}`);
  }

  // Stress score
  if (result.stress_score !== undefined) {
    const level = result.stress_score >= 7 ? 'high stress' : result.stress_score >= 5 ? 'moderate stress' : 'low stress';
    parts.push(`Stress score: ${result.stress_score} out of 10, indicating ${level}.`);
  }

  // Crisis flag
  if (result.crisis_flag) {
    parts.push('Crisis indicators present.');
  }

  // Clinical note assessment (most relevant part)
  if (result.clinical_note?.assessment) {
    parts.push(`Clinical assessment: ${result.clinical_note.assessment}`);
  }

  return parts.join(' ');
}

export default {
  speakText,
  stopSpeech,
  checkTTSAvailability,
  generateClinicalSummary,
};
