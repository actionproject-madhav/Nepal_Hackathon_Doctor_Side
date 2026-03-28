/**
 * VoiceCanvas Clinic — Backend API
 *
 * Provides REST endpoints for:
 * - Patient data management
 * - Connection request handling
 * - Alert badge calculation
 * - Session data persistence
 *
 * Note: This is a demo backend. In production, this would connect to:
 * - PostgreSQL/MongoDB for patient data
 * - Redis for caching
 * - AWS S3 for session media storage
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory data store (demo only - would use database in production)
let patients = [];
let connectionRequests = [];

/**
 * Calculate alert badges for a patient
 */
function calculateAlerts(patient) {
  const alerts = [];

  if (!patient || !patient.sessions || patient.sessions.length === 0) {
    return alerts;
  }

  const sessions = patient.sessions;
  const latestSession = sessions[sessions.length - 1];

  // CRISIS: stress ≥ 8 OR crisis_flag on latest session
  if (latestSession.stressScore >= 8 || latestSession.result?.crisis_flag) {
    alerts.push({
      type: 'crisis',
      label: 'Crisis',
      severity: 'critical',
      color: 'red',
      priority: 1
    });
  }

  // THRESHOLD: stress ≥ 7 on 3+ sessions
  const highStressSessions = sessions.filter(s => s.stressScore >= 7);
  if (highStressSessions.length >= 3) {
    alerts.push({
      type: 'threshold',
      label: 'Clinical Threshold',
      severity: 'high',
      color: 'orange',
      priority: 2,
      detail: `${highStressSessions.length} sessions ≥ 7.0`
    });
  }

  // IMPROVING: stress down 2+ sessions in a row
  if (sessions.length >= 2) {
    let consecutiveDecreases = 0;
    for (let i = sessions.length - 1; i > 0; i--) {
      if (sessions[i].stressScore < sessions[i - 1].stressScore) {
        consecutiveDecreases++;
      } else {
        break;
      }
    }
    if (consecutiveDecreases >= 2) {
      alerts.push({
        type: 'improving',
        label: 'Improving',
        severity: 'positive',
        color: 'green',
        priority: 4,
        detail: `${consecutiveDecreases} sessions declining`
      });
    }
  }

  // PENDING CONNECTION
  if (patient.connectionState === 'pending') {
    alerts.push({
      type: 'pending_connection',
      label: 'Pending Connection',
      severity: 'info',
      color: 'blue',
      priority: 3
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

// ==================== API ROUTES ====================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VoiceCanvas Clinic API'
  });
});

/**
 * GET /api/patients
 * Get all patients with alert badges
 */
app.get('/api/patients', (req, res) => {
  const patientsWithAlerts = patients.map(patient => ({
    ...patient,
    alerts: calculateAlerts(patient)
  }));

  res.json({
    success: true,
    count: patientsWithAlerts.length,
    data: patientsWithAlerts
  });
});

/**
 * GET /api/patients/:id
 * Get single patient by ID
 */
app.get('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found'
    });
  }

  res.json({
    success: true,
    data: {
      ...patient,
      alerts: calculateAlerts(patient)
    }
  });
});

/**
 * GET /api/patients/:id/alerts
 * Get alert badges for a specific patient
 */
app.get('/api/patients/:id/alerts', (req, res) => {
  const { id } = req.params;
  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found'
    });
  }

  const alerts = calculateAlerts(patient);

  res.json({
    success: true,
    patientId: id,
    alerts
  });
});

/**
 * POST /api/patients/:id/connection/accept
 * Accept a pending connection request
 */
app.post('/api/patients/:id/connection/accept', (req, res) => {
  const { id } = req.params;
  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: 'Patient not found'
    });
  }

  if (patient.connectionState !== 'pending') {
    return res.status(400).json({
      success: false,
      error: 'No pending connection request for this patient'
    });
  }

  // Update connection state
  patient.connectionState = 'accepted';

  // Log the event (in production, would persist to database)
  console.log(`[CONNECTION] Doctor accepted connection from patient ${id}`);

  res.json({
    success: true,
    message: 'Connection request accepted',
    data: {
      patientId: id,
      connectionState: 'accepted',
      acceptedAt: new Date().toISOString()
    }
  });
});

/**
 * POST /api/patients
 * Add a new patient (demo endpoint)
 */
app.post('/api/patients', (req, res) => {
  const newPatient = req.body;

  // Validate required fields
  if (!newPatient.id || !newPatient.name) {
    return res.status(400).json({
      success: false,
      error: 'Patient ID and name are required'
    });
  }

  patients.push({
    ...newPatient,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({
    success: true,
    message: 'Patient added successfully',
    data: newPatient
  });
});

/**
 * GET /api/stats
 * Get overview statistics
 */
app.get('/api/stats', (req, res) => {
  const totalPatients = patients.length;
  const totalSessions = patients.reduce((sum, p) => sum + (p.sessions?.length || 0), 0);
  const crisisAlerts = patients.filter(p => {
    const alerts = calculateAlerts(p);
    return alerts.some(a => a.type === 'crisis');
  }).length;
  const pendingConnections = patients.filter(p => p.connectionState === 'pending').length;

  res.json({
    success: true,
    data: {
      totalPatients,
      totalSessions,
      crisisAlerts,
      pendingConnections,
      timestamp: new Date().toISOString()
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  VoiceCanvas Clinic API Server                     ║
║  Status: Running                                   ║
║  Port: ${PORT}                                     ║
║  Environment: Development                          ║
║                                                    ║
║  Endpoints:                                        ║
║  - GET  /api/health                                ║
║  - GET  /api/patients                              ║
║  - GET  /api/patients/:id                          ║
║  - GET  /api/patients/:id/alerts                   ║
║  - POST /api/patients/:id/connection/accept        ║
║  - GET  /api/stats                                 ║
╚════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
