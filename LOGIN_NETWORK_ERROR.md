# Fix Login Network Error

## The Problem:
"Cannot connect to server" means the frontend can't reach the backend.

## Step 1: Test Your Backend Directly

1. Open this URL in your browser:
   `https://lineup-fiyt.onrender.com/api/health`
2. **What do you see?**
   - ✅ `{"status":"ok","message":"Capria API is running"}` = Backend is working
   - ❌ Nothing/Error = Backend is down or sleeping

## Step 2: Check Render Service Status

1. Go to **Render** → Your service
2. What color is the status?
   - **Green** = Running
   - **Red** = Stopped (click "Manual Deploy")
   - **Yellow** = Building (wait for it)

## Step 3: Check Render Logs

1. In Render → Your service → **Logs** tab
2. Do you see:
   - `✅ Connected to MongoDB`?
   - `🚀 Server running on port 10000`?
   - Any errors?

## Step 4: Check Vercel Environment Variable

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Make sure it's: `https://lineup-fiyt.onrender.com/api`
4. If it's wrong, update it and **Redeploy**

## Step 5: Render Cold Start (Free Tier)

**Render free tier services sleep after 15 minutes of inactivity.**

- First request after sleep takes **30-60 seconds** (service waking up)
- After that, it's fast

**What to do:**
1. Try logging in
2. **Wait 30-60 seconds** (don't close the page)
3. It should work after the service wakes up

## Step 6: Check Browser Console

1. Press **F12** → **Console** tab
2. Try logging in
3. **What errors do you see?**
   - `ERR_NETWORK` = Can't connect
   - `ECONNABORTED` = Timeout (service waking up)
   - `CORS error` = CORS issue

## What to Tell Me:

1. Does `https://lineup-fiyt.onrender.com/api/health` work in your browser?
2. What does Render show? (Green/Red/Yellow?)
3. What do Render logs say?
4. What does browser console show?

