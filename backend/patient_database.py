"""
MongoDB Database Service for Patient & Session Management
Stores patient profiles, session data, clinical notes, and references to Azure media files
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId


class PatientDatabaseService:
    def __init__(self, mongodb_uri: str, db_name: str):
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]

        # Collections
        self.patients = self.db['patients']
        self.sessions = self.db['sessions']
        self.drawings = self.db['drawings']
        self.clinical_notes = self.db['clinical_notes']
        self.caregivers = self.db['caregivers']

        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create indexes for better query performance"""
        # Patient indexes
        self.patients.create_index('patientId', unique=True)
        self.patients.create_index('email')
        self.patients.create_index([('name', ASCENDING)])
        self.patients.create_index([('riskLevel', ASCENDING)])
        self.patients.create_index([('createdAt', DESCENDING)])

        # Session indexes
        self.sessions.create_index('sessionId', unique=True)
        self.sessions.create_index('patientId')
        self.sessions.create_index([('patientId', ASCENDING), ('timestamp', DESCENDING)])
        self.sessions.create_index([('stressScore', DESCENDING)])
        self.sessions.create_index([('crisisFlag', ASCENDING)])
        self.sessions.create_index([('timestamp', DESCENDING)])

        # Clinical notes indexes
        self.clinical_notes.create_index('sessionId')
        self.clinical_notes.create_index('patientId')

    # ============ PATIENT OPERATIONS ============

    def create_patient(self, patient_data: Dict[str, Any]) -> str:
        """Create new patient profile"""
        patient_record = {
            'patientId': patient_data['patientId'],
            'name': patient_data['name'],
            'age': patient_data['age'],
            'diagnosis': patient_data.get('diagnosis', ''),
            'avatar': patient_data.get('avatar', '👤'),
            'languageLabel': patient_data.get('languageLabel', 'English'),
            'communicationLevel': patient_data.get('communicationLevel', 'Verbal'),
            'isNonverbal': patient_data.get('isNonverbal', False),
            'insuranceProvider': patient_data.get('insuranceProvider', ''),
            'riskLevel': patient_data.get('riskLevel', 'low'),  # low, moderate, high
            'email': patient_data.get('email', ''),
            'phone': patient_data.get('phone', ''),

            # Azure Storage references
            'latestSessionVideo': None,
            'profileImageUrl': None,

            # Metadata
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'lastSessionDate': None,
            'totalSessions': 0,
            'avgStressScore': 0.0,
        }

        result = self.patients.insert_one(patient_record)
        return patient_data['patientId']

    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get patient by ID"""
        patient = self.patients.find_one({'patientId': patient_id})
        if patient:
            patient['_id'] = str(patient['_id'])
        return patient

    def update_patient(self, patient_id: str, update_data: Dict[str, Any]) -> bool:
        """Update patient profile"""
        update_data['updatedAt'] = datetime.utcnow()
        result = self.patients.update_one(
            {'patientId': patient_id},
            {'$set': update_data}
        )
        return result.modified_count > 0

    def list_patients(self, filters: Dict[str, Any] = None, skip: int = 0, limit: int = 50) -> List[Dict[str, Any]]:
        """List patients with optional filters"""
        query = filters or {}
        patients = list(self.patients.find(query).sort('updatedAt', DESCENDING).skip(skip).limit(limit))
        for p in patients:
            p['_id'] = str(p['_id'])
        return patients

    def get_high_risk_patients(self) -> List[Dict[str, Any]]:
        """Get all high-risk patients"""
        return self.list_patients({'riskLevel': 'high'})

    def search_patients(self, search_term: str) -> List[Dict[str, Any]]:
        """Search patients by name or diagnosis"""
        query = {
            '$or': [
                {'name': {'$regex': search_term, '$options': 'i'}},
                {'diagnosis': {'$regex': search_term, '$options': 'i'}},
                {'patientId': {'$regex': search_term, '$options': 'i'}}
            ]
        }
        return self.list_patients(query)

    # ============ SESSION OPERATIONS ============

    def create_session(self, session_data: Dict[str, Any]) -> str:
        """Create new session record"""
        session_record = {
            'sessionId': session_data['sessionId'],
            'patientId': session_data['patientId'],
            'timestamp': session_data.get('timestamp', datetime.utcnow()),
            'promptId': session_data['promptId'],
            'promptTitle': session_data.get('promptTitle', ''),

            # Stress & clinical data
            'stressScore': session_data.get('stressScore', 0.0),
            'crisisFlag': session_data.get('crisisFlag', False),
            'personalStatementEn': session_data.get('personalStatementEn', ''),
            'personalStatementOriginal': session_data.get('personalStatementOriginal', ''),
            'feedbackShort': session_data.get('feedbackShort', ''),

            # Drawing indicators
            'indicators': {
                'isolation': session_data.get('indicators', {}).get('isolation', 0),
                'redPct': session_data.get('indicators', {}).get('redPct', 0),
                'somatic': session_data.get('indicators', {}).get('somatic', False),
                'linePressure': session_data.get('indicators', {}).get('linePressure', 'medium')
            },

            # Azure Storage URLs
            'videoUrl': session_data.get('videoUrl', None),
            'drawingUrl': session_data.get('drawingUrl', None),
            'thumbnailUrl': session_data.get('thumbnailUrl', None),

            # Emotion timeline (from Azure metadata)
            'emotionTimeline': session_data.get('emotionTimeline', []),

            # Caregiver note
            'caregiverNote': session_data.get('caregiverNote', None),

            # Metadata
            'duration': session_data.get('duration', 0),  # seconds
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }

        result = self.sessions.insert_one(session_record)

        # Update patient stats
        self._update_patient_stats(session_data['patientId'])

        return session_data['sessionId']

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        session = self.sessions.find_one({'sessionId': session_id})
        if session:
            session['_id'] = str(session['_id'])
        return session

    def get_patient_sessions(self, patient_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all sessions for a patient (newest first)"""
        sessions = list(
            self.sessions.find({'patientId': patient_id})
            .sort('timestamp', DESCENDING)
            .limit(limit)
        )
        for s in sessions:
            s['_id'] = str(s['_id'])
        return sessions

    def get_latest_session(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get most recent session for a patient"""
        sessions = self.get_patient_sessions(patient_id, limit=1)
        return sessions[0] if sessions else None

    def get_crisis_sessions(self, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all sessions with crisis flags"""
        query = {'crisisFlag': True}
        if patient_id:
            query['patientId'] = patient_id

        sessions = list(self.sessions.find(query).sort('timestamp', DESCENDING))
        for s in sessions:
            s['_id'] = str(s['_id'])
        return sessions

    def get_high_stress_sessions(self, threshold: float = 7.0, limit: int = 50) -> List[Dict[str, Any]]:
        """Get sessions with stress score above threshold"""
        sessions = list(
            self.sessions.find({'stressScore': {'$gte': threshold}})
            .sort('stressScore', DESCENDING)
            .limit(limit)
        )
        for s in sessions:
            s['_id'] = str(s['_id'])
        return sessions

    def update_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update session data"""
        update_data['updatedAt'] = datetime.utcnow()
        result = self.sessions.update_one(
            {'sessionId': session_id},
            {'$set': update_data}
        )
        return result.modified_count > 0

    # ============ CLINICAL NOTES OPERATIONS ============

    def save_clinical_note(self, session_id: str, patient_id: str, soap_note: Dict[str, str]) -> str:
        """Save or update SOAP clinical note"""
        note_record = {
            'sessionId': session_id,
            'patientId': patient_id,
            'subjective': soap_note.get('subjective', ''),
            'objective': soap_note.get('objective', ''),
            'assessment': soap_note.get('assessment', ''),
            'plan': soap_note.get('plan', ''),
            'updatedAt': datetime.utcnow(),
        }

        # Upsert: update if exists, insert if not
        result = self.clinical_notes.update_one(
            {'sessionId': session_id},
            {'$set': note_record},
            upsert=True
        )

        return session_id

    def get_clinical_note(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get clinical note for a session"""
        note = self.clinical_notes.find_one({'sessionId': session_id})
        if note:
            note['_id'] = str(note['_id'])
        return note

    # ============ ANALYTICS & STATS ============

    def _update_patient_stats(self, patient_id: str):
        """Update patient aggregate statistics"""
        sessions = self.get_patient_sessions(patient_id, limit=1000)

        if not sessions:
            return

        total_sessions = len(sessions)
        avg_stress = sum(s['stressScore'] for s in sessions) / total_sessions
        latest_session_date = max(s['timestamp'] for s in sessions)
        has_crisis = any(s['crisisFlag'] for s in sessions)

        # Calculate risk level
        risk_level = 'low'
        if has_crisis or avg_stress >= 7.5:
            risk_level = 'high'
        elif avg_stress >= 5.5:
            risk_level = 'moderate'

        self.patients.update_one(
            {'patientId': patient_id},
            {'$set': {
                'totalSessions': total_sessions,
                'avgStressScore': round(avg_stress, 2),
                'lastSessionDate': latest_session_date,
                'riskLevel': risk_level,
                'updatedAt': datetime.utcnow()
            }}
        )

    def get_patient_analytics(self, patient_id: str) -> Dict[str, Any]:
        """Get comprehensive analytics for a patient"""
        sessions = self.get_patient_sessions(patient_id, limit=1000)

        if not sessions:
            return {
                'totalSessions': 0,
                'avgStressScore': 0.0,
                'crisisCount': 0,
                'stressTrend': [],
                'recentIndicators': {}
            }

        stress_scores = [s['stressScore'] for s in sessions]
        crisis_count = sum(1 for s in sessions if s['crisisFlag'])

        # Stress trend (last 10 sessions)
        recent_sessions = sorted(sessions, key=lambda s: s['timestamp'])[-10:]
        stress_trend = [
            {
                'date': s['timestamp'].strftime('%Y-%m-%d'),
                'score': s['stressScore'],
                'sessionId': s['sessionId']
            }
            for s in recent_sessions
        ]

        # Latest indicators
        latest = sessions[0]
        recent_indicators = latest.get('indicators', {})

        return {
            'totalSessions': len(sessions),
            'avgStressScore': round(sum(stress_scores) / len(stress_scores), 2),
            'minStressScore': min(stress_scores),
            'maxStressScore': max(stress_scores),
            'crisisCount': crisis_count,
            'stressTrend': stress_trend,
            'recentIndicators': recent_indicators,
            'lastSessionDate': latest['timestamp']
        }

    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get overall system statistics"""
        total_patients = self.patients.count_documents({})
        total_sessions = self.sessions.count_documents({})
        high_risk_count = self.patients.count_documents({'riskLevel': 'high'})
        crisis_count = self.sessions.count_documents({'crisisFlag': True})

        # Recent sessions (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_sessions = self.sessions.count_documents({'timestamp': {'$gte': week_ago}})

        return {
            'totalPatients': total_patients,
            'totalSessions': total_sessions,
            'highRiskPatients': high_risk_count,
            'totalCrisisFlags': crisis_count,
            'recentSessions': recent_sessions
        }

    # ============ UTILITY METHODS ============

    def delete_patient(self, patient_id: str) -> bool:
        """Delete patient and all associated data (use with caution!)"""
        # Delete all sessions
        self.sessions.delete_many({'patientId': patient_id})

        # Delete clinical notes
        self.clinical_notes.delete_many({'patientId': patient_id})

        # Delete patient
        result = self.patients.delete_one({'patientId': patient_id})

        return result.deleted_count > 0

    def close(self):
        """Close database connection"""
        self.client.close()


# Example usage
if __name__ == "__main__":
    # Initialize
    db_service = PatientDatabaseService(
        mongodb_uri="mongodb://localhost:27017/",
        db_name="voicecanvas_patients"
    )

    # Create a test patient
    patient_id = db_service.create_patient({
        'patientId': 'pt-test-001',
        'name': 'Test Patient',
        'age': 8,
        'diagnosis': 'Test Diagnosis',
        'insuranceProvider': 'Test Insurance',
        'email': 'test@example.com'
    })

    print(f"Created patient: {patient_id}")

    # Create a test session
    session_id = db_service.create_session({
        'sessionId': 'session-test-001',
        'patientId': patient_id,
        'promptId': 'safe_place',
        'promptTitle': 'Draw your safe place',
        'stressScore': 7.5,
        'crisisFlag': False,
        'personalStatementEn': 'Test statement',
        'videoUrl': 'https://nepusahack26.blob.core.windows.net/session-replays/pt-test-001/session-001.mp4',
        'indicators': {
            'isolation': 3,
            'redPct': 45,
            'somatic': True,
            'linePressure': 'heavy'
        }
    })

    print(f"Created session: {session_id}")

    # Get analytics
    analytics = db_service.get_patient_analytics(patient_id)
    print(f"Patient analytics: {analytics}")

    # Get dashboard stats
    stats = db_service.get_dashboard_stats()
    print(f"Dashboard stats: {stats}")

    db_service.close()
