#!/usr/bin/env python3
"""
Gmail Refresh Token Generator
Interactive script to get OAuth refresh token for Gmail API
"""

from google_auth_oauthlib.flow import InstalledAppFlow
import json

# Gmail API scope for sending emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("\n" + "="*60)
    print("Gmail API Refresh Token Generator")
    print("="*60 + "\n")

    print("This script will help you get a refresh token for Gmail API.")
    print("You'll need your Google OAuth credentials from the .env file.\n")

    # Get credentials from user
    client_id = input("Enter GOOGLE_CLIENT_ID: ").strip()
    client_secret = input("Enter GOOGLE_CLIENT_SECRET: ").strip()

    if not client_id or not client_secret:
        print("\n❌ Error: Client ID and Secret are required!")
        return

    # Create OAuth config
    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": ["http://localhost"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }

    print("\n🔐 Starting OAuth flow...\n")
    print("A browser window will open. Please:")
    print("1. Sign in to the Gmail account you want to use")
    print("2. Grant permission to send emails")
    print("3. Return here after authorization\n")

    try:
        # Start OAuth flow
        flow = InstalledAppFlow.from_client_config(
            client_config,
            SCOPES
        )

        creds = flow.run_local_server(port=0)

        print("\n" + "="*60)
        print("✅ SUCCESS! Here's your refresh token:")
        print("="*60 + "\n")
        print(creds.refresh_token)
        print("\n" + "="*60)
        print("\nCopy the token above and paste it in backend/.env:")
        print("GOOGLE_REFRESH_TOKEN=<paste_token_here>")
        print("\n" + "="*60 + "\n")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTroubleshooting:")
        print("- Make sure your Client ID and Secret are correct")
        print("- Check that Gmail API is enabled in Google Cloud Console")
        print("- Try using OAuth Playground instead:")
        print("  https://developers.google.com/oauthplayground/")

if __name__ == '__main__':
    main()
