# MongoDB Connection String - Complete Example

## Your Connection String Should Look Like This:

```
mongodb+srv://username:password@cluster.mongodb.net/vibely?retryWrites=true&w=majority
```

## Step-by-Step to Build It:

### 1. Get Base Connection String from MongoDB Atlas:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 2. Add Database Name (`/vibely`) Before the `?`:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
```

## What Each Part Means:

- `mongodb+srv://` - Protocol
- `username:password@` - Your MongoDB Atlas username and password
- `cluster0.xxxxx.mongodb.net` - Your cluster address
- `/vibely` - **Database name** (this is what stores your data!)
- `?retryWrites=true&w=majority` - Connection options

## How to Add It:

1. Copy your connection string from MongoDB Atlas
2. Find the `?` in the string
3. Add `/vibely` right before the `?`
4. Make sure the password is correct (not `<password>`)

## Example:

**From MongoDB Atlas:**
```
mongodb+srv://lineupuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**After replacing password and adding database name:**
```
mongodb+srv://lineupuser:MyPassword123@cluster0.xxxxx.mongodb.net/vibely?retryWrites=true&w=majority
```

## In Render:

1. Go to Render → Your service → Environment tab
2. Find `MONGODB_URI`
3. Make sure it looks like the example above (with `/vibely` before the `?`)
4. Save and redeploy

