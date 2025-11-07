# Quick Deploy Guide - Get Your Site Live in 15 Minutes! 🚀

## Easiest Option: Railway (All-in-One)

Railway can host both your frontend and backend. Here's the fastest way to get started:

### 1. Set Up MongoDB Atlas (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Click "Build a Database" → Choose FREE tier
4. Create a database user (remember username/password!)
5. Click "Network Access" → Add IP Address → `0.0.0.0/0` (allows all IPs)
6. Click "Database" → "Connect" → "Connect your application"
7. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority`)

### 2. Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `lineup` repository
4. **Important**: Click "Settings" → "Root Directory" → Set to `server`
5. Go to "Variables" tab and add:
   ```
   MONGODB_URI = (paste your MongoDB connection string)
   JWT_SECRET = any-random-string-here
   NODE_ENV = production
   ```
6. Railway will automatically deploy! Wait for it to finish.
7. Copy your backend URL (e.g., `https://your-app.railway.app`)

### 3. Deploy Frontend to Railway (5 minutes)

1. In the same Railway project, click "New Service"
2. Select "Deploy from GitHub repo" → Choose your `lineup` repo again
3. **Important**: Click "Settings" → "Root Directory" → Set to `client`
4. Go to "Variables" tab and add:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app/api
   NODE_ENV = production
   ```
5. Railway will build and deploy your Next.js app
6. Your site is now live! 🎉

### 4. Update CORS (Important!)

1. Go back to your backend service in Railway
2. Add this environment variable:
   ```
   ALLOWED_ORIGINS = https://your-frontend-url.railway.app
   ```
   (Replace with your actual frontend URL from step 3)

---

## Alternative: Vercel for Frontend (Better Performance)

If you want better performance for your Next.js frontend:

1. Follow steps 1-2 above (MongoDB + Railway backend)
2. Go to https://vercel.com and sign up with GitHub
3. Click "Add New Project" → Import your `lineup` repo
4. **IMPORTANT**: Before deploying, click "Configure Project"
5. Set **Root Directory** to `client` (click "Edit" next to Root Directory)
6. Framework should auto-detect as Next.js
7. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app/api
   ```
8. Click "Deploy"
9. Update backend CORS: Add your Vercel URL to `ALLOWED_ORIGINS` in Railway

**If you already deployed and got an error**: Go to your project → Settings → General → Root Directory → Change to `client` → Save and redeploy

---

## Troubleshooting

**Backend won't connect?**
- Check MongoDB connection string has correct password
- Make sure IP whitelist includes `0.0.0.0/0`

**Frontend can't reach backend?**
- Check `NEXT_PUBLIC_API_URL` matches your backend URL exactly
- Make sure backend URL ends with `/api` (e.g., `https://xxx.railway.app/api`)

**CORS errors?**
- Add your frontend URL to `ALLOWED_ORIGINS` in backend environment variables

---

## Need Help?

Check the full guide in `DEPLOYMENT.md` for more details and troubleshooting tips!

