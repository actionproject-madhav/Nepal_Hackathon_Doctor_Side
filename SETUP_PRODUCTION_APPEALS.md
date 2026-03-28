# 🚀 Production Appeals System - Final Setup

**Complete guide to run the production-ready Reclaimant system with real AI, email, and database.**

---

## What You Have Now

✅ **Full Flask Backend** - Production API server
✅ **MongoDB Integration** - Real database for appeal tracking
✅ **Gmail API** - Actual email sending to insurers
✅ **OpenAI AI** - GPT-4o-mini for analysis & generation
✅ **Vector Search** - Semantic precedent matching
✅ **Frontend Integration** - React app connects to backend

**Everything is configured. Just need to:**
1. Get Gmail refresh token (one-time, 2 minutes)
2. Set your test email
3. Start it up

---

## ⚡ Super Quick Start

### Step 1: Install MongoDB (if not installed)

```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb

# Verify
mongo --version
```

### Step 2: Get Gmail Refresh Token

**Option A: Use the helper script (easier)**
```bash
cd backend
python3 get_refresh_token.py
```
Follow prompts, sign in, copy the token.

**Option B: Use OAuth Playground**
1. Go to: https://developers.google.com/oauthplayground/
2. Click ⚙️ → "Use your own OAuth credentials"
3. Paste from your `backend/.env`:
   - Client ID: `YOUR_OAUTH_CLIENT_ID`
   - Client Secret: `YOUR_OAUTH_CLIENT_SECRET`
4. Select: Gmail API v1 → `gmail.send` scope
5. Click "Authorize APIs" → Sign in
6. Click "Exchange authorization code for tokens"
7. Copy the `refresh_token`

**Then edit `backend/.env` line 13:**
```env
GOOGLE_REFRESH_TOKEN=paste_your_token_here
```

### Step 3: Set Test Email

Edit `backend/.env` line 22:
```env
TEST_EMAIL=your-email@gmail.com
```

### Step 4: Start Everything

**Option A: Use quick start script**
```bash
./START_RECLAIMANT.sh
```

**Option B: Manual start**

