"""
Flask API endpoints for Patient & Session Management
Integrates MongoDB patient database with Azure Blob Storage video URLs
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from patient_database import PatientDatabaseService
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize database
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('MONGODB_PATIENTS_DB', 'voicecanvas_patients')

db = PatientDatabaseService(MONGODB_URI, DB_NAME)


# ============ PATIENT ENDPOINTS ============

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients with optional filters"""
    try:
        # Query parameters
        risk_level = request.args.get('riskLevel')
        search = request.args.get('search')
        skip = int(request.args.get('skip', 0))
        limit = int(request.args.get('limit', 50))

        if search:
            patients = db.search_patients(search)
        elif risk_level:
            patients = db.list_patients({'riskLevel': risk_level}, skip, limit)
        else:
            patients = db.list_patients(skip=skip, limit=limit)

        return jsonify({
            'success': True,
            'patients': patients,
            'count': len(patients)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<patient_id>', methods=['GET'])
def get_patient(patient_id):
    """Get single patient by ID"""
    try:
        patient = db.get_patient(patient_id)
        if not patient:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404

        return jsonify({
            'success': True,
            'patient': patient
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create new patient"""
    try:
        data = request.json
        required_fields = ['patientId', 'name', 'age']

        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        patient_id = db.create_patient(data)

        return jsonify({
            'success': True,
            'patientId': patient_id,
            'message': 'Patient created successfully'
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Update patient profile"""
    try:
        data = request.json
        success = db.update_patient(patient_id, data)

        if not success:
            return jsonify({'success': False, 'error': 'Patient not found'}), 404

        return jsonify({
            'success': True,
            'message': 'Patient updated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<patient_id>/analytics', methods=['GET'])
def get_patient_analytics(patient_id):
    """Get patient analytics and statistics"""
    try:
        analytics = db.get_patient_analytics(patient_id)

        return jsonify({
            'success': True,
            'analytics': analytics
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ SESSION ENDPOINTS ============

@app.route('/api/sessions', methods=['POST'])
def create_session():
    """Create new session record (called after video upload to Azure)"""
    try:
        data = request.json
        required_fields = ['sessionId', 'patientId', 'promptId']

        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        # Convert timestamp string to datetime if provided
        if 'timestamp' in data and isinstance(data['timestamp'], str):
            data['timestamp'] = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))

        session_id = db.create_session(data)

        return jsonify({
            'success': True,
            'sessionId': session_id,
            'message': 'Session created successfully'
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session by ID"""
    try:
        session = db.get_session(session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404

        return jsonify({
            'success': True,
            'session': session
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<patient_id>/sessions', methods=['GET'])
def get_patient_sessions(patient_id):
    """Get all sessions for a patient"""
    try:
        limit = int(request.args.get('limit', 50))
        sessions = db.get_patient_sessions(patient_id, limit)

        return jsonify({
            'success': True,
            'sessions': sessions,
            'count': len(sessions)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/<patient_id>/sessions/latest', methods=['GET'])
def get_latest_session(patient_id):
    """Get most recent session for a patient"""
    try:
        session = db.get_latest_session(patient_id)
        if not session:
            return jsonify({'success': False, 'error': 'No sessions found'}), 404

        return jsonify({
            'success': True,
            'session': session
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['PUT'])
def update_session(session_id):
    """Update session data (e.g., add video URL after Azure upload)"""
    try:
        data = request.json
        success = db.update_session(session_id, data)

        if not success:
            return jsonify({'success': False, 'error': 'Session not found'}), 404

        return jsonify({
            'success': True,
            'message': 'Session updated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/crisis', methods=['GET'])
def get_crisis_sessions():
    """Get all crisis-flagged sessions"""
    try:
        patient_id = request.args.get('patientId')
        sessions = db.get_crisis_sessions(patient_id)

        return jsonify({
            'success': True,
            'sessions': sessions,
            'count': len(sessions)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/high-stress', methods=['GET'])
def get_high_stress_sessions():
    """Get sessions with high stress scores"""
    try:
        threshold = float(request.args.get('threshold', 7.0))
        limit = int(request.args.get('limit', 50))
        sessions = db.get_high_stress_sessions(threshold, limit)

        return jsonify({
            'success': True,
            'sessions': sessions,
            'count': len(sessions)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ CLINICAL NOTES ENDPOINTS ============

@app.route('/api/sessions/<session_id>/clinical-note', methods=['POST', 'PUT'])
def save_clinical_note(session_id):
    """Save or update SOAP clinical note"""
    try:
        data = request.json
        patient_id = data.get('patientId')

        if not patient_id:
            return jsonify({'success': False, 'error': 'Missing patientId'}), 400

        soap_note = {
            'subjective': data.get('subjective', ''),
            'objective': data.get('objective', ''),
            'assessment': data.get('assessment', ''),
            'plan': data.get('plan', '')
        }

        db.save_clinical_note(session_id, patient_id, soap_note)

        return jsonify({
            'success': True,
            'message': 'Clinical note saved successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/sessions/<session_id>/clinical-note', methods=['GET'])
def get_clinical_note(session_id):
    """Get clinical note for a session"""
    try:
        note = db.get_clinical_note(session_id)
        if not note:
            return jsonify({'success': False, 'error': 'Clinical note not found'}), 404

        return jsonify({
            'success': True,
            'clinicalNote': note
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ DASHBOARD & ANALYTICS ============

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get overall system statistics"""
    try:
        stats = db.get_dashboard_stats()

        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/high-risk', methods=['GET'])
def get_high_risk_patients():
    """Get all high-risk patients"""
    try:
        patients = db.get_high_risk_patients()

        return jsonify({
            'success': True,
            'patients': patients,
            'count': len(patients)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============ HEALTH CHECK ============

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    try:
        # Test MongoDB connection
        db.patients.count_documents({})

        return jsonify({
            'success': True,
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PATIENT_API_PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)
