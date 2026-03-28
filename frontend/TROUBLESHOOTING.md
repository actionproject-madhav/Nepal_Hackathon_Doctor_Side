# Troubleshooting Guide

## Important: No Backend Needed

**All features work from frontend only:**
- Gmail uses URL scheme (no backend)
- Portal automation uses postMessage (no backend)
- OpenAI calls from frontend directly (no backend)
- TraceGuard is frontend only (no backend)

**Answer: NO, you do NOT need to run the backend.**

---

## What You're Probably Seeing (Common Confusion)

### Issue 1: "Insurance page fills too fast"

**What you're seeing:**
- You go to Insurance Form page
- Form fields are already filled with patient data
- This happens instantly

**This is CORRECT and expected behavior:**
- The insurance form auto-populates from patient session data
- This is NOT the portal automation
- This is just React pre-filling the form

**The portal automation is different:**
- You click "Open Portal & Fill Form" button
- A NEW WINDOW should open
- THAT new window fills with animation
- The current page doesn't change

---

### Issue 2: "Nothing with Gmail"

**Most common cause: Popups are blocked**

**How to check:**
1. Look at your browser address bar
2. Do you see a popup blocked icon?
3. Chrome: Small icon on right side of address bar
4. Safari: Shows "Pop-up Blocked" message

**How to fix:**
1. Click the blocked popup icon
2. Select "Always allow popups from localhost:5173"
3. Try clicking the button again

**Alternative test (no popups):**
Open browser console (F12) and run:
```javascript
window.open('https://mail.google.com/mail/?view=cm&fs=1&to=test@test.com&su=Test&body=Test')
```

If Gmail opens → popups work, button has different issue
If nothing happens → popups are blocked

---

## Step-by-Step Test

### Test 1: Check Buttons Exist

1. Go to `http://localhost:5173`
2. Click "Claims" in navigation
3. Click "Raju Thapa" patient card
4. Scroll down to "Action Card" section (bottom right)

**You should see 4 buttons:**
- Submit Claim to UnitedHealthcare
- Open Portal & Fill Form
- Draft Email in Gmail
- Download Form PDF

**If you DON'T see these buttons:**
- Take a screenshot and show me
- Check browser console (F12) for errors

---

### Test 2: Portal Automation

**Expected behavior:**

1. Click "Open Portal & Fill Form" button
2. **A NEW BROWSER WINDOW OPENS** (not a tab, a popup window)
3. New window shows UnitedHealthcare portal page
4. Wait 1 second
5. Fields start filling one by one with typing animation
6. Top right shows "Automation in progress..." indicator
7. Takes 6-8 seconds to fill completely

**What you should SEE:**
- Patient Name field fills: "R... a... j... u... [space] T... h... a... p... a"
- Date of Birth fills: "1... 9... 9... 8... -... 0... 1... -... 1... 0"
- Each field fills with visible typing

**If new window doesn't open:**
- Popups are blocked (see Issue 2 above)

**If window opens but doesn't fill:**
- Open browser console in BOTH windows
- Check for JavaScript errors
- The portal window should show console log: "Received FILL_FORM message"

---

### Test 3: Gmail Integration

**Expected behavior:**

1. Click "Draft Email in Gmail" button
2. **NEW TAB OPENS** with Gmail
3. Gmail shows compose window
4. Fields pre-filled:
   - To: appeals@uhc.com
   - Subject: Pre-Authorization Submission - Raju Thapa - Claim INS-...
   - Body: Multi-line email with patient details

**What you should SEE:**
- Gmail login screen (if not logged in) OR
- Gmail compose window with filled fields

**If nothing happens:**
- Check popup blocker
- Check browser console for errors
- Try manually: `https://mail.google.com/mail/?view=cm&to=test@test.com&su=Test&body=Hello`

**If Gmail opens but fields are empty:**
- Some Gmail accounts block URL parameters
- This is a Gmail security setting (rare)

---

### Test 4: OpenAI Appeal Generation

**Expected behavior:**

1. Submit claim → Click "View Claim EOB"
2. Reclaimant page opens
3. Steps 1-2 auto-complete (3 seconds)
4. Click "Generate Appeal Letter" button
5. Shows "Generating..." spinner
6. **Wait 3-10 seconds** (OpenAI API call)
7. Letter appears in text box
8. Should be 400-600 words with legal citations

**What you should SEE:**
```
[Date]

UnitedHealthcare
Appeals & Grievances Department
...

Re: FORMAL APPEAL — Denial MN-4021
Patient: Raju Thapa
...

Dear Appeals Officer,

We are writing to formally appeal...
```

