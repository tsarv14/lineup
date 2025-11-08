# Check Database Connection

## The database is already set up! Here's how to verify it's working:

### Step 1: Check Railway Backend Logs

1. Go to **Railway** dashboard
2. Click on your backend service
3. Click **"Logs"** tab
4. Look for:
   - ✅ `Connected to MongoDB` - means database is connected
   - ❌ `MongoDB connection error` - means there's a problem

### Step 2: Verify MongoDB Atlas Connection

1. Go to **MongoDB Atlas** dashboard
2. Click **"Network Access"** (left sidebar)
3. Make sure you have `0.0.0.0/0` in the IP whitelist (allows all IPs)
4. If not, click **"Add IP Address"** → **"Allow Access from Anywhere"**

### Step 3: Verify Environment Variable

1. Go to **Railway** → Your backend service → **Settings** → **Variables**
2. Check that `MONGODB_URI` is set correctly
3. It should look like: `mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority`
4. Make sure the password in the connection string matches your MongoDB Atlas user password

### Step 4: Test the Connection

The database will automatically create collections when you register a user. MongoDB creates databases and collections automatically when you first save data.

## Common Issues:

**"Account creation failed" could mean:**
1. Database not connected - check Railway logs
2. Wrong MongoDB connection string - check MONGODB_URI in Railway
3. Network access blocked - check MongoDB Atlas IP whitelist
4. Validation error - check browser console for specific error

## Next Steps:

After checking the above, try registering again. The error message should now be more specific about what went wrong.

