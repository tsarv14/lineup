# Render Not Showing Logs - How to Fix

## Why You Might Not See Logs:

1. Service stopped running
2. Service crashed
3. Service is in a bad state
4. Need to restart the service

## How to Fix:

### Step 1: Check Service Status

1. Go to https://render.com
2. Log in
3. Click on your web service
4. Look at the status indicator:
   - **Green/Running** = Service is running
   - **Red/Stopped** = Service stopped
   - **Yellow/Building** = Still deploying
   - **Gray** = Not deployed

### Step 2: Check Events Tab

1. In Render, click on your service
2. Click **"Events"** tab (instead of Logs)
3. This shows deployment history and events
4. Look for any errors or failed deployments

### Step 3: Manual Deploy/Restart

1. In Render, click on your service
2. Look for **"Manual Deploy"** or **"Deploy Latest"** button
3. Click it to restart/redeploy the service
4. Wait 2-3 minutes for it to deploy
5. Check Logs tab again

### Step 4: Check Environment Variables

1. Click **"Environment"** tab
2. Make sure all variables are set:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV`
   - `PORT`
3. If any are missing, add them

### Step 5: Check Build Logs

1. Click **"Events"** tab
2. Click on the latest deployment
3. Check the build logs
4. Look for errors during build

## Common Issues:

**Service Stopped:**
- Click "Manual Deploy" to restart it

**Build Failed:**
- Check Events tab for build errors
- Make sure Build Command is: `cd server && npm install`
- Make sure Start Command is: `cd server && npm start`

**No Logs After Deploy:**
- Wait 1-2 minutes for logs to appear
- Try refreshing the page
- Check Events tab instead

## What to Do:

1. **Check service status** - Is it running or stopped?
2. **Try Manual Deploy** - Restart the service
3. **Check Events tab** - See what happened
4. **Wait 2-3 minutes** - After deploying, logs take time to appear

**Tell me:**
- What does the service status show? (Green/Red/Yellow/Gray?)
- Do you see any deployments in the Events tab?
- Can you click "Manual Deploy"?

