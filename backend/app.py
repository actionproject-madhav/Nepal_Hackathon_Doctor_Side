"""
VoiceCanvas Reclaimant Backend API
Flask server with MongoDB and Gmail API integration for real appeal submissions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
from functools import wraps

from config import Config
from database import DatabaseService
from gmail_service import GmailService, format_appeal_email, get_insurer_email
from ai_service import AIService

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
db_service = DatabaseService(Config.MONGODB_URI, Config.MONGODB_DB_NAME)
gmail_service = GmailService(
    Config.GOOGLE_CLIENT_ID,
    Config.GOOGLE_CLIENT_SECRET,
    Config.GOOGLE_REFRESH_TOKEN
)
ai_service = AIService(Config.OPENAI_API_KEY)


# Async wrapper for async functions
def async_route(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))
    return wrapper


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'VoiceCanvas Reclaimant API',
        'version': '1.0.0'
    })


@app.route('/api/analyze-denial', methods=['POST'])
@async_route
async def analyze_denial():
    """
    AI-powered denial analysis using OpenAI
    POST /api/analyze-denial
    Body: { "denialText": "...", "denialCode": "..." }
    """
    try:
        data = request.json
        denial_text = data.get('denialText', '')
        denial_code = data.get('denialCode', '')

        if not denial_text:
            return jsonify({'error': 'Denial text is required'}), 400

        # Analyze with AI
        analysis = await ai_service.analyze_denial(denial_text, denial_code)

        return jsonify({
            'success': True,
            'analysis': analysis
        })

    except Exception as e:
        print(f"Error in analyze_denial: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/match-precedents', methods=['POST'])
@async_route
async def match_precedents():
    """
    Vector similarity search for relevant precedents
    POST /api/match-precedents
    Body: { "denialText": "...", "precedents": [...], "topK": 5 }
    """
    try:
        data = request.json
        denial_text = data.get('denialText', '')
        precedents = data.get('precedents', [])
        top_k = data.get('topK', 5)

        if not denial_text or not precedents:
            return jsonify({'error': 'Denial text and precedents are required'}), 400

        # Find similar precedents using vector search
        matched = await ai_service.find_similar_precedents(denial_text, precedents, top_k)

        return jsonify({
            'success': True,
            'matched_precedents': matched
        })

    except Exception as e:
        print(f"Error in match_precedents: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/submit-appeal', methods=['POST'])
def submit_appeal():
    """
    Submit appeal and send real email
    POST /api/submit-appeal
    Body: {
        "patient_id": "...",
        "patient_name": "...",
        "insurer_id": "...",
        "insurer_name": "...",
        "claim_id": "...",
        "denial_code": "...",
        "denial_reason": "...",
        "appeal_text": "...",
        "win_probability": 75,
        "estimated_recovery": 4800,
        "violations": [...],
        "precedents": [...]
    }
    """
    try:
        data = request.json

        # Validate required fields
        required = ['patient_id', 'patient_name', 'insurer_id', 'appeal_text']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Create appeal record in database
        tracking_id = db_service.create_appeal(data)

        # Get insurer email
        insurer_email = get_insurer_email(
            data['insurer_id'],
            Config.DEMO_MODE,
            Config.TEST_EMAIL
        )

        # Format email
        email_html = format_appeal_email(
            data['appeal_text'],
            data['patient_name'],
            data.get('claim_id', 'N/A'),
            data.get('insurer_name', 'Insurance Provider')
        )

        # Send email via Gmail API
        email_result = gmail_service.send_email(
            to=insurer_email,
            subject=f"FORMAL APPEAL - {data.get('claim_id', 'N/A')} - {data['patient_name']}",
            body_html=email_html
        )

        # Update database with email status
        if email_result['success']:
            db_service.update_email_status(tracking_id, email_result['message_id'])

            return jsonify({
                'success': True,
                'tracking_id': tracking_id,
                'email_sent': True,
                'email_message_id': email_result['message_id'],
                'sent_to': insurer_email,
                'message': 'Appeal submitted and email sent successfully'
            })
        else:
            return jsonify({
                'success': False,
                'tracking_id': tracking_id,
                'email_sent': False,
                'error': email_result.get('error'),
                'message': 'Appeal created but email failed to send'
            }), 500

    except Exception as e:
        print(f"Error in submit_appeal: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/appeal-status/<tracking_id>', methods=['GET'])
def get_appeal_status(tracking_id):
    """
    Get appeal status and history
    GET /api/appeal-status/<tracking_id>
    """
    try:
        appeal = db_service.get_appeal(tracking_id)

        if not appeal:
            return jsonify({'error': 'Appeal not found'}), 404

        # Get status history
        history = db_service.get_appeal_status_history(tracking_id)

        return jsonify({
            'success': True,
            'appeal': appeal,
            'history': history
        })

    except Exception as e:
        print(f"Error in get_appeal_status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/patient-appeals/<patient_id>', methods=['GET'])
def get_patient_appeals(patient_id):
    """
    Get all appeals for a patient
    GET /api/patient-appeals/<patient_id>
    """
    try:
        appeals = db_service.get_patient_appeals(patient_id)

        return jsonify({
            'success': True,
            'appeals': appeals,
            'count': len(appeals)
        })

    except Exception as e:
        print(f"Error in get_patient_appeals: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/update-appeal-status', methods=['POST'])
def update_appeal_status():
    """
    Update appeal status (for admin/webhook)
    POST /api/update-appeal-status
    Body: { "tracking_id": "...", "status": "...", "notes": "..." }
    """
    try:
        data = request.json
        tracking_id = data.get('tracking_id')
        new_status = data.get('status')
        notes = data.get('notes', '')

        if not tracking_id or not new_status:
            return jsonify({'error': 'tracking_id and status are required'}), 400

        db_service.update_appeal_status(tracking_id, new_status, notes)

        return jsonify({
            'success': True,
            'message': 'Status updated successfully'
        })

    except Exception as e:
        print(f"Error in update_appeal_status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """
    Get overall appeal statistics
    GET /api/statistics
    """
    try:
        stats = db_service.get_statistics()

        return jsonify({
            'success': True,
            'statistics': stats
        })

    except Exception as e:
        print(f"Error in get_statistics: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recent-appeals', methods=['GET'])
def get_recent_appeals():
    """
    Get recent appeals
    GET /api/recent-appeals?limit=20
    """
    try:
        limit = int(request.args.get('limit', 20))
        appeals = db_service.get_recent_appeals(limit)

        return jsonify({
            'success': True,
            'appeals': appeals,
            'count': len(appeals)
        })

    except Exception as e:
        print(f"Error in get_recent_appeals: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f"🚀 Starting VoiceCanvas Reclaimant API on port {Config.PORT}")
    print(f"📧 Demo Mode: {Config.DEMO_MODE}")
    if Config.DEMO_MODE:
        print(f"📬 Test emails will be sent to: {Config.TEST_EMAIL}")
    print(f"🗄️  MongoDB: {Config.MONGODB_DB_NAME}")
    print("=" * 60)

    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.FLASK_DEBUG
    )
