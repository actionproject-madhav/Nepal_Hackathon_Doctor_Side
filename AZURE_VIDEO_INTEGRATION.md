# Azure Blob Storage - Session Video Integration Guide

## Overview

Your Session Replay feature is now fully integrated with Azure Blob Storage. Videos recorded by VoiceCanvas patients can be uploaded to Azure and automatically played back in the clinician dashboard's Session Replay viewer.

---

## 🎯 How It Works

### Architecture

```
VoiceCanvas Patient App (records video)
           ↓
    Upload to Azure Blob Storage
           ↓
    Azure: /session-replays/{patientId}/latest-replay.json
    Azure: /session-replays/{patientId}/session-*.mp4
           ↓
    Doctor Dashboard fetches video URL
           ↓
    Session Replay Player displays video with emotion timeline
```

### File Structure in Azure

```
session-replays/                    (container)
├── pt-001/
│   ├── latest-replay.json          ← Current session metadata
│   ├── session-xxx.mp4             ← Current session video
│   └── history/
│       ├── session-1234567890.json ← Historical session #1
│       ├── session-1234567891.json ← Historical session #2
│       └── ...
├── pt-002/
│   ├── latest-replay.json
│   ├── session-yyy.mp4
│   └── history/...
└── ...
```

---

## ⚙️ Configuration

### Frontend Environment Variables

Already configured in `/frontend/.env`:

```env
VITE_AZURE_STORAGE_ACCOUNT=nepusahack26
VITE_AZURE_STORAGE_CONTAINER=session-replays
VITE_AZURE_STORAGE_SAS=sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiytfx&se=2026-03-31T00:13:39Z&st=2026-03-28T15:58:39Z&spr=https,http&sig=b%2B%2FEQMnY95qkPsUc4Rs3YmWCMI%2F4GlsobA8ZukzzvIQ%3D
VITE_VOICECANVAS_PATIENT_ID=pt-001
```

**SAS Token Permissions Required:**
- ✅ Read
- ✅ Write
- ✅ Create
- ✅ List
- ⏰ Expires: March 31, 2026

---

## 🧪 Testing the Integration

### Step 1: Test Azure Connection

```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173/test-azure.html

This test page allows you to:
1. ✅ Verify Azure credentials are loaded
2. ✅ Test connection to Azure Blob Storage
3. ✅ Upload a test video file
4. ✅ Fetch and play back the uploaded video

### Step 2: Upload a Test Video

1. Select any MP4 video file (or record a quick test using your phone)
2. Set Patient ID: `pt-001`
3. Set Session ID: `test-session-1`
4. Set Prompt Title: `Test Drawing Session`
5. Set Stress Score: `5.5`
6. Click "Upload to Azure"

The video will be uploaded to:
- Video: `session-replays/pt-001/session-test-session-1-{timestamp}.mp4`
- Metadata: `session-replays/pt-001/latest-replay.json`

### Step 3: View in Session Replay

Navigate to: http://localhost:5173/replay/pt-001

The Session Replay page will:
1. Fetch `latest-replay.json` from Azure
2. Extract the `videoPath`
3. Build the video URL with SAS token
4. Display the video with emotion timeline overlay

---

## 📤 Upload API Usage

### From VoiceCanvas Patient App

Use the upload utility in your patient-facing app:

```javascript
import { uploadSessionReplay } from './utils/azureUpload';

// After recording session video
const videoBlob = await recordedVideo.getBlob();

const result = await uploadSessionReplay('pt-001', videoBlob, {
  sessionId: 'session-123',
  sessionDate: new Date().toISOString(),
  promptTitle: 'Draw your safe place',
  stressScore: 7.5,
  emotionTimeline: [
    {
      time: 0,
      emotion: 'neutral',
      confidence: 0.89,
      valence: 0.5,
      arousal: 0.3,
      notes: 'Session start - calm baseline'
    },
    // ... more emotion events
  ]
});

if (result.success) {
  console.log('✅ Video uploaded:', result.videoUrl);
} else {
  console.error('❌ Upload failed:', result.error);
}
```

### Metadata JSON Format

The `latest-replay.json` file contains:

```json
{
  "videoPath": "pt-001/session-xxx.mp4",
  "sessionId": "session-123",
  "sessionDate": "2026-03-28T12:34:56.789Z",
  "promptTitle": "Draw your safe place",
  "stressScore": 7.5,
  "emotionTimeline": [
    {
      "time": 0,
      "label": "Session Start",
      "emotion": "neutral",
      "confidence": 0.89,
      "valence": 0.5,
      "arousal": 0.3,
      "notes": "Patient begins drawing, appears calm"
    }
  ],
  "uploadedAt": "2026-03-28T12:35:10.123Z"
}
```

---

## 🎬 Session Replay Features

Once videos are in Azure, the Session Replay page displays:

### Left Panel - Video Player
- ▶️ HTML5 video player with Azure Blob source
- 🎨 Real-time emotion overlay (if `emotionTimeline` provided)
- 📊 Emotion timeline bar (color-coded by emotion)
- 📈 Session analysis card with:
  - Dominant emotion
  - Emotional range
  - Valence shift (positive/negative)
  - Peak stress moment
  - Peak positive moment
  - Smile detection count

### Right Panel - Timeline & Snapshots
- 📅 Clickable emotion timeline with detailed events
- 🎯 Jump to specific moments by clicking timeline events
- 🖼️ Drawing snapshots gallery (if provided)

---

## 🔒 Security Notes

1. **SAS Token Expiry**: Current token expires March 31, 2026
   - After expiry, generate a new SAS token in Azure Portal
   - Update `VITE_AZURE_STORAGE_SAS` in `.env`

2. **CORS Configuration**: Azure Blob Storage must allow your domain
   - In Azure Portal: Storage Account → Settings → CORS
   - Add allowed origin: `http://localhost:5173` (dev)
   - Add allowed origin: `https://yourdomain.com` (production)

