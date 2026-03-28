# VoiceCanvas Clinic — Doctor App Requirements

**Scope:** Clinician-facing app only. No patient onboarding, drawing UI, or public marketing beyond the clinic entry page.

**Demo:** No auth. Data from `localStorage` (same keys as the full platform spec: `profile`, `sessions`, `analytics`).

---

## Routes

| Path | Purpose |
|------|---------|
| `/clinic` | Clinic landing |
| `/clinic/dashboard` | Patient list + alerts |
| `/clinic/patient/:id` | One patient: sessions + current session detail |
| `/clinic/replay/:sessionId` | Stroke + webcam replay + notes |
| `/clinic/insurance` | Insurance / pre-auth flow |
| `/clinic/reclaimant` | Denial → appeal flow |

---

## 1. Clinic landing (`/clinic`)

- Show **VoiceCanvas Clinic** branding and subtitle: mental health professionals.
- Three value columns: non-verbal patients get a voice; AI-assisted SOAP from sessions; Reclaimant for denied claims.
- Stats bar (demo numbers): e.g. average recovery, appeal win rate, MH denial context.
- Primary CTA: **Enter Clinic Dashboard** → `/clinic/dashboard` (no login).

---

## 2. Clinic dashboard (`/clinic/dashboard`)

**Top stats (four cards)**

- Active patients count  
- Total sessions analyzed count  
- Pending insurance actions count (show badge when count is at least 1)  
- Recovered this quarter (demo $)

**Patient list (cards or rows)**

Each patient must show:

- Name, language flag, communication level badge  
- Session count  
- Latest stress score + trend (↑ / ↓ / →) vs prior  
- Last session date  
- Alert badges (clear rules):
  - **Crisis:** stress ≥ 8 **or** `crisis_flag` on latest relevant session  
  - **Threshold:** stress ≥ 7 on **3+** sessions  
  - **Improving:** stress down **2+** sessions in a row  
  - **Pending connection:** patient requested link; not yet accepted  

**Actions**

- Click patient → `/clinic/patient/:id`  
- **Accept** on pending connection requests (updates stored connection state for demo)  
- Link or card for pending insurance count → `/clinic/insurance`

**Filter / sort**

- Sort: stress, last session, name, alert priority  
- Filter: language, alert type, insurance status (as implemented in mock data)

---

## 3. Patient detail (`/clinic/patient/:id`)

**Left: session timeline**

- Newest first: thumbnail, date, stress dot, duration  
- Click session → load that session in the right panel  

**Right: selected session**

- Full drawing image  
- **Personal statement:** patient language + English  
- **Play:** TTS (e.g. ElevenLabs) reads **English** clinical summary for the doctor; fallback to `speechSynthesis` if needed  
- **SOAP:** Subjective, Objective, Assessment, Plan — **inline edit**, per-field save  
- **Facial / affect summary** (from session `result.facial_analysis` when present): dominant affect, emotional arc, key moments  
- Stress score + compare to previous session if data exists  

**Session actions**

- **Replay Session** → `/clinic/replay/:sessionId`  
- **Export FHIR JSON** (R4-shaped bundle/file download)  
- **Download PDF** (clinical note)  
- **Submit to Insurance** → `/clinic/insurance` scoped to this patient/session as the app already does  

---

## 4. Session replay (`/clinic/replay/:sessionId`)

**Left: canvas replay**

- Rebuild drawing from stored **stroke data** (`{ x, y, t }` or equivalent) at recorded timing  
- Play / Pause / Restart  
- Scrubber to jump in time  
- Speed: 0.5×, 1×, 2×  

**Right: webcam replay**

- Show sampled **webcam frames** in sync with the same timeline (slideshow / pseudo-video)  
- Optional: simple overlay or labels for affect (demo) aligned to `facial_analysis` if available  

**Below both: timeline**

- Horizontal bar with **clickable markers** at key moments (from AI annotations / `key_moments`)  
- Clicking a marker seeks **both** canvas and face to that time  

**Notes**

- Rich text (or substantial text area) beside or below replay  
- Pre-fill with AI SOAP draft from the session  
- **Save notes** → persist to patient/session record used elsewhere  
- After save: **Export PDF** / **Export FHIR** (same as detail view expectations)

---

## 5. Insurance submission (`/clinic/insurance`)

**Step 1 — Insurer**

- Dropdown: Aetna, UnitedHealth, Cigna, BCBS, Humana, Medicaid (state), Tricare, Self-pay / none, Other (free text)  
- Sidebar (or panel) updates with **insurer-specific** demo copy: denial rate, appeal timing, MHPAEA notes, win rate  

**Step 2 — Form (auto-filled from session AI)**

- Clinical: chief complaint, duration, functional impairment, ICD-10 suggestion (non-binding), service type  
- Patient: name, DOB, member ID, group #  
- Provider: name, NPI, address  
- Session evidence list: dates, stress scores, how often clinical threshold met  

**Step 3 — Parity Guard**

- AI/rule-based scan for MHPAEA-style issues; list violations with severity and short code reference (demo)  

**Step 4 — Submit**

- Mock success + **Download PDF**  
- Optional demo path: trigger **simulated denial** for Reclaimant  

---

## 6. Reclaimant (`/clinic/reclaimant`)

**Entry**

- Doctor clicks **Simulate Denial** (demo) or uses flow after insurance step  

**Step 1 — Denial scan (auto)**

- Show parsed denial reason + parity category + cited regulation (demo text)  

**Step 2 — Precedents (auto)**

- Match **filtered by selected insurer**; list case name, year, outcome, relevance, win rate  
- Show overall **win probability** (demo %)  

**Step 3 — Appeal letter**

- **Generate Appeal** → letter with patient, insurer, claim ID, citations, session evidence, precedents, 30-day demand (demo)  
- Full **inline edit**  
- Show win probability line  

**Step 4 — Submit appeal (mock)**

- Tracker: Submitted → Under review → Pending → Decision  
- Estimated recovery $  
- Update dashboard “recovered” / patient “appeal submitted” state for demo  

---

## Data the doctor app must read (minimum)

- **Sessions:** `canvasImage`, `webcamFrames[]`, `strokeData[]`, `result` (SOAP, facial_analysis, stress, crisis_flag, insurance_data), `sharedWithDoctor`, `language`, timestamps  
- **Profile (per patient in demo):** name, language, communication level, connection state for pending/accepted  

Implementations may use `mockPatients.js` + `localStorage` until a real API exists.

---

## Explicit non-goals (doctor repo)

- Real insurer or EHR APIs, HIPAA compliance, auth, mobile polish, real legal outcomes.

---

*Nepal–US Hackathon 2026 · Mental Health · Demo only; not for clinical use.*
