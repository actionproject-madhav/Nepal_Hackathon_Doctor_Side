"""
MongoDB Database Service for Appeal Tracking
Stores appeal submissions, status updates, and email delivery tracking
"""

from pymongo import MongoClient
from datetime import datetime
from typing import Dict, Any, List, Optional
import random


class DatabaseService:
    def __init__(self, mongodb_uri: str, db_name: str):
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.appeals = self.db['appeals']
        self.status_updates = self.db['status_updates']
        self._ensure_indexes()

    def _ensure_indexes(self):
        """Create indexes for better query performance"""
        self.appeals.create_index('tracking_id', unique=True)
        self.appeals.create_index('patient_id')
        self.appeals.create_index('insurer_id')
        self.appeals.create_index('created_at')
        self.status_updates.create_index('tracking_id')

    def generate_tracking_id(self) -> str:
        """Generate unique tracking ID"""
        prefix = 'TICK'
        number = random.randint(10000, 99999)
        suffix = 'A'
        return f"{prefix}-{number}-{suffix}"

    def create_appeal(self, appeal_data: Dict[str, Any]) -> str:
        """Create new appeal record"""
        tracking_id = self.generate_tracking_id()

        appeal_record = {
            'tracking_id': tracking_id,
            'patient_id': appeal_data.get('patient_id'),
            'patient_name': appeal_data.get('patient_name'),
            'insurer_id': appeal_data.get('insurer_id'),
            'insurer_name': appeal_data.get('insurer_name'),
            'claim_id': appeal_data.get('claim_id'),
            'denial_code': appeal_data.get('denial_code'),
            'denial_reason': appeal_data.get('denial_reason'),
            'appeal_text': appeal_data.get('appeal_text'),
            'win_probability': appeal_data.get('win_probability'),
            'estimated_recovery': appeal_data.get('estimated_recovery'),
            'violations': appeal_data.get('violations', []),
            'precedents': appeal_data.get('precedents', []),
            'email_sent': False,
            'email_to': appeal_data.get('email_to'),
            'email_message_id': None,
            'status': 'Submitted',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

        self.appeals.insert_one(appeal_record)

        # Create initial status update
        self.add_status_update(tracking_id, 'Submitted', 'Appeal submitted successfully')

        return tracking_id

    def update_email_status(self, tracking_id: str, email_message_id: str):
        """Update appeal with email delivery info"""
        self.appeals.update_one(
            {'tracking_id': tracking_id},
            {
                '$set': {
                    'email_sent': True,
                    'email_message_id': email_message_id,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        self.add_status_update(tracking_id, 'Submitted', 'Email delivered to insurer')

    def update_appeal_status(self, tracking_id: str, new_status: str, notes: str = ''):
        """Update appeal status"""
        self.appeals.update_one(
            {'tracking_id': tracking_id},
            {
                '$set': {
                    'status': new_status,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        self.add_status_update(tracking_id, new_status, notes)

    def add_status_update(self, tracking_id: str, status: str, notes: str = ''):
        """Add status update to history"""
        update_record = {
            'tracking_id': tracking_id,
            'status': status,
            'notes': notes,
            'timestamp': datetime.utcnow()
        }
        self.status_updates.insert_one(update_record)

    def get_appeal(self, tracking_id: str) -> Optional[Dict[str, Any]]:
        """Get appeal by tracking ID"""
        appeal = self.appeals.find_one({'tracking_id': tracking_id}, {'_id': 0})
        if appeal:
            # Convert datetime to ISO string
            appeal['created_at'] = appeal['created_at'].isoformat()
            appeal['updated_at'] = appeal['updated_at'].isoformat()
        return appeal

    def get_appeal_status_history(self, tracking_id: str) -> List[Dict[str, Any]]:
        """Get status update history"""
        updates = list(self.status_updates.find(
            {'tracking_id': tracking_id},
            {'_id': 0}
        ).sort('timestamp', 1))

        for update in updates:
            update['timestamp'] = update['timestamp'].isoformat()

        return updates

    def get_patient_appeals(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get all appeals for a patient"""
        appeals = list(self.appeals.find(
            {'patient_id': patient_id},
            {'_id': 0}
        ).sort('created_at', -1))

        for appeal in appeals:
            appeal['created_at'] = appeal['created_at'].isoformat()
            appeal['updated_at'] = appeal['updated_at'].isoformat()

        return appeals

    def get_insurer_appeals(self, insurer_id: str) -> List[Dict[str, Any]]:
        """Get all appeals for an insurer"""
        appeals = list(self.appeals.find(
            {'insurer_id': insurer_id},
            {'_id': 0}
        ).sort('created_at', -1))

        for appeal in appeals:
            appeal['created_at'] = appeal['created_at'].isoformat()
            appeal['updated_at'] = appeal['updated_at'].isoformat()

        return appeals

    def get_recent_appeals(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent appeals"""
        appeals = list(self.appeals.find(
            {},
            {'_id': 0}
        ).sort('created_at', -1).limit(limit))

        for appeal in appeals:
            appeal['created_at'] = appeal['created_at'].isoformat()
            appeal['updated_at'] = appeal['updated_at'].isoformat()

        return appeals

    def get_statistics(self) -> Dict[str, Any]:
        """Get appeal statistics"""
        total_appeals = self.appeals.count_documents({})
        total_submitted = self.appeals.count_documents({'status': 'Submitted'})
        total_under_review = self.appeals.count_documents({'status': 'Under Review'})
        total_approved = self.appeals.count_documents({'status': 'Approved'})
        total_denied = self.appeals.count_documents({'status': 'Denied'})

        # Calculate total estimated recovery
        pipeline = [
            {'$group': {
                '_id': None,
                'total_recovery': {'$sum': '$estimated_recovery'}
            }}
        ]
        recovery_result = list(self.appeals.aggregate(pipeline))
        total_recovery = recovery_result[0]['total_recovery'] if recovery_result else 0

        return {
            'total_appeals': total_appeals,
            'submitted': total_submitted,
            'under_review': total_under_review,
            'approved': total_approved,
            'denied': total_denied,
            'total_estimated_recovery': total_recovery,
            'approval_rate': round((total_approved / total_appeals * 100) if total_appeals > 0 else 0, 1)
        }