3. **SAS Permissions**: Limit to minimum required
   - Read: ✅ (fetch videos)
   - Write: ✅ (upload videos)
   - Delete: ❌ (optional, for admin cleanup only)

---

## 🚀 Production Deployment

### 1. Update Frontend Environment

In production `.env`:

```env
VITE_AZURE_STORAGE_ACCOUNT=nepusahack26
VITE_AZURE_STORAGE_CONTAINER=session-replays
VITE_AZURE_STORAGE_SAS=<production-sas-token>
```

### 2. Configure CORS in Azure

Azure Portal → Storage Account → Settings → CORS:

| Allowed Origins | Allowed Methods | Allowed Headers | Max Age |
|----------------|-----------------|-----------------|---------|
| https://yourdomain.com | GET, PUT | * | 3600 |

### 3. Set Up CDN (Optional)

For better performance, add Azure CDN:
- Azure Portal → Create CDN endpoint
- Point to Blob Storage container
- Update `buildBlobUrl()` to use CDN domain

---

## 📊 Monitoring & Analytics

### Check Upload Success Rate

```javascript
import { listPatientSessions } from './utils/azureUpload';

const sessions = await listPatientSessions('pt-001');
console.log(`Patient pt-001 has ${sessions.length} recorded sessions`);
```

### View Storage Usage

Azure Portal → Storage Account → Monitoring → Metrics:
- Total blob size
- Number of blobs
- Transaction count
- Egress (bandwidth)

---

## 🛠️ Troubleshooting

### Video Not Playing

1. **Check SAS token**: Open browser DevTools → Network
   - Look for `403 Forbidden` errors
   - Verify SAS token hasn't expired
   - Check SAS permissions include Read

2. **Check CORS**: If cross-origin error:
   - Add your domain to Azure CORS settings
   - Include `http://localhost:5173` for dev

3. **Check video path**: Ensure `videoPath` in metadata matches actual blob

### Upload Fails

1. **Check SAS permissions**: Must include Write + Create
2. **Check file size**: Azure Blob supports up to 5 TB per blob
3. **Check network**: Large videos may timeout on slow connections

### Metadata Not Found

1. **Check patient ID**: Must match exactly (case-sensitive)
2. **Check file exists**: Visit Azure Portal → Storage Browser
3. **Check JSON format**: Ensure `latest-replay.json` is valid JSON

---

## 📚 API Reference

### `uploadSessionReplay(patientId, videoBlob, metadata)`

Uploads a session video and metadata to Azure.

**Parameters:**
- `patientId` (string): Patient identifier
- `videoBlob` (Blob): Video file
- `metadata` (object):
  - `sessionId` (string): Session identifier
  - `sessionDate` (string): ISO date
  - `promptTitle` (string): Drawing prompt
  - `stressScore` (number): 0-10
  - `emotionTimeline` (array): Optional emotion events

**Returns:** `Promise<{success, videoUrl?, error?}>`

### `listPatientSessions(patientId)`

Lists all historical sessions for a patient.

**Returns:** `Promise<Array<metadata>>` sorted by date (newest first)

### `deleteSessionReplay(patientId, videoPath)`

Deletes a session video and metadata.

**Returns:** `Promise<{success, error?}>`

---

## ✅ Quick Start Checklist

- [x] Azure credentials configured in `.env`
- [x] SAS token valid (check expiry date)
- [ ] CORS configured in Azure Portal
- [ ] Test page verified: http://localhost:5173/test-azure.html
- [ ] Test video uploaded successfully
- [ ] Session Replay displays video: http://localhost:5173/replay/pt-001

---

## 🎓 Next Steps

1. **Integrate with VoiceCanvas recording**: Add `uploadSessionReplay()` to patient app
2. **Add emotion detection**: Process webcam frames → generate `emotionTimeline`
3. **Implement session history**: Show list of all sessions in Patient Detail view
4. **Add download feature**: Allow doctors to download videos for offline review
5. **Implement video transcoding**: Convert videos to multiple qualities (360p/720p/1080p)

---

## 📞 Support

For Azure Storage issues:
- Azure Portal: https://portal.azure.com
- Storage Explorer: https://azure.microsoft.com/features/storage-explorer/
- Documentation: https://docs.microsoft.com/azure/storage/blobs/

For implementation help:
- Check `frontend/src/utils/azureReplay.js` for fetch logic
- Check `frontend/src/utils/azureUpload.js` for upload logic
- Check `frontend/src/pages/SessionReplay.jsx` for video player integration

---

**Status**: ✅ Fully Integrated and Ready for Testing
