# Fix: "No Next.js version detected" Error

## The Problem
Vercel can't find your `package.json` because the Root Directory setting doesn't match where your Next.js app is located.

## Solution: Set Root Directory Correctly

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click on your project

2. **Open Settings**
   - Click **Settings** (top right)
   - Click **General** (left sidebar)

3. **Set Root Directory**
   - Scroll down to find **Root Directory**
   - Click **Edit** (or the pencil icon)
   - **Type exactly**: `client`
   - Click **Save**

4. **Verify the Setting**
   - After saving, you should see: `Root Directory: client`
   - The path should show: `client/package.json`

5. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**

---

## Alternative: Delete and Recreate Project

If the above doesn't work, try recreating the project:

1. **Delete Current Project**
   - Go to Settings → General
   - Scroll to bottom → Click "Delete Project"

2. **Create New Project**
   - Click "Add New Project"
   - Import your `lineup` repository
   - **BEFORE clicking Deploy**, click **"Configure Project"**
   - Set **Root Directory** to: `client`
   - Framework should auto-detect as "Next.js"
   - Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
   - Click **Deploy**

---

## Verification Checklist

After setting Root Directory to `client`, Vercel should:
- ✅ Detect Next.js framework automatically
- ✅ Find `client/package.json` with `next` in dependencies
- ✅ Build from the `client` directory
- ✅ Use `client/vercel.json` for configuration

---

## Still Not Working?

If you've set Root Directory to `client` and it's still failing:

1. **Check the build logs** - Look for where it's trying to find package.json
2. **Verify the path** - It should show: `Installing dependencies from client/package.json`
3. **Check for typos** - Make sure it's exactly `client` (lowercase, no trailing slash)
4. **Try removing vercel.json** - Delete `client/vercel.json` and let Vercel auto-detect

---

## Current Status

✅ `vercel.json` is now in the `client` folder
✅ `package.json` is in the `client` folder with `next` in dependencies
✅ Build works locally

**You just need to set Root Directory to `client` in Vercel dashboard!**

