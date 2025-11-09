# Fix 404 Error - Endpoint Not Found

## The Problem:
"Request failed with status code 404" means the endpoint `/api/auth/register` isn't being found.

## Check Your API URL in Vercel:

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. **It should be:** `https://lineup-fiyt.onrender.com/api`
   - ✅ **Correct**: `https://lineup-fiyt.onrender.com/api` (ends with `/api`)
   - ❌ **Wrong**: `https://lineup-fiyt.onrender.com` (missing `/api`)
   - ❌ **Wrong**: `https://lineup-fiyt.onrender.com/api/api` (double `/api`)

## The Full URL Should Be:

When you call `/auth/register`, it combines:
- Base URL: `https://lineup-fiyt.onrender.com/api`
- Endpoint: `/auth/register`
- **Full URL**: `https://lineup-fiyt.onrender.com/api/auth/register`

## How to Fix:

### Option 1: Update Vercel Environment Variable

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Make sure it's exactly: `https://lineup-fiyt.onrender.com/api`
4. Click **"Save"**
5. Go to **Deployments** → **Redeploy**

### Option 2: Test the Endpoint Directly

1. Open this URL in your browser:
   `https://lineup-fiyt.onrender.com/api/health`
2. Should show: `{"status":"ok","message":"Capria API is running"}`
3. If this works, the backend is running
4. If this doesn't work, there's a different issue

## After Fixing:

1. Wait for Vercel to redeploy (1-2 minutes)
2. Try signing up again
3. Should work now!

## What to Check:

- ✅ `NEXT_PUBLIC_API_URL` = `https://lineup-fiyt.onrender.com/api` (with `/api` at the end)
- ✅ Backend is running (test `/api/health`)
- ✅ Vercel has been redeployed after updating the variable

