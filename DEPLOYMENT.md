# Deployment Guide - Free Hosting Setup

This guide will help you deploy your full-stack application to free hosting services.

## Architecture Overview

- **Frontend**: Next.js application (in `client/` folder)
- **Backend**: Express.js API server (in `server/` folder)
- **Database**: MongoDB (MongoDB Atlas free tier recommended)

## Recommended Hosting Options

### Option 1: Railway (Recommended - Simplest)
Railway can host both your backend and frontend, and provides MongoDB.

### Option 2: Vercel (Frontend) + Railway (Backend)
Best performance for Next.js frontend, with Railway for backend.

---

## Option 1: Deploy Everything to Railway

### Step 1: Set up MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Create a database user (username/password)
5. Whitelist IP address: `0.0.0.0/0` (allows all IPs - for testing only)
6. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority`

### Step 2: Deploy Backend to Railway

1. Go to [Railway](https://railway.app) and sign up with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `lineup` repository
5. Select the `server` folder as the root directory
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: `5000` (Railway will set this automatically, but good to have)
   - `JWT_SECRET`: Any random string (for JWT tokens)
   - `NODE_ENV`: `production`
7. Railway will automatically detect Node.js and deploy
8. Once deployed, copy your backend URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend to Railway

1. In Railway, click "New Service" in the same project
2. Select "Deploy from GitHub repo"
3. Choose your `lineup` repository again
4. Select the `client` folder as the root directory
5. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL from Step 2 (e.g., `https://your-app.railway.app/api`)
   - `NODE_ENV`: `production`
6. Railway will build and deploy your Next.js app
7. Your site will be live at the provided Railway URL!

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Step 1: Deploy Backend to Railway
Follow Step 2 from Option 1 above.

### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import your `lineup` repository
4. **IMPORTANT**: Before clicking "Deploy", click "Configure Project"
5. In the configuration:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: Click "Edit" and set to `client` (this is critical!)
   - **Build Command**: Leave as default (`npm run build`)
   - **Output Directory**: Leave as default (`.next`)
   - **Install Command**: Leave as default (`npm install`)
6. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL (e.g., `https://your-app.railway.app/api`)
7. Click "Deploy"
8. Your site will be live at a Vercel URL (e.g., `your-app.vercel.app`)

**Note**: If you already deployed and got an error, go to Project Settings → General → Root Directory and change it to `client`, then redeploy.

---

## Environment Variables Summary

### Backend (Railway)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your-random-secret-key-here
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-url.railway.app,https://your-frontend-url.vercel.app
```

### Frontend (Railway or Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
NODE_ENV=production
```

---

## Important Notes

1. **CORS Configuration**: Your backend already allows all origins in development. For production, you may want to restrict CORS to your frontend domain only.

2. **File Uploads**: The `uploads/` folder won't persist on free hosting. Consider using:
   - Cloudinary (free tier)
   - AWS S3 (free tier)
   - Railway volumes (paid)

3. **Database**: MongoDB Atlas free tier is perfect for testing and small projects.

4. **Custom Domains**: Both Railway and Vercel support custom domains (may require paid plans).

---

## Troubleshooting

### Backend won't connect to MongoDB
- Check your MongoDB Atlas connection string
- Ensure IP whitelist includes `0.0.0.0/0` or Railway's IP
- Verify database user credentials

### Frontend can't reach backend
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend is deployed and running
- Check CORS settings in `server/index.js`

### Build errors
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (check Railway/Vercel logs)

---

## Quick Start Commands

After deployment, you can update your code and it will automatically redeploy:

```bash
git add .
git commit -m "Update code"
git push origin main
```

Both Railway and Vercel will automatically redeploy on push to main branch.

