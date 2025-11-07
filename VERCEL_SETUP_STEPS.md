# Vercel Setup - What YOU Need to Do

## The Critical Step You Must Do in Vercel Dashboard

The error "npm run build exited with 127" means Vercel can't find your Next.js app because it's looking in the wrong directory.

## ✅ Step-by-Step: Set Root Directory in Vercel

### 1. Go to Vercel Dashboard
- Open https://vercel.com/dashboard
- Click on your project name

### 2. Open Settings
- Click **Settings** button (top right of the page)
- Click **General** (in the left sidebar)

### 3. Find Root Directory Setting
- Scroll down until you see **"Root Directory"**
- You should see it says something like "Root Directory: /" or it might be empty

### 4. Set Root Directory to `client`
- Click the **Edit** button (or pencil icon) next to Root Directory
- In the text field, type exactly: `client`
- Make sure it's lowercase, no spaces, no trailing slash
- Click **Save**

### 5. Verify It's Set
- After saving, you should see: **"Root Directory: client"**
- The path should show: `client/package.json`

### 6. Redeploy
- Go to the **Deployments** tab (top navigation)
- Find your latest deployment
- Click the **⋯** (three dots) menu
- Click **Redeploy**

---

## What This Does

When Root Directory is set to `client`:
- ✅ Vercel will look for `package.json` in the `client` folder
- ✅ Vercel will find `next` in `client/node_modules`
- ✅ Vercel will run `npm run build` from the `client` directory
- ✅ Your build will succeed!

---

## If You Can't Find Root Directory Setting

If you don't see the Root Directory setting:

1. **Make sure you're in Settings → General** (not another settings page)
2. **Scroll down** - it's usually near the bottom
3. **Try a different browser** or refresh the page
4. **Check if you have the right permissions** - you need to be the project owner

---

## Alternative: Delete and Recreate Project

If you can't find or set the Root Directory:

1. **Delete the current project**:
   - Settings → General → Scroll to bottom → "Delete Project"

2. **Create a new project**:
   - Click "Add New Project"
   - Import your `lineup` repository
   - **IMPORTANT**: Before clicking "Deploy", click **"Configure Project"**
   - In the configuration popup, find **"Root Directory"**
   - Set it to: `client`
   - Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
   - Click **Deploy**

---

## Still Not Working?

If you've set Root Directory to `client` and it's still failing:

1. **Check the build logs** - Look for the first line that shows where it's trying to install dependencies
2. **It should say**: "Installing dependencies from client/package.json"
3. **If it says something else**, the Root Directory isn't set correctly

---

## Summary

**The ONE thing you must do:**
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Set **Root Directory** to: `client`
3. Save and Redeploy

That's it! This is a Vercel dashboard setting, not something in your code.

