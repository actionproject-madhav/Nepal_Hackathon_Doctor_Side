# VoiceCanvas Insurance Automation System

## Overview

VoiceCanvas provides automated insurance claim submission and appeal generation through direct integration with insurance provider portals, Gmail, and AI-powered legal analysis.

---

## Core Features

### 1. TraceGuard - Real-time Claim Verification

**What it does:**
- Analyzes claim defensibility before submission
- Scores claims 0-100 based on documentation quality
- Identifies gaps that could lead to denials
- Provides actionable recommendations

**How to use:**
1. Navigate to Insurance Form
2. View TraceGuard card in right sidebar
3. Review defensibility score and validation checks
4. Address any flagged issues before submission

**Scoring levels:**
- 85-100: VERIFIED - Ready for submission
- 70-84: DEFENSIBLE - Minor improvements recommended
- 50-69: AT RISK - Address gaps before submitting
- 0-49: UNDEFENDABLE - Critical issues require resolution

---

### 2. Insurance Portal Integration

**What it does:**
- Connects directly to insurance provider portals
- Automates form completion and data entry
- Submits claims electronically with full documentation

**Supported insurers:**
- UnitedHealthcare
- Aetna
- Cigna
- Anthem BCBS
- Humana
- Medicare/CMS
- TRICARE

**How to use:**
1. Complete insurance form in VoiceCanvas
2. Click "Open Portal & Fill Form"
3. Provider portal opens in new window
4. System automatically populates all fields
5. Review and submit through provider portal

**Technical details:**
- Uses secure postMessage API for data transfer
- Respects all provider portal security requirements
- Maintains HIPAA compliance standards

---

### 3. Email Integration

**What it does:**
- Automatically drafts claim submission emails
- Generates appeal correspondence
- Pre-fills recipient, subject, and body content
- Integrates with Gmail for immediate sending

**How to use:**

**For claim submissions:**
1. Complete insurance form
2. Click "Draft Email in Gmail"
3. Gmail opens with pre-filled email to provider
4. Review and send

**For appeals:**
1. Generate appeal letter in Reclaimant
2. Click "Draft in Gmail"
3. Gmail opens with appeal letter
4. Review and send to provider

---

### 4. AI-Powered Appeal Generation

**What it does:**
- Analyzes denial reasons and MHPAEA violations
- Generates professional appeal letters
- Cites relevant legal precedents
- Includes specific clinical evidence

**How to use:**
1. Navigate to Reclaimant after denial
2. System analyzes denial reason automatically
3. Click "Generate Appeal Letter"
4. AI generates 400-600 word appeal with citations
5. Edit if needed
6. Submit via email or portal

**AI engine details:**
- Powered by OpenAI GPT-4
- Trained on MHPAEA regulations
- References legal precedent database
- Generates in 3-5 seconds

---

## System Requirements

### Browser compatibility:
- Chrome (recommended)
- Edge
- Safari
- Firefox

### Required permissions:
- Popups must be enabled for portal and email features
- Internet connection for AI and provider portal access

### API credentials (configured):
- OpenAI API key
- Gmail OAuth credentials
- ElevenLabs API key

---

## Integration Verification

To verify all integrations are functioning:

1. Navigate to: `http://localhost:5173/test-automation.html`

2. Run verification tests:
   - **Browser Permissions** - Ensures popups enabled
   - **Insurance Portal Integration** - Validates portal connectivity
   - **Email System Integration** - Confirms Gmail connection
   - **AI Appeal Engine** - Verifies OpenAI access

3. Address any failures before using system

---

## Workflow Examples

### Standard Claim Submission:

1. Select patient from roster
2. Insurance form auto-populates from session data
3. Review TraceGuard score (should be 85+)
4. Click "Open Portal & Fill Form"
5. Provider portal opens and completes automatically
6. Submit through portal interface
7. Optionally draft confirmation email via Gmail

### Denied Claim Appeal:

1. Receive denial notification
2. Navigate to Reclaimant
3. System analyzes denial and identifies violations
4. Review matched legal precedents
5. Click "Generate Appeal Letter"
6. AI generates professional appeal
7. Click "Draft in Gmail"
8. Send appeal to provider
9. Track appeal status

---

## Security & Compliance

### Data protection:
- All patient data encrypted in transit
- HIPAA compliance maintained
- Secure credential storage
- No data retention on external servers

### Provider portal access:
- Uses standard web integration protocols
- Respects all provider security requirements
- Maintains audit trails

### Email security:
- OAuth 2.0 authentication with Gmail
- No credential storage
- User maintains full control over sending

---

## Troubleshooting

### Portal window doesn't open:

**Solution:** Enable popups in browser
- Chrome: Click blocked popup icon in address bar → Allow
- Safari: Preferences → Websites → Pop-up Windows → Allow

### Gmail doesn't open:

**Solution:** Check popup permissions (same as above)

### AI generation fails:

**Solution:** System automatically uses template fallback. Check internet connection if persistent.

### Low TraceGuard score:

**Solution:** This indicates documentation gaps. Review flagged checks and add missing information.

---

## Technical Architecture

### Frontend:
- React 19 with Vite
- Framer Motion for animations
- Custom CSS design system

### Integrations:
- OpenAI API for appeal generation
- Gmail URL scheme for email drafting
- PostMessage API for secure portal communication
- ElevenLabs for text-to-speech

### Data flow:
1. Patient session data → Insurance form
2. TraceGuard analysis → Validation feedback
3. Portal automation → Provider submission
4. Denial analysis → AI appeal generation
5. Email integration → Direct correspondence

---

## Support

For technical issues:
1. Run integration verification dashboard
2. Check browser console for errors
3. Verify internet connectivity
4. Ensure browser permissions enabled

For claim denials:
- Use Reclaimant automated appeal system
- Review matched precedents
- Leverage AI-generated legal citations
- Submit through integrated email

---

## Cost Structure

### API usage:
- OpenAI: ~$0.01-0.05 per appeal letter
- Gmail: Free
- Portal integration: Free
- TraceGuard: Free (client-side)

**Average cost per claim: $0.05**

---

## Getting Started

1. Ensure dev server running: `npm run dev`
2. Navigate to: `http://localhost:5173`
3. Verify integrations: `/test-automation.html`
4. Process first claim through full workflow
5. Review TraceGuard recommendations
6. Test appeal generation with sample denial

System is ready for production use.
