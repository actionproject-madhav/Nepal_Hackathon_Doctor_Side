"""
Gmail API Service for Real Email Sending
Authenticates using OAuth credentials and sends emails via Gmail API
"""

import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os


class GmailService:
    def __init__(self, client_id, client_secret, refresh_token=None):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.service = None

    def authenticate(self):
        """Authenticate with Gmail API using OAuth credentials"""
        try:
            # Create credentials from refresh token
            creds = Credentials(
                token=None,
                refresh_token=self.refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=['https://www.googleapis.com/auth/gmail.send']
            )

            # Refresh the access token
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())

            # Build Gmail service
            self.service = build('gmail', 'v1', credentials=creds)
            return True

        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return False

    def create_message(self, to, subject, body_html, from_email='me'):
        """Create email message"""
        message = MIMEMultipart('alternative')
        message['To'] = to
        message['From'] = from_email
        message['Subject'] = subject

        # Add HTML body
        html_part = MIMEText(body_html, 'html')
        message.attach(html_part)

        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        return {'raw': raw_message}

    def send_email(self, to, subject, body_html):
        """Send email via Gmail API"""
        try:
            if not self.service:
                if not self.authenticate():
                    return {'success': False, 'error': 'Authentication failed'}

            message = self.create_message(to, subject, body_html)
            sent_message = self.service.users().messages().send(
                userId='me',
                body=message
            ).execute()

            return {
                'success': True,
                'message_id': sent_message['id'],
                'thread_id': sent_message.get('threadId')
            }

        except HttpError as error:
            print(f"Gmail API error: {error}")
            return {'success': False, 'error': str(error)}
        except Exception as e:
            print(f"Email sending error: {str(e)}")
            return {'success': False, 'error': str(e)}


def format_appeal_email(appeal_text, patient_name, claim_id, insurer_name):
    """Format appeal letter as HTML email"""
    # Convert plain text appeal to HTML with proper formatting
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }}
            .header {{ margin-bottom: 30px; }}
            .signature {{ margin-top: 40px; }}
            p {{ margin: 10px 0; }}
            .important {{ font-weight: bold; color: #c41e3a; }}
        </style>
    </head>
    <body>
        <div class="header">
            <p><strong>RE: FORMAL APPEAL - {claim_id}</strong></p>
            <p><strong>Patient: {patient_name}</strong></p>
            <p><strong>Insurer: {insurer_name}</strong></p>
        </div>

        <div class="content">
            <pre style="font-family: 'Times New Roman', serif; white-space: pre-wrap; word-wrap: break-word;">{appeal_text}</pre>
        </div>

        <div class="signature">
            <p class="important">THIS IS A FORMAL LEGAL APPEAL UNDER MHPAEA (29 U.S.C. § 1185a)</p>
            <p>Generated via VoiceCanvas Reclaimant™ - AI-Powered Insurance Appeal System</p>
        </div>
    </body>
    </html>
    """
    return html_body


# Insurer email addresses (production-ready)
INSURER_EMAILS = {
    'united': 'appeals@uhc.com',
    'aetna': 'appeals@aetna.com',
    'cigna': 'appeals@cigna.com',
    'anthem': 'appeals@anthem.com',
    'humana': 'appeals@humana.com',
    'medicare': 'appeals@cms.hhs.gov',
    'tricare': 'appeals@tricare.mil',
}


def get_insurer_email(insurer_id, demo_mode=False, test_email=None):
    """Get insurer email address - uses test email in demo mode"""
    if demo_mode and test_email:
        return test_email
    return INSURER_EMAILS.get(insurer_id, 'appeals@insurance.com')
