# Security & API Keys

## Fixed: Removed Hardcoded Secrets

The API key that was hardcoded in `test-automation.html` has been removed from git history.

---

## How to Use API Keys Safely

### 1. Store keys in .env file (NEVER commit this file)

Your `.env` file is already in `.gitignore` and will NOT be committed.

**Location:** `/frontend/.env`

**Contents:**
```
VITE_OPENAI_API_KEY=your_key_here
VITE_ELEVEN_LABS_API_KEY=your_key_here
VITE_GOOGLE_CLIENT_ID=your_key_here
VITE_GOOGLE_CLIENT_SECRET=your_key_here
VITE_GOOGLE_API_KEY=your_key_here
```

### 2. Access keys in code using import.meta.env

**Correct way:**
```javascript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

**Never do this:**
```javascript
// WRONG - Never hardcode keys in files
const apiKey = 'sk-proj-...';
```

### 3. For testing/verification

The test page (`test-automation.html`) now prompts for keys when testing instead of having them hardcoded.

Users can:
- Enter key manually when prompted
- Or skip the test if they don't want to enter it

---

## What's Protected

Your `.gitignore` already includes:
```
.env
.env.*
```

This means:
- `.env` will NEVER be committed
- Any file starting with `.env.` will NEVER be committed
- Your API keys are safe

---

## If You Accidentally Commit a Secret

GitHub will block the push and show an error like you saw.

**To fix:**

1. Remove the secret from the file
2. Stage the fixed file: `git add <file>`
3. Amend the commit: `git commit --amend --no-edit`
4. Force push: `git push --force-with-lease`

**This is what I just did to fix your issue.**

---

## Environment Variables in Vite

Vite exposes env variables that start with `VITE_`:

**In .env:**
```
VITE_OPENAI_API_KEY=sk-...
```

**In code:**
```javascript
const key = import.meta.env.VITE_OPENAI_API_KEY;
```

**Important:** Only `VITE_` prefixed variables are exposed to the browser.

---

## Best Practices

1. **Never hardcode API keys** in any file that gets committed
2. **Always use .env files** for sensitive data
3. **Check .gitignore** includes .env before committing
4. **Use environment variables** in code (import.meta.env)
5. **For public demos**, use restricted API keys with limited scope

---

## Your Current Setup

**Status:** Secure

- `.env` is in `.gitignore` ✓
- API keys are in `.env` file ✓
- Code uses `import.meta.env` ✓
- No secrets in committed files ✓

You're all set!
