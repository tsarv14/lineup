# Deploy Backend to Render (Free Alternative)

## Railway Limited Plan Issue

Railway's free plan only allows databases, not applications. We'll use **Render** instead for the backend (it's free and works great!).

## Step 1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (same account you use for Railway)

## Step 2: Create New Web Service

1. In Render dashboard, click **"New +"** (top right)
2. Click **"Web Service"**
3. Click **"Connect account"** and authorize Render to access GitHub
4. Find and select your **`lineup`** repository
5. Click **"Connect"**

## Step 3: Configure the Service

Fill in these settings:

**Name:** `lineup-backend` (or any name you want)

**Environment:** `Node`

**Build Command:** `cd server && npm install`

**Start Command:** `cd server && npm start`

**Root Directory:** Leave blank (we'll set it in the build command)

## Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** and click **"Add Environment Variable"**

Add these one by one:

1. **Key:** `MONGODB_URI`
   **Value:** Your MongoDB connection string (from MongoDB Atlas)

2. **Key:** `JWT_SECRET`
   **Value:** Any random string (e.g., `my-secret-key-12345`)

3. **Key:** `NODE_ENV`
   **Value:** `production`

4. **Key:** `PORT`
   **Value:** `10000` (Render uses this port)

## Step 5: Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 2-3 minutes for it to finish

## Step 6: Get Your Backend URL

1. Once deployed, you'll see a URL like: `https://lineup-backend.onrender.com`
2. **Copy this URL!**
3. Your API will be at: `https://lineup-backend.onrender.com/api`

## Step 7: Update Vercel

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Update it to: `https://lineup-backend.onrender.com/api` (your Render URL + `/api`)
4. Click **"Save"**
5. Go to **Deployments** → **Redeploy**

## That's It!

Your backend is now on Render (free), and your frontend is on Vercel. They'll work together!

---

## Note About Render Free Tier:

- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- After that, it's fast!
- This is normal for free hosting

