# Gmail Refresh Token Setup - Step by Step

## Method 1: Google Cloud Console + OAuth Playground (Recommended)

### Step 1: Configure OAuth Client in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials

2. Find your OAuth 2.0 Client ID (the one starting with `331872035521-...`)

3. Click on it to edit

4. Under **Authorized redirect URIs**, add this URL:
   ```
   https://developers.google.com/oauthplayground
   ```

5. Click **SAVE**

### Step 2: Use OAuth Playground

1. Go to: https://developers.google.com/oauthplayground/

2. Click the **Settings icon** (⚙️) in the top right

3. Check the box: **"Use your own OAuth credentials"**

4. Enter your credentials:
   - **OAuth Client ID**: `YOUR_OAUTH_CLIENT_ID`
   - **OAuth Client secret**: `YOUR_OAUTH_CLIENT_SECRET`

5. Close settings

6. On the left side, find **Gmail API v1**

7. Expand it and check: `https://www.googleapis.com/auth/gmail.send`

8. Click **"Authorize APIs"** button (blue button at bottom)

9. Select your Google account: `mkhanalrollins@gmail.com`

10. Click **"Allow"** to grant permissions

11. You'll be redirected back to OAuth Playground

12. Click **"Exchange authorization code for tokens"** (Step 2)

13. Copy the **refresh_token** value (starts with `1//`)

14. Paste it in `backend/.env` line 13:
    ```env
    GOOGLE_REFRESH_TOKEN=1//your_token_here
    ```

---

## Method 2: Simpler - Use App Password (No OAuth)

If OAuth is too complicated, use Gmail App Password instead:

### Step 1: Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Turn it ON if not already enabled

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in if prompted
3. App name: Type "VoiceCanvas Reclaimant"
4. Click **Create**
5. Copy the 16-character password (like: `abcd efgh ijkl mnop`)

### Step 3: Update Backend Code

I'll create a simpler email sender that uses app password instead of OAuth.

---

## Method 3: Skip Gmail Refresh Token (Use SMTP)

If both methods above don't work, I can modify the backend to use standard SMTP instead of Gmail API.

---

## Which Method Do You Want?

**Easiest**: Method 2 (App Password) - Takes 2 minutes
**Most Proper**: Method 1 (OAuth) - Takes 5 minutes if you configure Cloud Console
**Backup**: Method 3 (SMTP) - I modify code to use simple SMTP

Let me know which you prefer!
