# Fix MongoDB Password in Render

## The Problem:
`❌ MongoDB connection error: bad auth : authentication failed`

This means the password in your `MONGODB_URI` in Render is wrong.

## How to Fix:

### Step 1: Get Your Correct Password from MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Log in
3. Click **"Database Access"** (left sidebar)
4. Find your database user
5. Click **"Edit"** on the user
6. Click **"Edit Password"**
7. Click **"Autogenerate Secure Password"** and **COPY IT IMMEDIATELY** (you won't see it again!)
8. Click **"Update User"**

### Step 2: Get Your Connection String

1. In MongoDB Atlas, click **"Database"** (left sidebar)
2. Click **"Connect"**
3. Click **"Connect your application"**
4. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/...`)

### Step 3: Build the Complete Connection String

1. Take the connection string from Step 2
2. Replace `<password>` with the password you copied in Step 1
3. Add `/vibely` before the `?` (if it's not already there)
4. Example:
   ```
   mongodb+srv://username:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
   ```

### Step 4: Update in Render

1. Go to **Render** → Your service → **Environment** tab
2. Find `MONGODB_URI`
3. Click **"Edit"** or **"Update"**
4. Paste your **complete** connection string with the **correct password**
5. Make sure it includes:
   - ✅ Correct username
   - ✅ Correct password (not `<password>`)
   - ✅ `/vibely` before the `?`
   - ✅ `?retryWrites=true&w=majority` at the end
6. Click **"Save"**

### Step 5: Wait for Redeploy

1. Render will automatically redeploy
2. Wait 2-3 minutes
3. Check logs again
4. Should see: `✅ Connected to MongoDB`

## Important Notes:

- **Password is case-sensitive** - Make sure you copy it exactly
- **No spaces** - Don't add spaces in the connection string
- **Replace `<password>`** - Don't leave it as `<password>`
- **Include database name** - Must have `/vibely` before the `?`

## Example of Correct Connection String:

```
mongodb+srv://lineupuser:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
```

After updating with the correct password, Render will redeploy and you should see `✅ Connected to MongoDB` in the logs!

