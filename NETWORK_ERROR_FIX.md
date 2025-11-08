# Fix Network Error - Step by Step

## Step 1: Check Render Service is Running

1. Go to https://render.com
2. Log in
3. Click on your web service
4. Check the status:
   - **Green/Running** = Service is up
   - **Red/Stopped** = Service is down (click "Manual Deploy" to start it)
   - **Building** = Still deploying (wait for it to finish)

## Step 2: Check Render Logs

1. In Render, click on your service
2. Click **"Logs"** tab
3. Look for:
   - `✅ Connected to MongoDB` = Database connected
   - `🚀 Server running on port...` = Server is running
   - Any errors? Copy them

## Step 3: Get Your Render URL

1. In Render, your service should show a URL like: `https://your-service.onrender.com`
2. **Copy this URL**
3. Test it: Open `https://your-service.onrender.com/api/health` in a new browser tab
   - Should show: `{"status":"ok","message":"Capria API is running"}`
   - If it doesn't work, the service isn't running properly

## Step 4: Check Vercel Environment Variable

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Make sure it's set to: `https://your-render-url.onrender.com/api`
   - **Important**: Must end with `/api`
   - Must match your actual Render URL exactly
4. If it's wrong, update it and **Redeploy** Vercel

## Step 5: Check Browser Console

1. On your site, press **F12** (or right-click → Inspect)
2. Click **"Console"** tab
3. Try signing up again
4. Look for error messages
5. **Tell me what errors you see**

## Common Issues:

**"Network Error" or "ERR_NETWORK":**
- Render service might be sleeping (free tier)
- Wait 30 seconds and try again
- Or service might not be running - check Render dashboard

**"CORS Error":**
- Backend CORS not configured properly
- Check Render logs for CORS errors

**"404 Not Found":**
- API URL is wrong
- Check that it ends with `/api`

## What to Tell Me:

1. What does Render show? (Running/Stopped/Building?)
2. What do Render logs say?
3. What does the browser console show?
4. What's your Render URL?

Then I can help fix it!

