# Complete Data Architecture Guide

## Overview

Your VoiceCanvas system uses a **hybrid storage architecture**:
- **MongoDB** → Structured data (patient profiles, session metadata, clinical notes)
- **Azure Blob Storage** → Media files (videos, images, PDFs)

This is the industry-standard approach for applications with both structured data and large media files.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   VoiceCanvas Patient App                   │
│              (Records video, captures drawing)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ├──────────────┬────────────────┐
                        ▼              ▼                ▼
              ┌─────────────┐  ┌──────────────┐  ┌──────────┐
              │   MongoDB   │  │ Azure Blob   │  │ Frontend │
              │  (Patient   │  │  (Videos &   │  │ (Doctor  │
              │   Data)     │  │  Drawings)   │  │ Dashboard│
              └─────────────┘  └──────────────┘  └──────────┘
                     │                 │                │
                     └────────┬────────┴────────────────┘
                              ▼
                    ┌──────────────────┐
                    │   Backend API    │
                    │  (Flask/Node.js) │
                    └──────────────────┘
```

---

## 📊 MongoDB Collections

### 1. `patients` Collection

**Purpose:** Store patient profiles and aggregate statistics

```javascript
{
  _id: ObjectId("..."),
  patientId: "pt-001",               // Unique patient ID
  name: "Maria Santos",
  age: 8,
  diagnosis: "Selective Mutism",
  avatar: "👧",
  languageLabel: "Spanish (primary), English (fluent)",
  communicationLevel: "Non-verbal",
  isNonverbal: true,
  insuranceProvider: "Anthem Blue Cross",
  riskLevel: "high",                 // low, moderate, high (auto-calculated)
  email: "maria.santos@example.com",
  phone: "+1-555-0123",

  // Azure Storage references (NOT the files themselves!)
  latestSessionVideo: "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/session-123.mp4",
  profileImageUrl: null,

  // Aggregate statistics (auto-calculated)
  totalSessions: 12,
  avgStressScore: 6.8,
  lastSessionDate: ISODate("2026-03-28T10:30:00Z"),

  // Metadata
  createdAt: ISODate("2026-01-15T08:00:00Z"),
  updatedAt: ISODate("2026-03-28T10:35:00Z")
}
```

**Indexes:**
- `patientId` (unique)
- `name`
- `riskLevel`
- `createdAt`

---

### 2. `sessions` Collection

**Purpose:** Store session metadata and clinical observations

```javascript
{
  _id: ObjectId("..."),
  sessionId: "session-123",
  patientId: "pt-001",               // Foreign key to patients
  timestamp: ISODate("2026-03-28T10:30:00Z"),
  promptId: "safe_place",
  promptTitle: "Draw your safe place",

  // Clinical data
  stressScore: 7.5,                  // 0-10 scale
  crisisFlag: false,
  personalStatementEn: "I feel worried about school. My stomach hurts...",
  personalStatementOriginal: "Me siento preocupada por la escuela...",
  feedbackShort: "Drawing suggests isolation and somatic anxiety",

  // Drawing indicators
  indicators: {
    isolation: 3,                    // 0-5 scale
    redPct: 45,                      // 0-100%
    somatic: true,
    linePressure: "heavy"            // light, medium, heavy, asymmetric
  },

  // Azure Storage URLs (references only!)
  videoUrl: "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/session-123.mp4",
  drawingUrl: "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/drawing-123.png",
  thumbnailUrl: "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/thumb-123.jpg",

  // Emotion timeline (from webcam AI analysis)
  emotionTimeline: [
    {
      time: 0,
      label: "Session Start",
      emotion: "neutral",
      confidence: 0.89,
      valence: 0.5,
      arousal: 0.3,
      notes: "Patient begins drawing, appears calm"
    },
    {
      time: 45,
      label: "Emotional Shift",
      emotion: "sadness",
      confidence: 0.92,
      valence: 0.25,
      arousal: 0.4,
      notes: "Suppressed crying detected, jaw tension"
    }
    // ... more emotion events
  ],

  // Caregiver note
  caregiverNote: {
    skippedMeals: 2,
    sleep: "Woke 3× last night",
    meltdowns: 1
  },

  // Metadata
  duration: 180,                     // seconds
  createdAt: ISODate("2026-03-28T10:30:00Z"),
  updatedAt: ISODate("2026-03-28T10:35:00Z")
}
```

**Indexes:**
- `sessionId` (unique)
- `patientId` + `timestamp` (compound index for patient session history)
- `stressScore`
- `crisisFlag`
- `timestamp`

---

### 3. `clinical_notes` Collection

**Purpose:** Store SOAP clinical notes (separate from sessions for easier editing)

```javascript
{
  _id: ObjectId("..."),
  sessionId: "session-123",          // Foreign key to sessions
  patientId: "pt-001",               // Foreign key to patients

  // SOAP format
  subjective: "Patient reports increased anxiety about school. Caregiver notes 2 skipped meals...",
  objective: "Drawing shows figure isolated in corner (isolation score: 3). Heavy line pressure. 45% red color usage. Somatic indicators: stomach focus...",
  assessment: "Moderate to severe anxiety with somatic symptoms. Drawing patterns consistent with social withdrawal and physical distress...",
  plan: "Continue weekly sessions. Recommend consultation with pediatric GI to rule out physical causes. Collaborate with school counselor...",

  updatedAt: ISODate("2026-03-28T11:00:00Z")
}
```

**Indexes:**
- `sessionId`
- `patientId`

---

### 4. `appeals` Collection (Already Exists)

**Purpose:** Insurance claim appeals tracking

```javascript
{
  tracking_id: "TICK-12345-A",
  patient_id: "pt-001",
  insurer_name: "Anthem Blue Cross",
  appeal_text: "...",
  win_probability: 0.87,
  status: "submitted",
  created_at: ISODate("2026-03-28T12:00:00Z")
  // ... more appeal fields
}
```

---

## 🗄️ Azure Blob Storage Structure

### Container: `session-replays`

```
session-replays/
├── pt-001/
│   ├── latest-replay.json          ← Latest session metadata (for quick fetch)
│   ├── session-123.mp4             ← Session video
│   ├── drawing-123.png             ← Drawing image
│   ├── thumb-123.jpg               ← Thumbnail
│   └── history/
│       ├── session-123.json        ← Historical metadata #1
│       ├── session-124.json        ← Historical metadata #2
│       └── ...
├── pt-002/
│   ├── latest-replay.json
│   ├── session-456.mp4
│   └── ...
└── exports/                        ← PDF/FHIR exports (optional)
    ├── pt-001-clinical-report-2026-03-28.pdf
    └── pt-001-fhir-bundle.json
```

### Metadata JSON Format

**File:** `pt-001/latest-replay.json`

```json
{
  "videoPath": "pt-001/session-123.mp4",
  "sessionId": "session-123",
  "sessionDate": "2026-03-28T10:30:00Z",
  "promptTitle": "Draw your safe place",
  "stressScore": 7.5,
  "emotionTimeline": [
    {
      "time": 0,
      "emotion": "neutral",
      "confidence": 0.89,
      "valence": 0.5
    }
  ],
  "uploadedAt": "2026-03-28T10:35:00Z"
}
```

---

## 🔄 Complete Data Flow

### 1. Patient Records Session

```
VoiceCanvas Patient App
  ↓
Records video + captures drawing + voice input
  ↓
Processes with AI (stress analysis, emotion detection)
  ↓
Uploads to Azure Blob Storage
  ↓
Creates session record in MongoDB
```

**Code Example:**

```javascript
// Step 1: Upload video to Azure
import { uploadSessionReplay } from './utils/azureUpload';

const videoBlob = await recorder.getBlob();
const azureResult = await uploadSessionReplay('pt-001', videoBlob, {
  sessionId: 'session-123',
  sessionDate: new Date().toISOString(),
  promptTitle: 'Draw your safe place',
  stressScore: 7.5,
  emotionTimeline: emotionData
});

// Step 2: Save session metadata to MongoDB
const response = await fetch('http://localhost:5002/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-123',
    patientId: 'pt-001',
    promptId: 'safe_place',
    promptTitle: 'Draw your safe place',
    stressScore: 7.5,
    crisisFlag: false,
    personalStatementEn: "I feel worried...",
    indicators: {
      isolation: 3,
      redPct: 45,
      somatic: true,
      linePressure: 'heavy'
    },
    videoUrl: azureResult.videoUrl,  // Reference to Azure blob
    emotionTimeline: emotionData
  })
});
```

---

### 2. Doctor Views Patient

```
Doctor Dashboard Frontend
  ↓
