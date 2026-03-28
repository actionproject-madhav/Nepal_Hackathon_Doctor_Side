"""
SMTP Email Service (Simpler Alternative to Gmail API)
Uses Gmail SMTP with App Password - no OAuth needed
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os


class SMTPEmailService:
    def __init__(self, gmail_address, app_password):
        """
        Initialize SMTP service with Gmail credentials

        Args:
            gmail_address: Your Gmail address (e.g., mkhanalrollins@gmail.com)
            app_password: 16-character app password from Google
        """
        self.gmail_address = gmail_address
        self.app_password = app_password
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587

    def send_email(self, to, subject, body_html):
        """
        Send email via Gmail SMTP

        Args:
            to: Recipient email address
            subject: Email subject
            body_html: HTML body content

        Returns:
            dict: {success: bool, message_id: str or None, error: str or None}
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.gmail_address
            msg['To'] = to
            msg['Subject'] = subject

            # Add HTML body
            html_part = MIMEText(body_html, 'html')
            msg.attach(html_part)

            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # Enable encryption

            # Login
            server.login(self.gmail_address, self.app_password)

            # Send email
            server.send_message(msg)

            # Close connection
            server.quit()

            # Generate a pseudo message ID for tracking
            import time
            message_id = f"smtp_{int(time.time())}"

            return {
                'success': True,
                'message_id': message_id,
                'sent_to': to
            }

        except smtplib.SMTPAuthenticationError:
            return {
                'success': False,
                'error': 'SMTP Authentication failed. Check your Gmail address and app password.'
            }
        except smtplib.SMTPException as e:
            return {
                'success': False,
                'error': f'SMTP error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Email sending failed: {str(e)}'
            }


def format_appeal_email(appeal_text, patient_name, claim_id, insurer_name):
    """Format appeal letter as HTML email"""
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
