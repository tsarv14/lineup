# Network Error When Signing Up - Troubleshooting

## Even though MongoDB is connected, you might have other issues:

### Step 1: Test Your Render Backend Directly

1. Your Render URL is: `https://lineup-fiyt.onrender.com`
2. Open this in a new browser tab: `https://lineup-fiyt.onrender.com/api/health`
3. Should show: `{"status":"ok","message":"Capria API is running"}`
4. **If this doesn't work**, the backend isn't accessible

### Step 2: Check Vercel Environment Variable

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Make sure it's set to: `https://lineup-fiyt.onrender.com/api`
   - **Important**: Must end with `/api`
   - Must match your Render URL exactly
4. If it's wrong, update it and **Redeploy** Vercel

### Step 3: Check Browser Console

1. On your site, press **F12** (or right-click → Inspect)
2. Click **"Console"** tab
3. Try signing up again
4. Look for error messages
5. **Tell me what errors you see**

### Step 4: Check Network Tab

1. In browser, press **F12**
2. Click **"Network"** tab
3. Try signing up again
4. Look for a request to `/api/auth/register`
5. Click on it to see:
   - Status code (should be 200 or 201)
   - Response (what the server returned)
   - Error message (if any)

### Step 5: Check Render Logs

1. Go to **Render** → Your service → **Logs** tab
2. Try signing up on your site
3. Watch the logs - do you see any requests coming in?
4. Do you see any errors?

## Common Issues:

**"Network Error" or "ERR_NETWORK":**
- Render service might be sleeping (free tier)
- Wait 30 seconds and try again
- Or CORS is blocking the request

**"CORS Error":**
- Backend CORS not allowing your Vercel domain
- Check Render logs for CORS errors

**"404 Not Found":**
- API URL is wrong
- Check that it ends with `/api`

**"Timeout":**
- Render is waking up (takes 30 seconds on free tier)
- Wait and try again

## What to Tell Me:

1. Does `https://lineup-fiyt.onrender.com/api/health` work in your browser?
2. What's your `NEXT_PUBLIC_API_URL` in Vercel?
3. What does the browser console show?
4. What does the Network tab show when you try to sign up?

