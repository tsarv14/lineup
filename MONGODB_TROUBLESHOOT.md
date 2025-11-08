# MongoDB Authentication Troubleshooting

## If Password Still Doesn't Work:

### Issue 1: Special Characters in Password

MongoDB passwords with special characters need to be **URL-encoded** in the connection string.

**Special characters that need encoding:**
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `/` becomes `%2F`
- `?` becomes `%3F`

### Solution: Create a Simple Password

1. Go to MongoDB Atlas → Database Access
2. Click "Edit" on your user
3. Click "Edit Password"
4. **Don't use autogenerate** - instead, type a simple password like: `MyPassword123` (no special characters)
5. Click "Update User"
6. Use this simple password in your connection string

### Issue 2: Wrong Username

Make sure you're using the correct username:
1. In MongoDB Atlas → Database Access
2. Check what username you're using
3. Make sure it matches in your connection string

### Issue 3: Connection String Format

Your connection string should look exactly like this:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/vibely?retryWrites=true&w=majority
```

**Check:**
- ✅ No spaces anywhere
- ✅ Username before the `:`
- ✅ Password after the `:` and before the `@`
- ✅ `/vibely` before the `?`
- ✅ No `<password>` or `<username>` placeholders

### Issue 4: Database User Permissions

1. In MongoDB Atlas → Database Access
2. Make sure your user has **"Read and write to any database"** permission
3. If not, click "Edit" → Change permissions → Select "Read and write to any database"

## Try This:

1. **Create a new simple password** (no special characters)
2. **Update the password** in MongoDB Atlas
3. **Update MONGODB_URI** in Render with the new simple password
4. **Wait for redeploy**
5. **Check logs**

## Alternative: Test Connection String Locally

If you want to test if the connection string works:
1. Copy your connection string
2. Try connecting with MongoDB Compass or a MongoDB client
3. If it works there, the connection string is correct
4. If it doesn't work, the password/username is wrong

Let me know if you want to try creating a new simple password!

