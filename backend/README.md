# VoiceCanvas Backend

Two backend services for the VoiceCanvas ecosystem:

1. **Node.js API** (`server.js`) - General patient/session management
2. **Python Flask API** (`app.py`) - **Reclaimant Appeal System** (Production-ready)

---

## 🚀 Reclaimant Flask API (Primary - For Appeals)

Production-ready Flask server with **MongoDB**, **Gmail API**, and **OpenAI** integration for automated insurance appeal submissions.

### Features

- **AI-Powered Denial Analysis**: OpenAI GPT-4o-mini analyzes denial reasons
- **Vector Similarity Search**: Semantic precedent matching using embeddings
- **Real Email Sending**: Gmail API for actual email delivery to insurers
- **MongoDB Database**: Full appeal tracking with status updates
- **RESTful API**: Complete API for frontend integration

### Tech Stack

- **Flask** (Python web framework)
- **MongoDB** (Document database)
- **Gmail API** (OAuth-authenticated email)
- **OpenAI API** (GPT-4o-mini + embeddings)
- **Python 3.9+**

### Quick Start (Flask API)

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Set up MongoDB (see setup section below)
brew install mongodb-community  # macOS
brew services start mongodb-community

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys (see configuration section)

# 4. Run Flask server
python app.py
```

Server will start on `http://localhost:5001`

---

## Node.js API (Optional - For General Features)

RESTful API for the VoiceCanvas Clinic doctor-side application.

### Tech Stack

- **Node.js** + **Express.js** — API server
- **In-memory storage** (demo) — Would use PostgreSQL/MongoDB in production

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
# or
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-03-27T...",
  "service": "VoiceCanvas Clinic API"
}
```

### Get All Patients

```
GET /api/patients
```

Returns all patients with calculated alert badges.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "pt-001",
      "name": "Raju Karki",
      "connectionState": "accepted",
      "alerts": [
        {
          "type": "crisis",
          "label": "Crisis",
          "severity": "critical",
          "color": "red",
          "priority": 1
        }
      ],
      ...
    }
  ]
}
```

### Get Single Patient

```
GET /api/patients/:id
```

Returns a single patient with alerts.

### Get Patient Alerts

```
GET /api/patients/:id/alerts
```

Returns only the alert badges for a patient.

**Response:**
```json
{
  "success": true,
  "patientId": "pt-001",
  "alerts": [
    {
      "type": "crisis",
      "label": "Crisis",
      "severity": "critical",
      "color": "red",
      "priority": 1
    },
    {
      "type": "threshold",
      "label": "Clinical Threshold",
      "severity": "high",
      "color": "orange",
      "priority": 2,
      "detail": "4 sessions ≥ 7.0"
    }
  ]
}
```

### Accept Connection Request

```
POST /api/patients/:id/connection/accept
```

Accepts a pending patient connection request.

**Response:**
```json
{
  "success": true,
  "message": "Connection request accepted",
  "data": {
    "patientId": "pt-002",
    "connectionState": "accepted",
    "acceptedAt": "2025-03-27T..."
  }
}
```

### Get Overview Stats

```
GET /api/stats
```

Returns dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 5,
    "totalSessions": 26,
    "crisisAlerts": 2,
    "pendingConnections": 1,
    "timestamp": "2025-03-27T..."
  }
}
```

## Alert Badge Rules

The API calculates alert badges based on these clinical rules:

1. **Crisis** (Red 🚨)
   - Latest session stress ≥ 8.0 **OR**
   - Latest session has `crisis_flag: true`

2. **Clinical Threshold** (Orange ⚠️)
   - Stress ≥ 7.0 on **3 or more** sessions

3. **Improving** (Green ✓)
   - Stress declining for **2+ consecutive sessions**

4. **Pending Connection** (Blue 🔗)
   - Patient requested connection, not yet accepted by doctor

## Production Considerations

In production, this backend would:

- Connect to **PostgreSQL** or **MongoDB** for patient data persistence
- Use **Redis** for caching alert calculations
- Store session media (drawings, webcam frames) in **AWS S3**
- Implement **JWT authentication** for doctor accounts
- Add **rate limiting** and **API key** validation
- Use **WebSockets** for real-time updates when patients connect
- Comply with **HIPAA** security requirements
- Log all access via **CloudWatch** or similar

## Demo Note

This is a demo backend for the Nepal-US Hackathon 2026. The frontend currently uses **localStorage** for data persistence, so this backend is optional for demo purposes. However, it demonstrates the production API architecture.

---

# Flask API (Reclaimant) - Complete Documentation

## Configuration

### 1. Environment Variables

Edit `.env` with your credentials:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=voicecanvas_appeals

# OpenAI (copy from frontend/.env)
OPENAI_API_KEY=sk-proj-...

# Google OAuth (copy from frontend/.env)
GOOGLE_CLIENT_ID=331872035521-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=  # See token generation below

# Email Configuration
DEMO_MODE=true  # Set to true for safe testing
TEST_EMAIL=your-test-email@gmail.com  # Receives all demo emails
```

### 2. Get Gmail Refresh Token

**Method: OAuth Playground**
1. Visit https://developers.google.com/oauthplayground/
2. Click settings ⚙️ → Check "Use your own OAuth credentials"
3. Enter your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
4. Select `Gmail API v1` → `https://www.googleapis.com/auth/gmail.send`
5. Click "Authorize APIs" → Sign in
6. Click "Exchange authorization code for tokens"
7. Copy `refresh_token` to `.env`

### 3. MongoDB Setup

**Local (Recommended):**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Cloud (MongoDB Atlas):**
1. Create free cluster: https://www.mongodb.com/cloud/atlas
2. Get connection string
3. Update `MONGODB_URI` in `.env`