Terminal 1 (Backend):
```bash
cd backend
python3 test_setup.py  # Verify setup
python3 app.py         # Start server
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

---

## 🧪 Testing the Complete Workflow

### 1. Open the App
- Go to http://localhost:5173
- Backend should show: **✓ Production Mode Active** (green banner)

### 2. File a Claim
- Dashboard → Select patient (e.g., Raju Thapa)
- Click "File Claim"
- Fill form → Click golden "Submit Claim" button
- Watch automated workflow (portal fill, verification)

### 3. Trigger Reclaimant
- After claim submits, click "Simulate Denial"
- You'll see the Reclaimant page

### 4. Watch AI Analysis (Real-time)

**Step 1 - Denial Scan (1-2 sec)**
- OpenAI GPT-4o-mini analyzes denial text
- Extracts: category, regulation, severity
- You'll see: **✨ Enhanced with AI Analysis**

**Step 2 - Precedent Match (2-3 sec)**
- OpenAI embeddings compute similarity
- Returns top 5 most relevant cases
- You'll see: **✨ AI-Powered Vector Similarity Matching**

**Step 3 - Generate Appeal**
- Click "Generate Appeal Letter"
- OpenAI writes professional appeal
- Shows win probability from precedents

**Step 4 - Submit Appeal (REAL)**
- Click "Submit Appeal to [Insurer]"
- Watch agent automation:
  ```
  ✓ Authenticating with Gmail API...
  ✓ Formatting MHPAEA appeal letter...
  ✓ Sending email via Gmail API...
  ✓ Storing appeal in MongoDB database...
  ✓ Email delivered successfully!
  ```

### 5. Verify It's Real

**Check Console (F12 in browser):**
```
✅ Backend connected - using real AI and email submission
AI Denial Analysis: {category: "Medical Necessity", code: "MN", ...}
AI Matched Precedents: [{case: "Wit v. UBH", similarity: 0.87}]
📧 Submitting appeal to backend API...
✅ Real email sent! {tracking_id: "TICK-45612-A", ...}
📨 Sent to: your-test-email@gmail.com
📬 Gmail Message ID: 18d4f5a2b3c1d6e7
🎫 Tracking ID: TICK-45612-A
```

**Check Your Email Inbox:**
- You should receive formal appeal letter
- Subject: "FORMAL APPEAL - [Claim ID]"
- From: your Gmail account
- Full MHPAEA appeal with legal citations

**Check Gmail Sent Folder:**
- Confirms email was actually sent (not simulated)

**Check MongoDB:**
```bash
mongo
use voicecanvas_appeals
db.appeals.find().pretty()
```

Output shows:
```json
{
  "tracking_id": "TICK-45612-A",
  "email_sent": true,
  "email_message_id": "18d4f5a2b3c1d6e7",
  "email_to": "your-test-email@gmail.com",
  "status": "Submitted",
  "win_probability": 75,
  ...
}
```

---

## 🎯 Demo Script for Judges

**1. Show Backend Terminal**
```
🚀 Starting VoiceCanvas Reclaimant API on port 5001
📧 Demo Mode: True
📬 Test emails will be sent to: your-email@gmail.com
🗄️  MongoDB: voicecanvas_appeals
```

**2. Show Frontend Status**
- Point out green banner: "Production Mode Active"
- Show console: "Backend connected"

**3. Trigger Workflow**
- File claim → Simulate denial
- Navigate to Reclaimant

**4. Point Out AI Features**
- "See this badge? 'Enhanced with AI Analysis' - that's GPT-4o-mini"
- "This badge? 'AI-Powered Vector Similarity' - semantic search with embeddings"

**5. Generate Appeal**
- "Watch it generate a professional legal letter"
- "This win probability is calculated from real precedent data"

**6. Submit Appeal**
- Click submit
- "Notice it says 'Gmail API' not 'simulating'"
- "See these real steps: authenticate, send email, store in database"

**7. Show Proof Live**
- Open your email inbox on screen
- "Here's the actual email that was sent"
- Open Gmail sent folder
- "And it's in my sent folder - proof it's real"

**8. Show Database**
```bash
mongo
use voicecanvas_appeals
db.appeals.find({}, {tracking_id:1, email_sent:1}).pretty()
```
- "And here's the record in MongoDB with tracking ID"

**9. Key Points to Emphasize**
- "This isn't a simulation - it's a production system"
- "Real AI: OpenAI GPT-4o-mini"
- "Real email: Gmail API"
- "Real database: MongoDB"
- "Total cost per appeal: less than a penny"

---

## 🔍 Troubleshooting

### "MongoDB connection error"
```bash
# macOS
brew services restart mongodb-community

# Linux
sudo systemctl restart mongodb

# Check if running
ps aux | grep mongod
```

### "Gmail authentication failed"
- Refresh token might be expired
- Regenerate: `python3 get_refresh_token.py`
- Make sure you signed in to correct Gmail account

### "OpenAI API error"
- Check API key in `backend/.env`
- Verify it starts with `sk-proj-`
- Check credits at https://platform.openai.com/usage

### "Backend not connecting"
- Check backend is running: `curl http://localhost:5001/health`
- Check `VITE_RECLAIMANT_API_URL` in `frontend/.env`
- Look for CORS errors in browser console

### Email not appearing
- Check spam/promotions folder
- Verify `TEST_EMAIL` is set correctly in `backend/.env`
- Check backend logs for error messages

---

## 📊 System Architecture

