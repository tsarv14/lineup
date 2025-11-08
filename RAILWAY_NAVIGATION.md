# How to Go to Your Backend Service in Railway

## Step-by-Step:

### Step 1: Go to Railway
1. Go to https://railway.app
2. Log in with your GitHub account

### Step 2: Find Your Project
1. You should see your project (probably named "lineup" or similar)
2. **Click on the project name** to open it

### Step 3: Find Your Backend Service
1. Inside your project, you should see a **service** (it might have a random name or say "lineup")
2. **Click on the service name** to open it

### Step 4: View Logs
1. Once you're in the service, you'll see tabs at the top:
   - **Deployments**
   - **Logs** ← Click this one!
   - **Metrics**
   - **Settings**
   - etc.

2. Click **"Logs"** to see your backend logs

### Step 5: View Settings
1. Click **"Settings"** tab (at the top)
2. Here you can:
   - See environment variables
   - Change root directory
   - View networking settings
   - etc.

## What You'll See:

**In Logs tab:**
- `✅ Connected to MongoDB` = Database is connected
- `❌ MongoDB connection error` = There's a problem
- Any errors or messages from your backend

**In Settings tab:**
- Environment variables (MONGODB_URI, JWT_SECRET, etc.)
- Root Directory setting
- Networking settings
- Domain/URL

## Quick Path:

1. Railway dashboard → Click your project → Click your service → Click "Logs" or "Settings"

That's it!

