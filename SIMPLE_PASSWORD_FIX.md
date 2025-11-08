# Simple Fix: Create New Password Without Special Characters

## The Problem:

MongoDB passwords with special characters (like `@`, `#`, `$`, `%`, etc.) can cause authentication issues. Let's create a simple password instead.

## Step-by-Step Fix:

### Step 1: Create a Simple Password in MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Log in
3. Click **"Database Access"** (left sidebar)
4. Find your database user
5. Click **"Edit"** on the user
6. Click **"Edit Password"**
7. **Type a simple password** (no special characters):
   - Example: `MyPassword123` or `Lineup2024` or `password123`
   - **No special characters** like `@`, `#`, `$`, `%`, `&`, etc.
8. Click **"Update User"**

### Step 2: Get Your Connection String

1. In MongoDB Atlas, click **"Database"** (left sidebar)
2. Click **"Connect"**
3. Click **"Connect your application"**
4. Copy the connection string

### Step 3: Build Connection String

1. Take the connection string from Step 2
2. Replace `<password>` with your **simple password** from Step 1
3. Add `/vibely` before the `?` (if not already there)
4. Example:
   ```
   mongodb+srv://lineupuser:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
   ```

### Step 4: Update in Render

1. Go to **Render** → Your service → **Environment** tab
2. Find `MONGODB_URI`
3. Click **"Edit"**
4. **Delete the old value completely**
5. Paste your new connection string with the simple password
6. **Double-check:**
   - Username is correct
   - Password is the simple one you just created (no special chars)
   - Has `/vibely` before the `?`
   - Has `?retryWrites=true&w=majority` at the end
7. Click **"Save"**

### Step 5: Wait and Check

1. Render will redeploy automatically
2. Wait 2-3 minutes
3. Check logs
4. Should see: `✅ Connected to MongoDB`

## Example Connection String:

```
mongodb+srv://lineupuser:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
```

**Make sure:**
- `lineupuser` = Your actual username
- `MyPassword123` = Your simple password (no special chars)
- `/vibely` = Database name
- Rest of the string is correct

Try this and let me know if it works!

