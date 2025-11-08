# MongoDB Connection String Format

## What Your Connection String Should Look Like:

```
mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority
```

## Breaking It Down:

- `mongodb+srv://` - Protocol
- `username:password@` - Your credentials (replace username and password)
- `cluster.mongodb.net` - Your cluster address
- `/vibely` - **Database name** (this is what might be missing!)
- `?retryWrites=true&w=majority` - Connection options

## If Your Connection String Doesn't Have the Database Name:

MongoDB Atlas connection strings sometimes don't include the database name. You need to add it!

### Example:

**What MongoDB Atlas gives you:**
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

**What you need (add `/vibely` before the `?`):**
```
mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority
```

## How to Add the Database Name:

1. Copy your connection string from MongoDB Atlas
2. Find the `?` in the string
3. Add `/vibely` right before the `?`
4. Example:
   - Before: `...cluster.mongodb.net/?retryWrites=true...`
   - After: `...cluster.mongodb.net/vibely?retryWrites=true...`

## Or Use a Different Database Name:

If you want to use a different database name (like `lineup`), replace `vibely` with your preferred name:
```
mongodb+srv://username:password@cluster.mongodb.net/lineup?retryWrites=true&w=majority
```

## Full Example:

```
mongodb+srv://lineupuser:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
```

Make sure:
- ✅ Username is correct
- ✅ Password is correct (not `<password>`)
- ✅ Database name is included (`/vibely` or `/lineup`)
- ✅ Connection options are included (`?retryWrites=true&w=majority`)

