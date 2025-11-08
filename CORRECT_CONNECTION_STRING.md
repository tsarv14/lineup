# Correct Connection String Format

## What MongoDB Atlas Gives You:

```
mongodb+srv://sarvertyler4_db_user:<db_password>@cluster0.r5pm1mp.mongodb.net/?appName=Cluster0
```

## What You Need to Do:

### Step 1: Replace `<db_password>`

Replace `<db_password>` with your actual password.

### Step 2: Add Database Name

Add `/vibely` before the `?` to specify the database name.

### Step 3: Final Connection String

Your final connection string should look like:

```
mongodb+srv://sarvertyler4_db_user:YOUR_PASSWORD@cluster0.r5pm1mp.mongodb.net/vibely?appName=Cluster0
```

OR (if you want to use the standard options):

```
mongodb+srv://sarvertyler4_db_user:YOUR_PASSWORD@cluster0.r5pm1mp.mongodb.net/vibely?retryWrites=true&w=majority
```

## Example:

If your password is `MyPassword123`, your connection string would be:

```
mongodb+srv://sarvertyler4_db_user:MyPassword123@cluster0.r5pm1mp.mongodb.net/vibely?appName=Cluster0
```

## Important:

- Replace `YOUR_PASSWORD` with your actual password (not `<db_password>`)
- Add `/vibely` before the `?` (this is the database name)
- Keep `?appName=Cluster0` or change to `?retryWrites=true&w=majority` (both work)

## In Render:

1. Go to Render → Your service → Environment tab
2. Find `MONGODB_URI`
3. Update it with:
   ```
   mongodb+srv://sarvertyler4_db_user:YOUR_PASSWORD@cluster0.r5pm1mp.mongodb.net/vibely?appName=Cluster0
   ```
   (Replace `YOUR_PASSWORD` with your actual password)
4. Save

This should work!

