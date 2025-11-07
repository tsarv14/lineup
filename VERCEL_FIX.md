# Fix Vercel Deployment Error: "next: command not found"

## The Problem
Vercel is trying to build from the root directory instead of the `client` directory, so it can't find the `next` command.

## Solution: Set Root Directory in Vercel Dashboard

### Step 1: Go to Vercel Project Settings
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Click **Settings** (top right)
4. Click **General** (left sidebar)

### Step 2: Set Root Directory
1. Scroll down to **Root Directory**
2. Click **Edit** (or the pencil icon)
3. Type: `client`
4. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Or push a new commit to trigger a new deployment

---

## Alternative: Delete and Recreate Project

If the above doesn't work:

1. **Delete the current project** in Vercel dashboard
2. **Create a new project**:
   - Click "Add New Project"
   - Import your `lineup` repository
   - **BEFORE clicking Deploy**, click **"Configure Project"**
   - Set **Root Directory** to `client`
   - Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
   - Click **Deploy**

---

## Verify Root Directory is Set

After setting the root directory, you should see:
- In the build logs, it should show: `Installing dependencies from client/package.json`
- The build should run from the `client` directory

---

## About the Git Submodule Warning

The warning about git submodules is likely related to the `lineup/` folder in your repo. This shouldn't affect the build, but if you want to fix it:

1. If `lineup/` is not needed, you can delete it
2. Or add it to `.gitignore` if it's a local folder

This warning won't prevent deployment, but the root directory issue will.

---

## Still Not Working?

If you've set the root directory correctly and it's still failing:

1. **Check the build logs** - Look for where it's trying to run `npm install`
2. **Verify the path** - It should show `Installing dependencies from client/package.json`
3. **Try removing vercel.json** - Delete the root `vercel.json` file and rely only on dashboard settings
4. **Contact Vercel support** - They can check your project configuration

