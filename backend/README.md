# VoiceCanvas Clinic — Backend API

RESTful API for the VoiceCanvas Clinic doctor-side application.

## Tech Stack

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