Fetches patient data from MongoDB API
  ↓
GET /api/patients/pt-001
  ↓
Receives patient profile + session metadata (with Azure URLs)
  ↓
Renders Session Replay with video from Azure
```

**Code Example:**

```javascript
// Fetch patient data from MongoDB
const patientResponse = await fetch('http://localhost:5002/api/patients/pt-001');
const { patient } = await patientResponse.json();

// Fetch patient sessions
const sessionsResponse = await fetch('http://localhost:5002/api/patients/pt-001/sessions');
const { sessions } = await sessionsResponse.json();

// Video URL is in the session object
const videoUrl = sessions[0].videoUrl;
// → "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/session-123.mp4"

// Display in video player
<video src={videoUrl} controls />
```

---

## 🚀 Getting Started

### 1. Install MongoDB

**Option A: Local (for development)**

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# Download installer from https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (cloud, free tier)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 tier)
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

---

### 2. Update Backend Environment

Edit `backend/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/
MONGODB_PATIENTS_DB=voicecanvas_patients

# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

---

### 3. Install Python Dependencies

```bash
cd backend
pip install pymongo flask flask-cors
```

---

### 4. Start Patient API

```bash
cd backend
python patient_api.py
```

API will run on http://localhost:5002

---

### 5. Test the API

```bash
# Create a patient
curl -X POST http://localhost:5002/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "pt-001",
    "name": "Maria Santos",
    "age": 8,
    "diagnosis": "Selective Mutism",
    "insuranceProvider": "Anthem Blue Cross"
  }'

# Get patient
curl http://localhost:5002/api/patients/pt-001

# Create a session
curl -X POST http://localhost:5002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "patientId": "pt-001",
    "promptId": "safe_place",
    "promptTitle": "Draw your safe place",
    "stressScore": 7.5,
    "videoUrl": "https://nepusahack26.blob.core.windows.net/session-replays/pt-001/session-123.mp4"
  }'

# Get patient sessions
curl http://localhost:5002/api/patients/pt-001/sessions
```

