# How to Grant Admin Access

This guide explains multiple methods to grant yourself admin access to the platform.

## Prerequisites

- You must have an account registered on the platform (with an email address)
- You need access to your MongoDB database (either locally or via MongoDB Atlas)

---

## Method 1: Using the Script (Recommended - Easiest)

### Step 1: Navigate to Server Directory
```bash
cd server
```

### Step 2: Run the Grant Admin Script
```bash
# Option A: Pass email as argument
npm run grant:admin your-email@example.com

# Option B: Set ADMIN_EMAIL in .env file first, then run
npm run grant:admin
```

### Step 3: Verify
- The script will confirm if admin access was granted
- You should see: `✅ Admin access granted to "your-email@example.com"`
- Now you can access `/admin` in your browser

---

## Method 2: Using MongoDB Atlas (Web Interface)

### Step 1: Log into MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster

### Step 2: Access Database
1. Click **"Browse Collections"**
2. Navigate to your database (usually `vibely`)
3. Open the `users` collection

### Step 3: Find Your User
1. Search for your user document by email
2. Click on the document to edit it

### Step 4: Update Roles
1. Find the `roles` field (it should be an array like `["subscriber"]`)
2. Add `"admin"` to the array: `["subscriber", "admin"]`
3. Click **"Update"** to save

### Step 5: Verify
- Refresh your browser and navigate to `/admin`
- You should now have admin access

---

## Method 3: Using MongoDB Compass (Desktop App)

### Step 1: Download MongoDB Compass
- Download from: https://www.mongodb.com/try/download/compass

### Step 2: Connect to Your Database
1. Open MongoDB Compass
2. Enter your connection string (from `.env` file: `MONGODB_URI`)
3. Click **"Connect"**

### Step 3: Navigate to Users Collection
1. Select your database (usually `vibely`)
2. Click on `users` collection
3. Find your user document (search by email)

### Step 4: Edit Roles
1. Click on the document to edit
2. Find the `roles` field
3. Change from: `["subscriber"]` to `["subscriber", "admin"]`
4. Click **"Update"**

### Step 5: Verify
- Refresh your browser and navigate to `/admin`

---

## Method 4: Using MongoDB Shell (Command Line)

### Step 1: Connect to MongoDB
```bash
# If using MongoDB Atlas, get connection string from your .env file
mongosh "your-mongodb-connection-string"
```

### Step 2: Switch to Your Database
```javascript
use vibely
```

### Step 3: Update User Roles
```javascript
// Replace 'your-email@example.com' with your actual email
db.users.updateOne(
  { email: "your-email@example.com" },
  { $addToSet: { roles: "admin" } }
)
```

### Step 4: Verify
```javascript
// Check if admin role was added
db.users.findOne({ email: "your-email@example.com" })
```

---

## Method 5: Direct Node.js Script (Advanced)

If you want to create a custom script:

```javascript
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function grantAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'your-email@example.com' });
  if (!user.roles.includes('admin')) {
    user.roles.push('admin');
    await user.save();
    console.log('Admin access granted!');
  }
  
  process.exit(0);
}

grantAdmin();
```

---

## Troubleshooting

### "User not found" Error
- Make sure you've registered an account first
- Check that the email address is correct (case-insensitive)
- Verify you're connected to the correct database

### "Authentication failed" Error
- Check your `MONGODB_URI` in the `.env` file
- Make sure the password is correct (no special characters need encoding)
- Verify network access in MongoDB Atlas allows your IP

### "Cannot connect to MongoDB"
- Check your internet connection
- Verify MongoDB Atlas cluster is running
- Check if your IP is whitelisted in MongoDB Atlas Network Access

### Admin Dashboard Still Not Accessible
- Clear your browser cache and cookies
- Log out and log back in
- Check browser console for errors
- Verify the `roles` array in MongoDB contains `"admin"`

---

## Verifying Admin Access

After granting admin access:

1. **Log out and log back in** (to refresh your session)
2. Navigate to `/admin` in your browser
3. You should see the Admin Dashboard
4. Click on "Creator Applications" to manage applications

---

## Security Notes

⚠️ **Important Security Considerations:**

- Only grant admin access to trusted users
- Admin users have full access to:
  - Approve/reject creator applications
  - View all user data
  - Access all creator content
- Consider creating a separate admin account instead of upgrading your personal account
- Keep your admin credentials secure

---

## Quick Reference

**Fastest Method:**
```bash
cd server
npm run grant:admin your-email@example.com
```

**MongoDB Atlas Method:**
1. Browse Collections → `users` collection
2. Find your user by email
3. Add `"admin"` to `roles` array
4. Update and save

**After granting access:**
- Log out and log back in
- Visit `/admin` to access admin dashboard