```
┌─────────────┐
│  Frontend   │  React + Vite
│  (Port 5173)│  - Reclaimant UI
└──────┬──────┘  - API Client
       │
       │ HTTP/REST
       ↓
┌─────────────┐
│   Backend   │  Flask API
│  (Port 5001)│  - 8 REST endpoints
└──────┬──────┘  - AI Service
       │          - Gmail Service
       │          - Database Service
       ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   MongoDB   │  │  OpenAI API │  │  Gmail API  │
│   (27017)   │  │  GPT-4o-mini│  │  OAuth 2.0  │
│             │  │  Embeddings │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 💰 Costs

**Per Appeal:**
- OpenAI GPT-4o-mini: ~$0.002
  - Denial analysis: $0.0001
  - Vector embeddings: $0.0003
  - Appeal generation: $0.0015
- Gmail API: $0 (unlimited free)
- MongoDB: $0 (local) or free tier (Atlas)

**For 100 appeals: ~$0.20**

---

## 🔐 Security Notes

- `DEMO_MODE=true` → All emails go to test address (safe)
- `DEMO_MODE=false` → Emails go to real insurers (use carefully!)
- Never commit `.env` files (already in `.gitignore`)
- Rotate API keys after public demos
- In production, use proper OAuth flow (not refresh tokens)

---

## 📝 What's Different from Before

**Before (Simulation):**
- Fake AI responses (templates)
- Browser mailto: links
- localStorage only
- No real tracking
- "mock" references everywhere

**Now (Production):**
- Real OpenAI GPT-4o-mini
- Real Gmail API sending
- Real MongoDB database
- Real tracking IDs
- All "mock" references removed

---

## 🎓 Technical Highlights for Judges

1. **AI Integration**: OpenAI GPT-4o-mini for:
   - Structured denial analysis
   - Professional appeal generation
   - Vector embeddings for semantic search

2. **Email Infrastructure**: Gmail API with OAuth 2.0
   - Real email sending (not mailto: links)
   - Delivery confirmation
   - Message ID tracking

3. **Database Architecture**: MongoDB
   - Appeal documents with full history
   - Status tracking
   - Timestamp management

4. **API Design**: RESTful Flask backend
   - 8 endpoints (CRUD operations)
   - Proper error handling
   - Request validation

5. **Frontend Integration**: React
   - Smart fallbacks (offline mode)
   - Real-time status updates
   - Visual feedback

**This demonstrates:**
- Full-stack development
- API integration (3 external APIs)
- Database design
- Production-ready code
- Real-world healthcare tech

---

## 📚 Files Reference

**Backend:**
- `backend/app.py` - Main Flask server
- `backend/database.py` - MongoDB service
- `backend/gmail_service.py` - Email sending
- `backend/ai_service.py` - OpenAI integration
- `backend/test_setup.py` - Verification script
- `backend/get_refresh_token.py` - Token helper

**Frontend:**
- `frontend/src/utils/reclaimantAPI.js` - API client
- `frontend/src/pages/Reclaimant.jsx` - Main UI
- `frontend/src/utils/appealGenerator.js` - Appeal generation

**Documentation:**
- `RECLAIMANT_SETUP.md` - Complete setup guide
- `backend/README.md` - API documentation
- `SETUP_PRODUCTION_APPEALS.md` - This file

**Scripts:**
- `START_RECLAIMANT.sh` - Quick start script

---

## ✅ Final Checklist

Before demo:
- [ ] MongoDB running
- [ ] Gmail refresh token set in `backend/.env`
- [ ] Test email configured in `backend/.env`
- [ ] Backend running (port 5001)
- [ ] Frontend running (port 5173)
- [ ] Green "Production Mode" banner visible
- [ ] Test workflow once (file claim → denial → appeal)
- [ ] Verify email received in inbox

---

## 🚀 You're Ready!

The system is production-ready. Everything is configured except the Gmail refresh token (one-time setup).

**To start:**
```bash
./START_RECLAIMANT.sh
```

**To verify setup:**
```bash
cd backend && python3 test_setup.py
```

**Any issues?** Check `RECLAIMANT_SETUP.md` for detailed troubleshooting.

**Good luck with your demo! 🎉**