---

## 📊 MongoDB vs Azure: What Goes Where?

### ✅ Store in MongoDB:
- Patient profiles (name, age, diagnosis)
- Session metadata (date, stress score, crisis flags)
- Clinical notes (SOAP format)
- Drawing indicators (isolation score, color %, line pressure)
- Personal statements (text)
- Caregiver notes (text)
- Emotion timeline data (JSON arrays)
- Insurance appeal records
- **References/URLs to Azure files** (not the files themselves!)

### ✅ Store in Azure Blob Storage:
- Session videos (.mp4)
- Drawing images (.png, .jpg)
- Thumbnails (.jpg)
- PDF exports (.pdf)
- FHIR documents (.json)
- Audio recordings (.mp3, .wav)
- Any file > 1MB

### ❌ Never Store in MongoDB:
- Video files
- Large images
- Audio files
- PDFs
- Any binary data > 16MB (MongoDB document limit)

### ❌ Never Store in Azure Blob Storage:
- Patient names, ages, diagnoses
- Searchable metadata
- Relationships between entities
- Data that needs complex queries
- Real-time updates

---

## 🔍 Example Queries

### Find high-risk patients with recent crisis events

```python
from patient_database import PatientDatabaseService

db = PatientDatabaseService('mongodb://localhost:27017/', 'voicecanvas_patients')

# Get high-risk patients
high_risk = db.get_high_risk_patients()

for patient in high_risk:
    # Get their crisis sessions
    crisis_sessions = db.get_crisis_sessions(patient['patientId'])

    if crisis_sessions:
        print(f"{patient['name']}: {len(crisis_sessions)} crisis events")

        # Play video from Azure for most recent crisis
        latest_crisis = crisis_sessions[0]
        print(f"Video URL: {latest_crisis['videoUrl']}")
```

---

## 💰 Cost Comparison

### MongoDB (Local)
- **Cost:** FREE
- **Storage:** Limited by your disk
- **Performance:** Fast (local network)
- **Backups:** Manual

### MongoDB Atlas (Cloud Free Tier)
- **Cost:** FREE up to 512MB storage
- **Storage:** 512MB (enough for ~10,000 patient records)
- **Performance:** Fast (global CDN)
- **Backups:** Automatic

### Azure Blob Storage
- **Cost:** ~$0.02/GB/month (Hot tier)
- **Example:** 100 videos × 10MB = 1GB = **$0.02/month**
- **Bandwidth:** First 5GB free, then $0.087/GB

**For your hackathon: Both are essentially FREE ✅**

---

## 🔐 Security Best Practices

1. **Never store API keys in MongoDB**
   - Use environment variables
   - Use Azure Key Vault for production

2. **Encrypt sensitive patient data**
   - Use MongoDB Client-Side Field Level Encryption (FLE)
   - Encrypt PHI (Protected Health Information) at rest

3. **Use SAS tokens with expiry**
   - Your current token expires March 31, 2026
   - Use read-only tokens for public access
   - Use write tokens only in backend

4. **Implement access control**
   - Use MongoDB RBAC (Role-Based Access Control)
   - Separate read/write users
   - Audit all database access

---

## ✅ Summary

| **What** | **MongoDB** | **Azure Blob Storage** |
|----------|-------------|------------------------|
| Patient profiles | ✅ | ❌ |
| Session metadata | ✅ | ❌ |
| Clinical notes | ✅ | ❌ |
| Video files | ❌ | ✅ |
| Drawing images | ❌ | ✅ |
| PDF exports | ❌ | ✅ |
| Search & queries | ✅ | ❌ |
| Relationships | ✅ | ❌ |
| Large files | ❌ | ✅ |
| Cost | FREE (local) | ~$0.02/GB/month |

---

## 🎯 Next Steps

1. ✅ Start MongoDB locally or create Atlas account
2. ✅ Run `python patient_api.py` to start API
3. ✅ Test API with curl commands above
4. ✅ Update frontend to use real API instead of mock data
5. ✅ Integrate with VoiceCanvas patient app

---

**Your architecture is production-ready and follows industry best practices! 🚀**