**If it fails:**
- Check browser console for error
- Error: "OpenAI API error: 401" → API key invalid
- Error: "OpenAI API error: 429" → Rate limit reached
- System should auto-fallback to template

**If it generates instantly (< 1 second):**
- This means it used the template fallback
- OpenAI API didn't work
- Check .env file has correct key
- Check console for API error

---

## Common Issues

### Issue: "I don't see TraceGuard"

**Location:** Insurance Form page, right sidebar, TOP card

**Should look like:**
```
TraceGuard [ACTIVE badge]
[Circular progress ring showing score]
92 / 100
VERIFIED
Claim meets all requirements. Low denial risk.

✓ Patient Information - 15 pts
✓ Clinical Documentation - 25 pts
...
```

**If you don't see it:**
- Check if TraceGuard.jsx exists
- Check browser console for import errors
- Take screenshot of sidebar

---

### Issue: "Portal opens but is blank"

**Cause:** HTML file not loading

**Fix:**
1. Check file exists: `ls public/mock-portal/united.html`
2. Check Vite config allows serving public files
3. Try direct URL: `http://localhost:5173/mock-portal/united.html`

---

### Issue: "Buttons not clickable"

**Cause:** CSS z-index or pointer-events issue

**Fix:**
1. Right-click button → Inspect Element
2. Check if button has `pointer-events: none`
3. Check if overlay is blocking button
4. Try clicking with devtools open

---

## Debug Console Commands

Open browser console (F12) and run these:

### Check if functions are available:
```javascript
// Check portal automation
console.log(typeof window.open);
// Should show: "function"

// Check postMessage
console.log(typeof window.postMessage);
// Should show: "function"
```

### Manually trigger Gmail:
```javascript
window.open('https://mail.google.com/mail/?view=cm&fs=1&to=appeals@uhc.com&su=Test&body=Hello');
```

### Manually trigger portal:
```javascript
const portal = window.open('/mock-portal/united.html', '_blank', 'width=1200,height=900');
setTimeout(() => {
  portal.postMessage({
    type: 'FILL_FORM',
    formData: {
      patientName: 'Test Patient',
      dob: '1990-01-01',
      insuranceId: 'TEST123',
      chiefComplaint: 'Test complaint'
    }
  }, '*');
}, 2000);
```

---

## Expected vs Actual

### Expected: Portal Button Click

**Timeline:**
1. Click button (0s)
2. New window opens (0.5s)
3. Portal page loads (1s)
4. "Automation in progress" appears (1s)
5. Patient Name starts filling (1.5s)
6. Patient Name finishes (2.5s)
7. DOB starts filling (3s)
8. All fields done (8s)
9. "Automation in progress" disappears (9s)

**What should happen on SCREEN:**
- You see TWO browser windows
- Original window: Insurance form (unchanged)
- New window: Portal with fields filling

### Expected: Gmail Button Click

**Timeline:**
1. Click button (0s)
2. New tab opens (0.5s)
3. Gmail loads (1-2s)
4. Compose window shows (2-3s)
5. Fields are pre-filled

**What should happen on SCREEN:**
- New tab appears
- Gmail interface visible
- Compose window open
- To/Subject/Body fields have text

---

## Quick Diagnostic

Run this in console to check everything:

```javascript
// Diagnostic script
const checks = {
  'Popup allowed': typeof window.open === 'function',
  'PostMessage available': typeof window.postMessage === 'function',
  'Portal exists': fetch('/mock-portal/united.html').then(r => r.ok),
  'OpenAI key set': import.meta.env.VITE_OPENAI_API_KEY?.length > 0,
  'Gmail key set': import.meta.env.VITE_GOOGLE_CLIENT_ID?.length > 0,
};

console.table(checks);
```

---

## What To Do Next

### If portal doesn't open:
1. Take screenshot showing browser address bar
2. Check for popup blocked icon
3. Open browser console, share any errors
4. Try running manual test from Debug section above

### If Gmail doesn't open:
1. Allow popups for localhost
2. Try manual Gmail URL test
3. Check if logged into Gmail in browser

### If OpenAI doesn't work:
1. Check .env file exists in frontend folder
2. Check VITE_OPENAI_API_KEY is set
3. Restart dev server: Ctrl+C then `npm run dev`
4. Check browser console for API errors

### If buttons don't exist:
1. Restart dev server
2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Check src/pages/InsuranceForm.jsx has the new button code

---

## Share This Info

If it's still not working, tell me:

1. **What you see:** Exact behavior when clicking buttons
2. **What you expect:** What should happen
3. **Console errors:** Any red errors in browser console (F12)
4. **Screenshots:** Show me the Insurance Form page
5. **Popup status:** Is popup icon showing in address bar?

I'll debug from there.
