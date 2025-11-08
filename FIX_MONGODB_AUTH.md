# Fix MongoDB Authentication Error

## The Problem:
`❌ MongoDB connection error: bad auth : authentication failed`

This means the password in your MongoDB connection string is wrong.

## How to Fix:

### Step 1: Get Your Correct MongoDB Connection String

1. Go to https://cloud.mongodb.com
2. Log in to MongoDB Atlas
3. Click **"Database"** (left sidebar)
4. Click **"Connect"**
5. Click **"Connect your application"**
6. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/...`)

### Step 2: Update the Password

**IMPORTANT**: The connection string has `<password>` - you need to replace it with your actual password!

1. In MongoDB Atlas, go to **"Database Access"** (left sidebar)
2. Find your database user
3. If you forgot the password:
   - Click **"Edit"** on the user
   - Click **"Edit Password"**
   - Click **"Autogenerate Secure Password"** and **COPY IT**
   - Click **"Update User"**

### Step 3: Create the Full Connection String

1. Take the connection string from Step 1
2. Replace `<password>` with the password you just copied
3. Add database name at the end: `?retryWrites=true&w=majority` → `vibely?retryWrites=true&w=majority`
4. Example: `mongodb+srv://username:MyPassword123@cluster.mongodb.net/vibely?retryWrites=true&w=majority`

### Step 4: Update Render Environment Variable

1. Go to **Render** → Your service → **Environment** tab
2. Find `MONGODB_URI`
3. Click **"Edit"** or **"Update"**
4. Paste your **correct** connection string (with the real password)
5. Click **"Save"**

### Step 5: Redeploy

1. Render will automatically redeploy
2. Wait 1-2 minutes
3. Check logs again - should see: `✅ Connected to MongoDB`

## Common Mistakes:

❌ **Wrong**: `mongodb+srv://username:<password>@cluster.mongodb.net/...`
✅ **Correct**: `mongodb+srv://username:ActualPassword123@cluster.mongodb.net/vibely?retryWrites=true&w=majority`

❌ **Wrong**: Using the password from when you first created the user (might have changed)
✅ **Correct**: Use the current password or reset it

## After Fixing:

Once you update the MONGODB_URI in Render with the correct password, the service will redeploy and connect successfully!

