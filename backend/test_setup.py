#!/usr/bin/env python3
"""
Backend Setup Verification Script
Tests all components before running the server
"""

import sys
import os

print("\n" + "="*60)
print("VoiceCanvas Reclaimant Backend - Setup Verification")
print("="*60 + "\n")

# Test 1: Python version
print("1. Checking Python version...")
if sys.version_info < (3, 9):
    print("   ❌ Python 3.9+ required (you have {}.{})".format(
        sys.version_info.major, sys.version_info.minor
    ))
    sys.exit(1)
print("   ✅ Python {}.{}.{}".format(
    sys.version_info.major, sys.version_info.minor, sys.version_info.micro
))

# Test 2: Dependencies
print("\n2. Checking Python dependencies...")
required_packages = [
    'flask', 'flask_cors', 'pymongo', 'openai',
    'google.oauth2', 'googleapiclient', 'dotenv'
]

missing = []
for package in required_packages:
    try:
        if package == 'google.oauth2':
            __import__('google.oauth2.credentials')
        elif package == 'googleapiclient':
            __import__('googleapiclient.discovery')
        elif package == 'dotenv':
            __import__('dotenv')
        else:
            __import__(package)
        print(f"   ✅ {package}")
    except ImportError:
        print(f"   ❌ {package} - MISSING")
        missing.append(package)

if missing:
    print("\n❌ Missing packages. Run: pip install -r requirements.txt")
    sys.exit(1)

# Test 3: Environment variables
print("\n3. Checking environment configuration...")
from dotenv import load_dotenv
load_dotenv()

required_env = {
    'MONGODB_URI': 'MongoDB connection string',
    'OPENAI_API_KEY': 'OpenAI API key',
    'GOOGLE_CLIENT_ID': 'Google OAuth Client ID',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth Client Secret',
}

optional_env = {
    'GOOGLE_REFRESH_TOKEN': 'Gmail refresh token (required for email sending)',
    'TEST_EMAIL': 'Test email address (for demo mode)',
}

env_ok = True
for key, desc in required_env.items():
    value = os.getenv(key, '')
    if value and len(value) > 10:
        print(f"   ✅ {key}")
    else:
        print(f"   ❌ {key} - MISSING or INVALID")
        env_ok = False

print("\n   Optional (but recommended):")
for key, desc in optional_env.items():
    value = os.getenv(key, '')
    if value and len(value) > 3:
        print(f"   ✅ {key}")
    else:
        print(f"   ⚠️  {key} - NOT SET ({desc})")

if not env_ok:
    print("\n❌ Required environment variables missing!")
    print("   Edit backend/.env and add the required values")
    sys.exit(1)

# Test 4: MongoDB connection
print("\n4. Testing MongoDB connection...")
try:
    from pymongo import MongoClient
    from pymongo.errors import ServerSelectionTimeoutError

    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    client = MongoClient(uri, serverSelectionTimeoutMS=3000)
    client.admin.command('ping')
    print("   ✅ MongoDB connected successfully")
    client.close()
except ServerSelectionTimeoutError:
    print("   ❌ Cannot connect to MongoDB")
    print("   Make sure MongoDB is running:")
    print("   - macOS: brew services start mongodb-community")
    print("   - Linux: sudo systemctl start mongodb")
    sys.exit(1)
except Exception as e:
    print(f"   ❌ MongoDB error: {str(e)}")
    sys.exit(1)

# Test 5: OpenAI API
print("\n5. Testing OpenAI API connection...")
try:
    import openai
    openai.api_key = os.getenv('OPENAI_API_KEY')

    # Test with a simple completion
    response = openai.chat.completions.create(
        model='gpt-4o-mini',
        messages=[{'role': 'user', 'content': 'Say "test"'}],
        max_tokens=5
    )
    print("   ✅ OpenAI API working")
except openai.AuthenticationError:
    print("   ❌ Invalid OpenAI API key")
    print("   Check your OPENAI_API_KEY in .env")
    sys.exit(1)
except Exception as e:
    print(f"   ⚠️  OpenAI API warning: {str(e)}")
    print("   API key might be valid but rate limited or network issue")

# Test 6: Gmail API credentials
print("\n6. Checking Gmail API setup...")
refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN', '')
if refresh_token and len(refresh_token) > 20:
    print("   ✅ Gmail refresh token configured")

    # Try to authenticate
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=os.getenv('GOOGLE_CLIENT_ID'),
            client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
            scopes=['https://www.googleapis.com/auth/gmail.send']
        )

        creds.refresh(Request())
        print("   ✅ Gmail authentication successful")
    except Exception as e:
        print(f"   ⚠️  Gmail auth warning: {str(e)}")
        print("   Token might be expired - regenerate if needed")
else:
    print("   ⚠️  Gmail refresh token not set")
    print("   Email sending will not work until you set it")
    print("   Run: python get_refresh_token.py")

# Test 7: Import main modules
print("\n7. Testing import of main modules...")
try:
    from config import Config
    print("   ✅ config.py")
    from database import DatabaseService
    print("   ✅ database.py")
    from gmail_service import GmailService
    print("   ✅ gmail_service.py")
    from ai_service import AIService
    print("   ✅ ai_service.py")
except Exception as e:
    print(f"   ❌ Import error: {str(e)}")
    sys.exit(1)

# Summary
print("\n" + "="*60)
print("SETUP VERIFICATION COMPLETE")
print("="*60)

demo_mode = os.getenv('DEMO_MODE', 'true').lower() == 'true'
test_email = os.getenv('TEST_EMAIL', '')

print("\nConfiguration Summary:")
print(f"  • MongoDB: {os.getenv('MONGODB_DB_NAME', 'voicecanvas_appeals')}")
print(f"  • Demo Mode: {demo_mode}")
if demo_mode and test_email:
    print(f"  • Test Email: {test_email}")
    print("    (All emails will go here - safe for demo)")
elif not demo_mode:
    print("  ⚠️  PRODUCTION MODE - emails will go to real insurers!")

if not refresh_token:
    print("\n⚠️  NOTE: Gmail refresh token not set")
    print("   Email sending will fail until configured")
    print("   Run: python get_refresh_token.py")

print("\n✅ Backend is ready to run!")
print("\nStart the server with:")
print("  python app.py")
print("\n" + "="*60 + "\n")