## API Endpoints

### 1. Health Check
```
GET /health
Response: { "status": "healthy", "service": "VoiceCanvas Reclaimant API" }
```

### 2. Analyze Denial (AI)
```
POST /api/analyze-denial
Body: {
  "denialText": "Insufficient medical necessity documentation...",
  "denialCode": "MN-4021"
}
Response: {
  "success": true,
  "analysis": {
    "category": "Medical Necessity",
    "code": "MN",
    "regulation": "MHPAEA § 712(c)(3)",
    "parityImplication": "Medical necessity criteria must be comparable",
    "severity": "high",
    "keyPhrases": ["medical necessity", "insufficient"]
  }
}
```

### 3. Match Precedents (Vector Search)
```
POST /api/match-precedents
Body: {
  "denialText": "Not medically necessary...",
  "precedents": [{case: "Wit v. UBH", relevance: "..."}],
  "topK": 5
}
Response: {
  "success": true,
  "matched_precedents": [
    {case: "...", similarity: 0.87, winRate: 78, ...}
  ]
}
```

### 4. Submit Appeal (Real Email)
```
POST /api/submit-appeal
Body: {
  "patient_id": "1",
  "patient_name": "John Doe",
  "insurer_id": "united",
  "insurer_name": "UnitedHealthcare",
  "claim_id": "CLM-12345",
  "denial_code": "MN-4021",
  "denial_reason": "Insufficient documentation",
  "appeal_text": "FORMAL APPEAL LETTER TEXT...",
  "win_probability": 75,
  "estimated_recovery": 4800,
  "violations": [...],
  "precedents": [...]
}
Response: {
  "success": true,
  "tracking_id": "TICK-45612-A",
  "email_sent": true,
  "email_message_id": "abc123...",
  "sent_to": "appeals@uhc.com",
  "message": "Appeal submitted and email sent successfully"
}
```

### 5. Get Appeal Status
```
GET /api/appeal-status/<tracking_id>
Response: {
  "success": true,
  "appeal": {
    "tracking_id": "TICK-45612-A",
    "patient_name": "John Doe",
    "status": "Under Review",
    "created_at": "2024-01-15T10:30:00Z",
    ...
  },
  "history": [
    {status: "Submitted", timestamp: "...", notes: "..."},
    {status: "Under Review", timestamp: "...", notes: "..."}
  ]
}
```

### 6. Get Patient Appeals
```
GET /api/patient-appeals/<patient_id>
Response: {
  "success": true,
  "appeals": [...],
  "count": 5
}
```

### 7. Update Status
```
POST /api/update-appeal-status
Body: {
  "tracking_id": "TICK-45612-A",
  "status": "Approved",
  "notes": "Insurer approved appeal"
}
Response: {
  "success": true,
  "message": "Status updated successfully"
}
```

### 8. Get Statistics
```
GET /api/statistics
Response: {
  "success": true,
  "statistics": {
    "total_appeals": 100,
    "submitted": 40,
    "under_review": 30,
    "approved": 20,
    "denied": 10,
    "total_estimated_recovery": 480000,
    "approval_rate": 20.0
  }
}
```

## Database Schema

### appeals Collection
```javascript
{
  tracking_id: "TICK-45612-A",
  patient_id: "1",
  patient_name: "John Doe",
  insurer_id: "united",
  insurer_name: "UnitedHealthcare",
  claim_id: "CLM-12345",
  denial_code: "MN-4021",
  denial_reason: "Insufficient documentation",
  appeal_text: "FORMAL APPEAL LETTER...",
  win_probability: 75,
  estimated_recovery: 4800,
  violations: [{type: "...", severity: "high"}],
  precedents: [{case: "...", winRate: 78}],
  email_sent: true,
  email_to: "appeals@uhc.com",
  email_message_id: "abc123...",
  status: "Submitted",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z"
}
```

### status_updates Collection
```javascript
{
  tracking_id: "TICK-45612-A",
  status: "Under Review",
  notes: "Insurer acknowledged receipt",
  timestamp: "2024-01-16T14:20:00Z"
}
```

## Demo Mode vs Production

**Demo Mode** (`DEMO_MODE=true`):
- All emails sent to `TEST_EMAIL`
- Safe for hackathon demos
- No risk of sending to real insurers

**Production Mode** (`DEMO_MODE=false`):
- Emails sent to actual insurer addresses
- **USE CAREFULLY** - these are real legal appeals
- Only use for actual claim appeals

## Costs & Quotas

- **MongoDB**: Free (local) or $0/month (Atlas free tier)
- **Gmail API**: Free unlimited sending
- **OpenAI API**: ~$0.002 per appeal
  - Denial analysis: $0.0001
  - Vector embeddings: $0.0003
  - Appeal generation: $0.0015

**Total cost: < $0.01 per appeal**

## Troubleshooting

**MongoDB Connection Error:**
```
Solution: brew services start mongodb-community
```

**Gmail Authentication Error:**
```
Solution: Regenerate refresh token in OAuth Playground
```

**OpenAI API Error:**
```
Solution: Copy correct API key from frontend/.env
```

## Security

- Never commit `.env` (already in `.gitignore`)
- Use `DEMO_MODE=true` for all demos
- Rotate API keys after hackathon
- In production, implement proper OAuth flow

---

## Running Both Servers

**Terminal 1 (Node.js - Optional):**
```bash
npm install
npm start  # Runs on port 3001
```

**Terminal 2 (Flask - Required for Appeals):**
```bash
pip install -r requirements.txt
python app.py  # Runs on port 5001
```
